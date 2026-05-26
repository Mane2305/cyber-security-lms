export default function ProgressBar({ completed, total }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-medium text-slate-700">
        {completed} of {total} modules completed
      </p>
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
          {percentage}%
        </span>
      </div>
    </div>
  );
}
