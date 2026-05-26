export default function TableSkeleton({ rows = 5 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-4">
      <div className="mb-4 h-4 w-1/4 animate-pulse rounded bg-slate-700" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 flex-1 animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-1/6 animate-pulse rounded bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
