import { useState } from 'react';

const levelStyles = {
  Low: {
    ring: 'border-green-500',
    bg: 'bg-green-50 dark:bg-green-500/10',
    text: 'text-green-700 dark:text-green-400',
  },
  Medium: {
    ring: 'border-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
  },
  High: {
    ring: 'border-red-500',
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
  },
};

export default function RiskScoreBadge({ score, level, reasons = [], size = 'md' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const styles = levelStyles[level] || levelStyles.Medium;
  const sizeClasses = size === 'sm' ? 'h-10 w-10 text-sm' : 'h-14 w-14 text-base';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`flex ${sizeClasses} items-center justify-center rounded-full border-2 font-bold ${styles.ring} ${styles.bg} ${styles.text}`}
        title={`Risk: ${level}`}
      >
        {score ?? '—'}
      </div>

      {showTooltip && reasons.length > 0 && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-xl dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <p className="mb-1 font-semibold text-slate-900 dark:text-slate-100">{level} risk</p>
          <ul className="list-inside list-disc space-y-0.5">
            {reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
