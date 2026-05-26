const valueColors = {
  default: 'text-slate-900 dark:text-slate-100',
  green: 'text-green-600 dark:text-green-400',
  red: 'text-red-600 dark:text-red-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
};

export default function AnalyticsCard({ title, value, color = 'default' }) {
  const valueClass = valueColors[color] || valueColors.default;

  return (
    <div className="panel p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${valueClass}`}>{value}</p>
    </div>
  );
}
