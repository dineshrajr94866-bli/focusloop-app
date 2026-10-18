import { useEffect, useRef, useState } from 'react';
import FocusRing from './FocusRing.jsx';
import { api } from '../api.js';

const DURATIONS = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '25 min', minutes: 25 },
  { label: '45 min', minutes: 45 }
];
const BREAK_MINUTES = 5;
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildDefaultWeeklyPlan() {
  return WEEK_DAYS.map((day, index) => ({
    id: `day-${index}`,
    day,
    goal: index === 0 ? 'Start with one key task' : ''
  }));
}

export default function FocusView({ tasks, onTaskUpdated, onCreateTask }) {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newTodo, setNewTodo] = useState('');
  const [minutes, setMinutes] = useState(25);
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ sessionsToday: 0, focusMinutesToday: 0 });
  const [resetChecklist, setResetChecklist] = useState([
    { id: 'water', label: 'Drink water', done: false },
    { id: 'clear', label: 'Clear one small surface', done: false },
    { id: 'breath', label: 'Take 3 slow breaths', done: false },
    { id: 'phone', label: 'Silence notifications', done: false }
  ]);
  const [weeklyPlan, setWeeklyPlan] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('focusloop-weekly-plan') || 'null');
      if (Array.isArray(saved) && saved.length === WEEK_DAYS.length) return saved;
    } catch {
      // ignore malformed storage
    }
    return buildDefaultWeeklyPlan();
  });
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  });
  const [reminder, setReminder] = useState(() => {
    try {
      return localStorage.getItem('focusloop-reminder') || 'Reply to the client by 4 PM';
    } catch {
      return 'Reply to the client by 4 PM';
    }
  });
  const [reminderTime, setReminderTime] = useState(() => {
    try {
      return localStorage.getItem('focusloop-reminder-time') || '16:00';
    } catch {
      return '16:00';
    }
  });
  const [reminderDone, setReminderDone] = useState(() => {
    try {
      return localStorage.getItem('focusloop-reminder-done') === 'true';
    } catch {
      return false;
    }
  });
  const intervalRef = useRef(null);

  const actionable = tasks.filter(t => t.status !== 'done');
  const selectedTask = actionable.find(t => t.id === selectedTaskId) || actionable[0] || null;

  useEffect(() => {
    refreshStats();
  }, []);

  useEffect(() => {
    localStorage.setItem('focusloop-weekly-plan', JSON.stringify(weeklyPlan));
  }, [weeklyPlan]);

  useEffect(() => {
    localStorage.setItem('focusloop-reminder', reminder);
  }, [reminder]);

  useEffect(() => {
    localStorage.setItem('focusloop-reminder-time', reminderTime);
  }, [reminderTime]);

  useEffect(() => {
    localStorage.setItem('focusloop-reminder-done', String(reminderDone));
  }, [reminderDone]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  async function refreshStats() {
    try {
      setStats(await api.getSessionStats());
    } catch {
      /* non-critical */
    }
  }

  function resetTimer(mins = minutes, m = mode) {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSecondsLeft(mins * 60);
    setMode(m);
  }

  function pickDuration(mins) {
    setMinutes(mins);
    resetTimer(mins, 'focus');
  }

  async function handleSessionComplete() {
    setRunning(false);
    try {
      await api.createSession({
        task_id: mode === 'focus' ? selectedTask?.id ?? null : null,
        type: mode,
        duration_minutes: mode === 'focus' ? minutes : BREAK_MINUTES
      });
    } catch {
      /* keep going even if logging fails */
    }
    refreshStats();
    if (mode === 'focus') {
      resetTimer(BREAK_MINUTES, 'break');
    } else {
      resetTimer(minutes, 'focus');
    }
  }

  async function markDone() {
    if (!selectedTask) return;
    await onTaskUpdated(selectedTask.id, { status: 'done' });
    setSelectedTaskId(null);
  }

  function toggleResetItem(id) {
    setResetChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  }

  function updateWeeklyGoal(value) {
    setWeeklyPlan(prev => prev.map((item, index) => index === selectedDayIndex ? { ...item, goal: value } : item));
  }

  function toggleReminderDone() {
    setReminderDone(prev => !prev);
  }

  async function handleQuickAddTodo(event) {
    event.preventDefault();
    const trimmed = newTodo.trim();
    if (!trimmed || !onCreateTask) return;

    await onCreateTask({ title: trimmed });
    setNewTodo('');
  }

  const quickWins = [
    'Write the next tiny step',
    'Answer one message only',
    'Take a 5-minute stretch',
    'Close extra tabs',
    'Finish just one task card'
  ];

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-8">
      <section className="bg-surface rounded-xl2 shadow-card p-8 flex flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-inkSoft mb-1">Working on</p>
        <h2 className="font-display text-2xl font-600 text-ink mb-6 min-h-[2rem]">
          {selectedTask ? selectedTask.title : 'Nothing queued — add a task to begin'}
        </h2>

        <FocusRing secondsLeft={secondsLeft} totalSeconds={mode === 'focus' ? minutes * 60 : BREAK_MINUTES * 60} mode={mode} />

        <div className="flex items-center gap-2 mt-8">
          {DURATIONS.map(d => (
            <button
              key={d.minutes}
              onClick={() => pickDuration(d.minutes)}
              disabled={running}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-40 ${
                minutes === d.minutes && mode === 'focus'
                  ? 'bg-focus text-white'
                  : 'bg-focus-soft text-focus-dark hover:bg-focus/20'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          {!running ? (
            <button
              onClick={() => setRunning(true)}
              disabled={secondsLeft === 0}
              className="px-6 py-3 rounded-full bg-focus text-white font-semibold shadow-soft hover:bg-focus-dark transition-colors"
            >
              {secondsLeft === (mode === 'focus' ? minutes * 60 : BREAK_MINUTES * 60) ? 'Start' : 'Resume'}
            </button>
          ) : (
            <button
              onClick={() => setRunning(false)}
              className="px-6 py-3 rounded-full bg-energy text-white font-semibold shadow-soft hover:opacity-90 transition-opacity"
            >
              Pause
            </button>
          )}
          <button
            onClick={() => resetTimer(mode === 'focus' ? minutes : BREAK_MINUTES, mode)}
            className="px-5 py-3 rounded-full bg-canvas border border-focus-soft text-inkSoft font-medium hover:bg-focus-soft transition-colors"
          >
            Reset
          </button>
        </div>

        {selectedTask && (
          <button
            onClick={markDone}
            className="mt-6 text-sm font-semibold text-calm hover:underline underline-offset-4"
          >
            ✓ Mark this task done
          </button>
        )}

        <div className="w-full mt-8 pt-6 border-t border-focus-soft text-left">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-inkSoft">Daily reset</p>
            <span className="text-[11px] text-inkSoft">
              {resetChecklist.filter(item => item.done).length}/{resetChecklist.length}
            </span>
          </div>

          <div className="space-y-2">
            {resetChecklist.map(item => (
              <button
                key={item.id}
                onClick={() => toggleResetItem(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                  item.done
                    ? 'bg-calm/10 border-calm/30 text-calm font-medium'
                    : 'bg-white border-focus-soft text-ink hover:bg-focus-soft'
                }`}
              >
                {item.done ? '✓ ' : '○ '} {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full mt-6 pt-6 border-t border-focus-soft text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-inkSoft mb-3">Tiny wins</p>
          <div className="flex flex-wrap gap-2">
            {quickWins.map(win => (
              <span key={win} className="px-2.5 py-1.5 rounded-full bg-focus-soft text-focus-dark text-xs font-medium">
                {win}
              </span>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="bg-surface rounded-xl2 shadow-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-inkSoft mb-3">Today</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-700 text-focus">{stats.sessionsToday}</span>
            <span className="text-sm text-inkSoft">focus sessions</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-3xl font-700 text-reward">{stats.focusMinutesToday}</span>
            <span className="text-sm text-inkSoft">minutes deep in it</span>
          </div>
        </div>

        <div className="bg-surface rounded-xl2 shadow-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-inkSoft mb-3">Pick what's next</p>
          {actionable.length === 0 ? (
            <p className="text-sm text-inkSoft">No open tasks yet. Add one in the Tasks tab — small is fine.</p>
          ) : (
            <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {actionable.slice(0, 8).map(t => (
                <li key={t.id}>
                  <button
                    onClick={() => setSelectedTaskId(t.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedTask?.id === t.id ? 'bg-focus-soft text-focus-dark font-medium' : 'hover:bg-canvas text-ink'
                    }`}
                  >
                    {t.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-surface rounded-xl2 shadow-card p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-inkSoft">To-do list</p>
            <span className="text-[11px] text-inkSoft">{actionable.length} open</span>
          </div>

          <form onSubmit={handleQuickAddTodo} className="mb-3 flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              placeholder="Add a quick task"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-focus-soft focus:border-focus outline-none"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-focus text-white text-sm font-medium hover:bg-focus-dark transition-colors"
            >
              Add
            </button>
          </form>

          {actionable.length === 0 ? (
            <p className="text-sm text-inkSoft">Nothing left today. Nice work.</p>
          ) : (
            <ul className="space-y-2">
              {actionable.slice(0, 5).map(task => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={async () => {
                      await onTaskUpdated(task.id, { status: 'done' });
                      setSelectedTaskId(null);
                    }}
                    className="w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-lg border border-focus-soft hover:bg-focus-soft transition-colors"
                  >
                    <span className="h-4 w-4 rounded-full border border-focus text-[10px] leading-4 text-focus flex items-center justify-center">
                      {selectedTask?.id === task.id ? '•' : ''}
                    </span>
                    <span className="text-sm text-ink flex-1">{task.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-surface rounded-xl2 shadow-card p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-inkSoft">This week</p>
            <span className="text-[11px] text-inkSoft">Planner</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {weeklyPlan.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDayIndex(index)}
                className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedDayIndex === index ? 'bg-focus text-white' : 'bg-focus-soft text-focus-dark'
                }`}
              >
                {item.day}
              </button>
            ))}
          </div>

          <textarea
            value={weeklyPlan[selectedDayIndex]?.goal || ''}
            onChange={e => updateWeeklyGoal(e.target.value)}
            rows={3}
            placeholder={`What matters most on ${weeklyPlan[selectedDayIndex]?.day}?`}
            className="w-full px-3 py-2 text-sm rounded-lg border border-focus-soft focus:border-focus outline-none resize-none"
          />
        </div>

        <div className="bg-surface rounded-xl2 shadow-card p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-inkSoft">Reminder</p>
            <button
              type="button"
              onClick={toggleReminderDone}
              className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                reminderDone ? 'bg-calm text-white' : 'bg-focus-soft text-focus-dark'
              }`}
            >
              {reminderDone ? 'Done' : 'Mark done'}
            </button>
          </div>

          <input
            type="text"
            value={reminder}
            onChange={e => setReminder(e.target.value)}
            placeholder="Reminder title"
            className="w-full px-3 py-2 text-sm rounded-lg border border-focus-soft focus:border-focus outline-none mb-2"
          />

          <input
            type="time"
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-focus-soft focus:border-focus outline-none"
          />

          <p className={`mt-3 text-xs font-medium ${reminderDone ? 'text-calm' : 'text-inkSoft'}`}>
            {reminderDone ? 'Reminder complete' : `Next reminder: ${reminder || 'No reminder set'} at ${reminderTime}`}
          </p>
        </div>
      </aside>
    </div>
  );
}
