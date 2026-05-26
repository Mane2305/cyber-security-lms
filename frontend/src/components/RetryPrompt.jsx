export default function RetryPrompt({ score, onRetry, onGoToDashboard, weakAreaFeedback }) {
  return (
    <div className="panel-muted mt-6 p-5 text-left">
      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">You scored {score}%</p>

      {weakAreaFeedback ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Areas to review</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-200/90">{weakAreaFeedback}</p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Review the module slides before retrying.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-cyan-500"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={onGoToDashboard}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
