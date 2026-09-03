import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 60, 500);
  const rows = db.prepare('SELECT * FROM moods ORDER BY created_at DESC LIMIT ?').all(limit);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { mood, energy, note = '' } = req.body;
  if (![1, 2, 3, 4, 5].includes(mood) || ![1, 2, 3, 4, 5].includes(energy)) {
    return res.status(400).json({ error: 'mood and energy must be integers 1-5' });
  }
  const id = nanoid();
  db.prepare('INSERT INTO moods (id, mood, energy, note) VALUES (?, ?, ?, ?)').run(id, mood, energy, note);
  res.status(201).json(db.prepare('SELECT * FROM moods WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM moods WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
