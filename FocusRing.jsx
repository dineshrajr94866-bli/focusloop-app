const SIZE = 260;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusRing({ secondsLeft, totalSeconds, mode }) {
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const offset = CIRC * (1 - progress);
  const ringColor = mode === 'break' ? '#2BB79E' : '#6C5CE7';
  const trackColor = mode === 'break' ? '#E1F6F1' : '#EDEAFD';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={trackColor} strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-5xl font-700 tabular-nums text-ink">{formatTime(secondsLeft)}</span>
        <span
          className={`mt-2 text-xs font-semibold uppercase tracking-widest ${
            mode === 'break' ? 'text-calm' : 'text-focus'
          }`}
        >
          {mode === 'break' ? 'Break' : 'Focus session'}
        </span>
      </div>
    </div>
  );
}
