export default function RetryPrompt({ score, onRetry, onGoToDashboard, weakAreaFeedback }) {
  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-lg font-semibold text-slate-900">You scored {score}%</p>

      {weakAreaFeedback ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">Areas to Review</p>
          <p className="mt-1 text-sm text-amber-800">{weakAreaFeedback}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">Review the module slides before retrying.</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={onGoToDashboard}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
