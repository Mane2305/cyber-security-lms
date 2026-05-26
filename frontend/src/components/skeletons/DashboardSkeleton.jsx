export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />

      <div className="panel animate-pulse p-5">
        <div className="mb-3 h-4 w-28 rounded bg-slate-200 dark:bg-slate-600" />
        <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-600" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel animate-pulse p-4">
            <div className="mb-2 h-3 w-16 rounded bg-slate-200 dark:bg-slate-600" />
            <div className="h-7 w-12 rounded bg-slate-200 dark:bg-slate-600" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel animate-pulse p-5">
            <div className="mb-4 h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-600" />
            <div className="mb-2 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-600" />
            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-600" />
          </div>
        ))}
      </div>
    </div>
  );
}
