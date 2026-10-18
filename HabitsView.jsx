import { useState } from 'react';

function last30Dates() {
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function HabitsView({ habits, onCreate, onToggle, onDelete }) {
  const [name, setName] = useState('');
  const dates = last30Dates();
  const today = dates[dates.length - 1];

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), emoji: '' });
    setName('');
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-surface rounded-xl2 shadow-card p-4 flex flex-col sm:flex-row gap-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="A habit worth repeating (e.g. Drink water)"
          className="flex-1 px-4 py-2.5 rounded-lg border border-focus-soft focus:border-focus outline-none text-sm"
        />
        <button type="submit" className="px-5 py-2.5 rounded-lg bg-focus text-white font-semibold text-sm hover:bg-focus-dark transition-colors">
          Add habit
        </button>
      </form>

      {habits.length === 0 ? (
        <div className="bg-surface rounded-xl2 shadow-card p-8 text-center text-inkSoft text-sm">
          No habits yet. Start with just one — consistency beats ambition here.
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map(h => (
            <div key={h.id} className="bg-surface rounded-xl2 shadow-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{h.name}</p>
                  <p className="text-xs text-inkSoft">
                    {h.streak > 0 ? (
                      <span className="text-reward font-semibold">🔥 {h.streak} day streak</span>
                    ) : (
                      'No streak yet — today is a good day to start'
                    )}
                  </p>
                </div>
                <button
                  onClick={() => onToggle(h.id, today)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    h.loggedToday ? 'bg-calm text-white' : 'bg-focus-soft text-focus-dark hover:bg-focus/20'
                  }`}
                >
                  {h.loggedToday ? 'Done today ✓' : 'Check in'}
                </button>
                <button onClick={() => onDelete(h.id)} className="text-xs text-inkSoft hover:text-energy font-medium">
                  Remove
                </button>
              </div>
              <div className="flex gap-1">
                {dates.map(d => (
                  <span
                    key={d}
                    title={d}
                    className={`w-3.5 h-3.5 rounded-sm ${h.recentLogs.includes(d) ? 'bg-calm' : 'bg-focus-soft'}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
