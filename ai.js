import { Router } from 'express';
import { nanoid } from 'nanoid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import db from '../db.js';

const router = Router();
const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

function makeCoachSystemPrompt() {
  return `You are FocusLoop AI Coach, a calm and encouraging productivity coach for ADHD users.

Your job is to help the user reduce overwhelm, pick the next best action, and keep momentum without guilt.

Rules:
- Keep responses short, warm, and practical.
- Prefer one next step over long planning.
- Suggest tiny, achievable actions.
- Be gentle when the user is overwhelmed or tired.
- If the user asks for planning, break it into a 1-3 step plan.
- Never shame the user.
- If there are tasks, center the reply around one task and one next action.
- If there are no tasks, suggest a micro-reset or a tiny habit win.`;
}

function buildFallbackReply(prompt = '') {
  const text = String(prompt || '').toLowerCase();

  if (text.includes('overwhelm') || text.includes('stress') || text.includes('too much')) {
    return 'You do not need a full plan today. Pick one task, make it tiny, and do only 10 minutes. The goal is momentum, not perfection.';
  }

  if (text.includes('next step') || text.includes('what should i do') || text.includes('plan')) {
    return 'Start with the smallest possible win: choose one task, set a 10-minute timer, and stop when the timer ends. That is enough for today.';
  }

  if (text.includes('tired') || text.includes('low energy')) {
    return 'Low-energy days still count. Do a micro-reset: drink water, clear one small task, and keep the bar intentionally tiny.';
  }

  return 'Keep it simple: choose one priority task, do the first tiny step, and let the rest wait. Progress beats pressure.';
}

async function generateCoachReply({ prompt, history, apiKey }) {
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastError;
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: makeCoachSystemPrompt()
      });

      const contents = [
        ...history.map(item => ({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(item.text || '') }]
        })),
        { role: 'user', parts: [{ text: String(prompt) }] }
      ];

      const result = await model.generateContent({ contents });
      const text = result?.response?.text?.() || 'I could not generate a reply right now.';
      return { reply: text.trim() };
    } catch (error) {
      lastError = error;
      if (error?.status === 404 || error?.message?.includes('not found') || error?.message?.includes('not supported')) {
        console.warn(`Gemini model ${modelName} is unavailable, trying next supported option.`);
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('No Gemini model was available.');
}

// GET chat history
router.get('/history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const rows = db.prepare('SELECT id, role, text, created_at FROM ai_chat_history ORDER BY created_at ASC, rowid ASC LIMIT ?').all(limit);
  res.json(rows);
});

// CLEAR chat history
router.delete('/history', (req, res) => {
  db.prepare('DELETE FROM ai_chat_history').run();
  res.json({ cleared: true });
});

router.post('/chat', async (req, res) => {
  try {
    const { prompt = '', history = [], userText = '' } = req.body || {};
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const displayText = (userText && userText.trim()) || prompt.trim();
    const userMsgId = nanoid();

    // Persist user message to database
    db.prepare('INSERT INTO ai_chat_history (id, role, text) VALUES (?, ?, ?)')
      .run(userMsgId, 'user', displayText);

    let reply = '';
    let fallback = false;
    let message = '';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      reply = buildFallbackReply(prompt);
      fallback = true;
      message = 'No Gemini key is configured yet, so the local coach is helping instead.';
    } else {
      try {
        const result = await generateCoachReply({ prompt, history, apiKey });
        reply = result.reply;
      } catch (error) {
        console.error('Gemini chat error:', error);
        reply = buildFallbackReply(prompt);
        fallback = true;
        message = 'The Gemini model is unavailable right now, so the local coach is helping instead.';
      }
    }

    // Persist assistant reply to database
    const assistantMsgId = nanoid();
    db.prepare('INSERT INTO ai_chat_history (id, role, text) VALUES (?, ?, ?)')
      .run(assistantMsgId, 'assistant', reply);

    return res.json({
      reply,
      fallback,
      message,
      userMessage: { id: userMsgId, role: 'user', text: displayText },
      assistantMessage: { id: assistantMsgId, role: 'assistant', text: reply }
    });
  } catch (error) {
    console.error('Chat route error:', error);
    return res.status(500).json({
      error: error?.message || 'The AI assistant could not respond right now.'
    });
  }
});

export default router;
