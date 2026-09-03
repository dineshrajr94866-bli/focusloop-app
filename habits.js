import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';

const router = Router();

function computeStreak(habitId) {
  const rows = db.prepare('SELECT date FROM habit_logs WHERE habit_id = ? ORDER BY date DESC').all(habitId);
  const dates = new Set(rows.map(r => r.date));
  let streak = 0;
  let cursor = new Date();
  // today counts if logged; otherwise streak counts back from yesterday
  if (!dates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

router.get('/', (req, res) => {
  const habits = db.prepare('SELECT * FROM habits WHERE archived = 0 ORDER BY created_at ASC').all();
  const last30 = new Date();
  last30.setDate(last30.getDate() - 29);
  const cutoff = last30.toISOString().slice(0, 10);

  const result = habits.map(h => {
    const logs = db.prepare('SELECT date FROM habit_logs WHERE habit_id = ? AND date >= ? ORDER BY date ASC').all(h.id, cutoff);
    return {
      ...h,
      streak: computeStreak(h.id),
      recentLogs: logs.map(l => l.date),
      loggedToday: logs.some(l => l.date === new Date().toISOString().slice(0, 10))
    };
  });
  res.json(result);
});

router.post('/', (req, res) => {
  const { name, emoji = '\u2728', color = '#6C5CE7', target_per_week = 7 } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const id = nanoid();
  db.prepare('INSERT INTO habits (id, name, emoji, color, target_per_week) VALUES (?, ?, ?, ?, ?)')
    .run(id, name.trim(), emoji, color, target_per_week);
  res.status(201).json(db.prepare('SELECT * FROM habits WHERE id = ?').get(id));
});

// Toggle today's (or a given date's) check-in
router.post('/:id/toggle', (req, res) => {
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const existing = db.prepare('SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?').get(req.params.id, date);
  if (existing) {
    db.prepare('DELETE FROM habit_logs WHERE id = ?').run(existing.id);
    res.json({ toggled: false, date });
  } else {
    db.prepare('INSERT INTO habit_logs (id, habit_id, date) VALUES (?, ?, ?)').run(nanoid(), req.params.id, date);
    res.json({ toggled: true, date, streak: computeStreak(req.params.id) });
  }
});

router.patch('/:id', (req, res) => {
  const fields = ['name', 'emoji', 'color', 'target_per_week', 'archived'];
  const updates = {};
  for (const f of fields) if (f in req.body) updates[f] = req.body[f];
  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  if (setClause) db.prepare(`UPDATE habits SET ${setClause} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  res.json(db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM habits WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
