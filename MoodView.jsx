import { useState } from 'react';

const MOOD_EMOJI = ['😔', '😕', '😐', '🙂', '😄'];
const ENERGY_EMOJI = ['🔋', '🪫', '⚡', '⚡⚡', '⚡⚡⚡'];
const MOOD_PRESETS = [
  { label: 'Calm', mood: 4, energy: 3 },
  { label: 'Focused', mood: 4, energy: 4 },
  { label: 'Stressed', mood: 2, energy: 2 },
  { label: 'Tired', mood: 2, energy: 1 },
  { label: 'Motivated', mood: 5, energy: 4 }
];

export default function MoodView({ moods, onCreate }) {
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');
  const [moodLabel, setMoodLabel] = useState('Focused');

  function applyPreset(preset) {
    setMood(preset.mood);
    setEnergy(preset.energy);
    setMoodLabel(preset.label);
  }

  function submit(e) {
    e.preventDefault();
    onCreate({ mood, energy, note: note.trim() });
    setNote('');
    setMoodLabel(MOOD_PRESETS.find(item => item.mood === mood && item.energy === energy)?.label || 'Focused');
  }

  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-6">
      <form onSubmit={submit} className="bg-surface rounded-xl2 shadow-card p-6 space-y-6 h-fit">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-inkSoft mb-3">Today's vibe</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {MOOD_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.label}
                onClick={() => applyPreset(preset)}
                className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  moodLabel === preset.label ? 'bg-focus text-white' : 'bg-focus-soft text-focus-dark'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <p className="text-sm text-inkSoft mb-3">Current vibe: <span className="font-semibold text-ink">{moodLabel}</span></p>
          <div className="flex justify-between">
            {MOOD_EMOJI.map((em, i) => (
              <button
                type="button"
                key={i}
                onClick={() => {
                  setMood(i + 1);
                  const matchingPreset = MOOD_PRESETS.find(item => item.mood === i + 1 && item.energy === energy);
                  if (matchingPreset) setMoodLabel(matchingPreset.label);
                }}
                className={`text-2xl w-11 h-11 rounded-full flex items-center justify-center transition-transform ${
                  mood === i + 1 ? 'bg-focus-soft scale-110 ring-2 ring-focus' : 'hover:bg-canvas'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-inkSoft mb-3">Energy level?</p>
          <div className="flex justify-between">
            {ENERGY_EMOJI.map((em, i) => (
              <button
                type="button"
                key={i}
                onClick={() => {
                  setEnergy(i + 1);
                  const matchingPreset = MOOD_PRESETS.find(item => item.energy === i + 1 && item.mood === mood);
                  if (matchingPreset) setMoodLabel(matchingPreset.label);
                }}
                className={`text-xl w-11 h-11 rounded-full flex items-center justify-center transition-transform ${
                  energy === i + 1 ? 'bg-reward-soft scale-110 ring-2 ring-reward' : 'hover:bg-canvas'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Anything worth noting? (optional)"
          rows={2}
          className="w-full text-sm px-3 py-2 rounded-lg border border-focus-soft focus:border-focus outline-none resize-none"
        />

        <button type="submit" className="w-full py-2.5 rounded-lg bg-focus text-white font-semibold text-sm hover:bg-focus-dark transition-colors">
          Log check-in
        </button>
      </form>

      <div className="bg-surface rounded-xl2 shadow-card p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-inkSoft mb-4">Recent check-ins</p>
        {moods.length === 0 ? (
          <p className="text-sm text-inkSoft">No check-ins yet. There's no wrong answer — just notice where you're at.</p>
        ) : (
          <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {moods.map(m => (
              <li key={m.id} className="flex items-start gap-3 pb-3 border-b border-canvas last:border-0">
                <span className="text-xl">{MOOD_EMOJI[m.mood - 1]}</span>
                <span className="text-lg">{ENERGY_EMOJI[m.energy - 1]}</span>
                <div className="flex-1 min-w-0">
                  {m.note && <p className="text-sm text-ink">{m.note}</p>}
                  <p className="text-xs text-inkSoft">{new Date(m.created_at + 'Z').toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
