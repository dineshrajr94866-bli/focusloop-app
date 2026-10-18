import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';

const router = Router();

function attachSubtasks(tasks, all) {
  return tasks.map(t => ({
    ...t,
    subtasks: all.filter(s => s.parent_id === t.id)
  }));
}

// GET all top-level tasks with nested subtasks
router.get('/', (req, res) => {
  const all = db.prepare('SELECT * FROM tasks ORDER BY order_index ASC, created_at ASC').all();
  const topLevel = all.filter(t => !t.parent_id);
  res.json(attachSubtasks(topLevel, all));
});

// CREATE a task or subtask
router.post('/', (req, res) => {
  const { title, notes = '', priority = 'medium', due_date = null, estimated_minutes = null, parent_id = null } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

  const id = nanoid();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), -1) AS m FROM tasks WHERE parent_id IS ?').get(parent_id).m;

  db.prepare(`
    INSERT INTO tasks (id, parent_id, title, notes, priority, due_date, estimated_minutes, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, parent_id, title.trim(), notes, priority, due_date, estimated_minutes, maxOrder + 1);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json(task);
});

// "Break this down" helper: create several subtasks at once under a parent
router.post('/:id/breakdown', (req, res) => {
  const { steps } = req.body; // array of strings
  const parent = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!parent) return res.status(404).json({ error: 'Task not found' });
  if (!Array.isArray(steps) || steps.length === 0) return res.status(400).json({ error: 'steps must be a non-empty array' });

  const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), -1) AS m FROM tasks WHERE parent_id = ?').get(parent.id).m;
  const insert = db.prepare(`
    INSERT INTO tasks (id, parent_id, title, order_index) VALUES (?, ?, ?, ?)
  `);
  const created = [];
  steps.forEach((s, i) => {
    if (!s || !s.trim()) return;
    const id = nanoid();
    insert.run(id, parent.id, s.trim(), maxOrder + 1 + i);
    created.push(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
  });
  res.status(201).json(created);
});

// UPDATE a task (title, notes, priority, status, due date, order, estimate)
router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const fields = ['title', 'notes', 'priority', 'status', 'due_date', 'estimated_minutes', 'order_index'];
  const updates = {};
  for (const f of fields) if (f in req.body) updates[f] = req.body[f];

  if (updates.status === 'done' && existing.status !== 'done') {
    updates.completed_at = new Date().toISOString();
  } else if (updates.status && updates.status !== 'done') {
    updates.completed_at = null;
  }

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  if (setClause) {
    db.prepare(`UPDATE tasks SET ${setClause} WHERE id = ?`).run(...Object.values(updates), req.params.id);
  }
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
});

// DELETE a task (cascades to subtasks)
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
