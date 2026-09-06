const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // tasks
  getTasks: () => request('/tasks'),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  breakdownTask: (id, steps) => request(`/tasks/${id}/breakdown`, { method: 'POST', body: JSON.stringify({ steps }) }),

  // habits
  getHabits: () => request('/habits'),
  createHabit: (data) => request('/habits', { method: 'POST', body: JSON.stringify(data) }),
  toggleHabit: (id, date) => request(`/habits/${id}/toggle`, { method: 'POST', body: JSON.stringify({ date }) }),
  deleteHabit: (id) => request(`/habits/${id}`, { method: 'DELETE' }),

  // moods
  getMoods: (limit = 30) => request(`/moods?limit=${limit}`),
  createMood: (data) => request('/moods', { method: 'POST', body: JSON.stringify(data) }),

  // sessions
  getSessionStats: () => request('/sessions/stats'),
  createSession: (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) })
};
