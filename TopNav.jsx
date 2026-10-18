const TABS = [
  { id: 'focus', label: 'Right Now' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'habits', label: 'Habits' },
  { id: 'mood', label: 'Mood' },
  { id: 'notes', label: 'Notes' },
  { id: 'ai', label: 'AI Coach' }
];

export default function TopNav({ active, onChange }) {
  return (
    <header className="sticky top-0 z-10 bg-canvas/90 backdrop-blur border-b border-focus-soft">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-focus flex items-center justify-center shadow-soft">
            <span className="w-2.5 h-2.5 rounded-full bg-reward" />
          </div>
          <span className="font-display font-700 text-lg tracking-tight">FocusLoop</span>
        </div>
        <nav className="flex items-center gap-1" role="tablist" aria-label="Main sections">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active === tab.id}
              onClick={() => onChange(tab.id)}
              className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                active === tab.id
                  ? 'bg-focus text-white shadow-soft'
                  : 'text-inkSoft hover:bg-focus-soft hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
