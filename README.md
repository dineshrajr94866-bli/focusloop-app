# FocusLoop — ADHD-friendly productivity app

A full-stack task, focus-timer, habit, and mood-tracking app built with a
low-friction, non-punishing design: one clear "next thing" at a time, a
visual focus timer, and small dopamine-friendly wins (streaks, check-ins).

## Stack
- **Backend:** Node.js + Express + SQLite (via `better-sqlite3`) — single file
  database, zero external setup.
- **Frontend:** React + Vite + Tailwind CSS.
- No authentication — this is built as a single-user local/personal app. See
  "Adding accounts later" below if you want to support multiple people.

## Project structure
```
adhd-app/
  server/       Express API (port 4000)
  client/       React app (port 5173 in dev)
```

## Running it locally

You'll need Node.js 18+ installed.

**1. Start the backend**
```bash
cd server
npm install
npm start
```
This runs the API on http://localhost:4000 and creates `server/focusloop.db`
automatically on first run.

**2. Start the frontend** (in a second terminal)
```bash
cd client
npm install
npm run dev
```
This runs the app on http://localhost:5173 and proxies `/api` calls to the
backend, so open that URL in your browser.

## Building for production

```bash
cd client
npm run build
```
This outputs static files to `client/dist`. Serve them with any static host
(Netlify, Vercel, nginx, etc.) and point the frontend's API calls at your
deployed backend (see `client/vite.config.js`'s proxy — in production you'll
want to set the real API URL, e.g. via an environment variable and a small
change to `client/src/api.js`'s `BASE` constant).

Run the backend anywhere that supports Node.js (Render, Railway, Fly.io, a
VPS, etc.). Because it uses SQLite, make sure the host's disk persists
between deploys, or swap in Postgres/MySQL later if you need multi-instance
scaling.

## Features included
- **Tasks** — create tasks with priority (low/medium/high/urgent), mark
  done, delete, and break a big task into small subtasks either one at a
  time or by pasting a multi-line list ("Break this down").
- **Right Now (focus timer)** — pick a task, pick a duration (5/15/25/45
  min), and run a circular focus timer with automatic 5-minute breaks.
  Completed sessions are logged and today's totals are shown.
- **Habits** — add habits with an emoji, check them off for the day, see
  a rolling streak count and a 30-day dot history.
- **Mood & energy log** — quick emoji-based mood and energy check-ins with
  an optional note, shown as a scrollable recent history.

## Adding accounts later
The API and database are structured per-resource (tasks, habits, moods,
sessions) without a `user_id` column. To make this multi-user: add a `users`
table, add `user_id` foreign keys to the other tables, add an auth
middleware (e.g. JWT or session cookies) in `server/server.js`, and filter
every query in `server/routes/*.js` by the authenticated user's id.

## Notes on the design
The visual design leans into a calm violet/teal palette instead of a
generic bright dashboard, uses a single circular "Focus Ring" as the
app's signature element, and keeps each screen to one job at a time to
reduce decision fatigue — all deliberate choices for an ADHD-focused tool.
