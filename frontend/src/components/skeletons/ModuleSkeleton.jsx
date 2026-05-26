export default function ModuleSkeleton() {
  return (
    <div className="space-y-5">
      <div className="panel animate-pulse p-8">
        <div className="mb-4 h-7 w-2/3 rounded bg-slate-200 dark:bg-slate-600" />
        <div className="mb-2 h-4 w-full rounded bg-slate-200 dark:bg-slate-600" />
        <div className="mb-2 h-4 w-full rounded bg-slate-200 dark:bg-slate-600" />
        <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-600" />
      </div>
      <div className="flex justify-between gap-3">
        <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
