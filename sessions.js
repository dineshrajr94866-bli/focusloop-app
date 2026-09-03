import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows = db.prepare(`SELECT * FROM focus_sessions WHERE date(completed_at) = ? ORDER BY completed_at DESC`).all(today);
  res.json(rows);
});

router.get('/stats', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const row = db.prepare(`
    SELECT
      COUNT(*) AS sessionsToday,
      COALESCE(SUM(CASE WHEN type = 'focus' THEN duration_minutes ELSE 0 END), 0) AS focusMinutesToday
    FROM focus_sessions WHERE date(completed_at) = ? AND type = 'focus'
  `).get(today);
  res.json(row);
});

router.post('/', (req, res) => {
  const { task_id = null, type = 'focus', duration_minutes } = req.body;
  if (!duration_minutes || duration_minutes <= 0) return res.status(400).json({ error: 'duration_minutes is required' });
  const id = nanoid();
  db.prepare('INSERT INTO focus_sessions (id, task_id, type, duration_minutes) VALUES (?, ?, ?, ?)')
    .run(id, task_id, type, duration_minutes);
  res.status(201).json(db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(id));
});

export default router;
