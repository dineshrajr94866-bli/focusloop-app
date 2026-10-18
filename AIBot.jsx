import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';

const defaultPrompt = 'Give me the best next step for today based on my current focus, tasks, and mood.';
const initialWelcome = {
  role: 'assistant',
  text: 'I can help you choose the next tiny step and calm the overwhelm. Ask me anything about today.'
};

export default function AIBot({ tasks, habits, moods }) {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([initialWelcome]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const history = await api.getAIChatHistory();
        if (Array.isArray(history) && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([initialWelcome]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const contextSummary = useMemo(() => {
    const openTasks = (tasks || []).filter(task => task.status !== 'done').slice(0, 5);
    const recentMood = (moods || []).slice(0, 1)[0];
    const activeHabits = (habits || []).slice(0, 3);

    return {
      openTasks,
      recentMood,
      activeHabits
    };
  }, [tasks, habits, moods]);

  async function handleSubmit(e) {
    e.preventDefault();
    const prompt = draft.trim() || defaultPrompt;
    if (!prompt) return;

    setLoading(true);
    setError('');
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setDraft('');

    try {
      const assistantPrompt = `Here is my current context:\n- Open tasks: ${contextSummary.openTasks.length ? contextSummary.openTasks.map(t => t.title).join(', ') : 'none'}\n- Active habits: ${contextSummary.activeHabits.length ? contextSummary.activeHabits.map(h => h.name).join(', ') : 'none'}\n- Latest mood: ${contextSummary.recentMood ? `mood ${contextSummary.recentMood.mood}, energy ${contextSummary.recentMood.energy}` : 'not logged yet'}\n\nUser request: ${prompt}`;

      const response = await api.askCoach(
        assistantPrompt,
        messages.map(message => ({
          role: message.role,
          text: message.text
        })),
        prompt
      );

      setMessages(prev => [...prev, {
        id: response?.assistantMessage?.id,
        role: 'assistant',
        text: response.reply
      }]);
    } catch (err) {
      const message = err?.message || 'The AI coach could not respond right now.';
      setError(message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: message
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearHistory() {
    if (!window.confirm('Clear all AI chat history?')) return;
    try {
      await api.clearAIChatHistory();
      setMessages([initialWelcome]);
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to clear chat history.');
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-surface rounded-xl2 shadow-card p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-inkSoft">AI Coach</p>
            <h2 className="font-display text-2xl font-700 text-ink">FocusLoop guide</h2>
          </div>
          <div className="w-11 h-11 rounded-full bg-focus-soft flex items-center justify-center text-xl">✨</div>
        </div>

        <p className="text-sm text-inkSoft">
          A Gemini-powered assistant that helps you choose the next tiny step, calm the overwhelm, and keep your momentum. Chat history is automatically saved.
        </p>
      </section>

      <section className="bg-surface rounded-xl2 shadow-card p-5">
        <div className="flex items-center justify-between mb-3 border-b border-focus-soft/50 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-inkSoft">
            Conversation History
          </span>
          {messages.length > 1 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs text-inkSoft hover:text-red-500 transition-colors"
            >
              Clear chat
            </button>
          )}
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {loadingHistory ? (
            <p className="text-sm text-inkSoft py-4 text-center">Loading conversation history…</p>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id || `${message.role}-${index}`}
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'assistant'
                    ? 'bg-focus-soft text-focus-dark'
                    : 'ml-auto bg-reward-soft text-ink'
                }`}
              >
                {message.text}
              </div>
            ))
          )}
          {loading && (
            <div className="max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 bg-focus-soft text-focus-dark animate-pulse">
              Thinking…
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Ask for a plan, a reset, or the next best step"
            className="flex-1 px-4 py-2.5 rounded-lg border border-focus-soft focus:border-focus outline-none text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-focus text-white font-semibold text-sm hover:bg-focus-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Thinking…' : 'Ask AI'}
          </button>
        </form>
      </section>
    </div>
  );
}
