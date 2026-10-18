import { useState } from 'react';

function formatTime(iso) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

export default function NotesView({ notes, onAdd, onDelete }) {
  const [text, setText] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    onAdd({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      text: text.trim(),
      createdAt: new Date().toISOString()
    });

    setText('');
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-surface rounded-xl2 shadow-card p-4 space-y-3">
        <label className="block text-sm font-medium text-ink">Quick brain dump</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          placeholder="Write down the thoughts swirling in your head — ideas, errands, worries, or next steps."
          className="w-full px-4 py-3 rounded-lg border border-focus-soft focus:border-focus outline-none text-sm resize-none"
        />
        <div className="flex justify-end">
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-focus text-white font-semibold text-sm hover:bg-focus-dark transition-colors">
            Save note
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <div className="bg-surface rounded-xl2 shadow-card p-8 text-center text-inkSoft text-sm">
          No notes yet. Capture a quick thought and clear mental clutter.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="bg-surface rounded-xl2 shadow-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-ink whitespace-pre-wrap flex-1">{note.text}</p>
                <button
                  onClick={() => onDelete(note.id)}
                  className="text-xs text-inkSoft hover:text-energy font-medium"
                >
                  Remove
                </button>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.08em] text-inkSoft">
                {formatTime(note.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
