import { useState } from 'react';
import TaskItem from './TaskItem.jsx';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' }
];

export default function TasksView({ tasks, onCreate, onUpdate, onDelete, onBreakdown }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [filter, setFilter] = useState('active');

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ title: title.trim(), priority });
    setTitle('');
  }

  const visible = tasks.filter(t => {
    if (filter === 'active') return t.status !== 'done';
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-surface rounded-xl2 shadow-card p-4 flex flex-col sm:flex-row gap-3">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What needs doing? Keep it small if you can."
          className="flex-1 px-4 py-2.5 rounded-lg border border-focus-soft focus:border-focus outline-none text-sm"
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-focus-soft focus:border-focus outline-none text-sm bg-white"
        >
          {PRIORITIES.map(p => (
            <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)} priority</option>
          ))}
        </select>
        <button type="submit" className="px-5 py-2.5 rounded-lg bg-focus text-white font-semibold text-sm hover:bg-focus-dark transition-colors">
          Add task
        </button>
      </form>

      <div className="flex items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.id ? 'bg-focus text-white' : 'bg-focus-soft text-focus-dark hover:bg-focus/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="bg-surface rounded-xl2 shadow-card p-8 text-center text-inkSoft text-sm">
          {filter === 'done' ? "Nothing completed yet — that's alright, start anywhere." : 'Nothing here. Add one task above, however small.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(t => (
            <TaskItem key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} onBreakdown={onBreakdown} />
          ))}
        </div>
      )}
    </div>
  );
}
