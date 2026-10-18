import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import habitsRouter from './routes/habits.js';
import moodsRouter from './routes/moods.js';
import sessionsRouter from './routes/sessions.js';
import aiRouter from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, '../client/dist');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/tasks', tasksRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/moods', moodsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/ai', aiRouter);

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`FocusLoop API running on http://localhost:${PORT}`);
});
