import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import habitsRouter from './routes/habits.js';
import moodsRouter from './routes/moods.js';
import sessionsRouter from './routes/sessions.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/tasks', tasksRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/moods', moodsRouter);
app.use('/api/sessions', sessionsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`FocusLoop API running on http://localhost:${PORT}`);
});
