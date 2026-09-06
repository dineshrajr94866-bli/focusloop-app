import { useEffect, useState, useCallback } from 'react';
import TopNav from './components/TopNav.jsx';
import FocusView from './components/FocusView.jsx';
import TasksView from './components/TasksView.jsx';
import HabitsView from './components/HabitsView.jsx';
import MoodView from './components/MoodView.jsx';
import { api } from './api.js';

export default function App() {
  const [tab, setTab] = useState('focus');
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [moods, setMoods] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [t, h, m] = await Promise.all([api.getTasks(), api.getHabits(), api.getMoods()]);
      setTasks(t);
      setHabits(h);
      setMoods(m);
      setError(null);
    } catch (e) {
      setError('Could not reach the server. Is the backend running on port 4000?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleCreateTask(data) {
    await api.createTask(data);
    loadAll();
  }
  async function handleUpdateTask(id, data) {
    await api.updateTask(id, data);
    loadAll();
  }
  async function handleDeleteTask(id) {
    await api.deleteTask(id);
    loadAll();
  }
  async function handleBreakdown(id, steps) {
    await api.breakdownTask(id, steps);
    loadAll();
  }

  async function handleCreateHabit(data) {
    await api.createHabit(data);
    loadAll();
  }
  async function handleToggleHabit(id, date) {
    await api.toggleHabit(id, date);
    loadAll();
  }
  async function handleDeleteHabit(id) {
    await api.deleteHabit(id);
    loadAll();
  }

  async function handleCreateMood(data) {
    await api.createMood(data);
    loadAll();
  }

  return (
    <div className="min-h-full">
      <TopNav active={tab} onChange={setTab} />
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8">
        {error && (
          <div className="mb-6 bg-energy-soft border border-energy/30 text-energy text-sm rounded-xl2 px-4 py-3">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-inkSoft text-sm">Loading…</p>
        ) : (
          <>
            {tab === 'focus' && <FocusView tasks={tasks} onTaskUpdated={handleUpdateTask} />}
            {tab === 'tasks' && (
              <TasksView
                tasks={tasks}
                onCreate={handleCreateTask}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
                onBreakdown={handleBreakdown}
              />
            )}
            {tab === 'habits' && (
              <HabitsView habits={habits} onCreate={handleCreateHabit} onToggle={handleToggleHabit} onDelete={handleDeleteHabit} />
            )}
            {tab === 'mood' && <MoodView moods={moods} onCreate={handleCreateMood} />}
          </>
        )}
      </main>
    </div>
  );
}
