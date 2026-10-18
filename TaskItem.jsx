import { useState } from 'react';

const PRIORITY_STYLES = {
  urgent: 'bg-energy/15 text-energy border-energy/30',
  high: 'bg-reward/20 text-reward border-reward/40',
  medium: 'bg-focus-soft text-focus-dark border-focus/20',
  low: 'bg-calm-soft text-calm border-calm/20'
};

export default function TaskItem({ task, onUpdate, onDelete, onBreakdown, depth = 0 }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [steps, setSteps] = useState('');
  const [showAddSub, setShowAddSub] = useState(false);
  const [subTitle, setSubTitle] = useState('');

  const isDone = task.status === 'done';

  function submitBreakdown(e) {
    e.preventDefault();
    const list = steps.split('\n').map(s => s.trim()).filter(Boolean);
    if (list.length === 0) return;
    onBreakdown(task.id, list);
    setSteps('');
    setShowBreakdown(false);
  }

  function submitSubtask(e) {
    e.preventDefault();
    if (!subTitle.trim()) return;
    onBreakdown(task.id, [subTitle.trim()]);
    setSubTitle('');
    setShowAddSub(false);
  }

  return (
    <div className={depth === 0 ? 'bg-surface rounded-xl2 shadow-card p-4' : 'pl-4 border-l-2 border-focus-soft'}>
      <div className="flex items-start gap-3">
        <button
          aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
          onClick={() => onUpdate(task.id, { status: isDone ? 'todo' : 'done' })}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            isDone ? 'bg-calm border-calm' : 'border-inkSoft hover:border-focus'
          }`}
        >
          {isDone && <span className="text-white text-[10px]">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${isDone ? 'line-through text-inkSoft' : 'text-ink'}`}>
              {task.title}
            </span>
            {depth === 0 && (
              <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[task.priority]}`}>
                {task.priority}
              </span>
            )}
          </div>

          {depth === 0 && task.subtasks?.length > 0 && (
            <div className="mt-3 space-y-2">
              {task.subtasks.map(sub => (
                <TaskItem key={sub.id} task={sub} onUpdate={onUpdate} onDelete={onDelete} onBreakdown={onBreakdown} depth={depth + 1} />
              ))}
            </div>
          )}

          {depth === 0 && (
            <div className="mt-3 flex items-center gap-3 text-xs font-medium text-inkSoft">
              <button onClick={() => setShowAddSub(v => !v)} className="hover:text-focus">
                + Add step
              </button>
              <button onClick={() => setShowBreakdown(v => !v)} className="hover:text-focus">
                Break this down
              </button>
              <button onClick={() => onDelete(task.id)} className="hover:text-energy ml-auto">
                Delete
              </button>
            </div>
          )}

          {showAddSub && (
            <form onSubmit={submitSubtask} className="mt-2 flex gap-2">
              <input
                autoFocus
                value={subTitle}
                onChange={e => setSubTitle(e.target.value)}
                placeholder="One small step…"
                className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-focus-soft focus:border-focus outline-none"
              />
              <button type="submit" className="text-sm px-3 py-1.5 rounded-lg bg-focus text-white font-medium">
                Add
              </button>
            </form>
          )}

          {showBreakdown && (
            <form onSubmit={submitBreakdown} className="mt-2">
              <textarea
                autoFocus
                value={steps}
                onChange={e => setSteps(e.target.value)}
                placeholder={'Split this into smaller steps, one per line:\nOpen the document\nWrite the first paragraph\nSend for review'}
                rows={3}
                className="w-full text-sm px-3 py-2 rounded-lg border border-focus-soft focus:border-focus outline-none resize-none"
              />
              <button type="submit" className="mt-2 text-sm px-3 py-1.5 rounded-lg bg-focus text-white font-medium">
                Create steps
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
