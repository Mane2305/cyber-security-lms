import { MODULES } from '../data/modules';
import RetryPrompt from './RetryPrompt';

function getModuleTitle(moduleId) {
  return MODULES.find((m) => m.id === moduleId)?.title ?? moduleId;
}

function getModuleBadgeName(moduleId) {
  return MODULES.find((m) => m.id === moduleId)?.badge_name ?? 'Module Badge';
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function XCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function ResultIcon({ correct }) {
  if (correct) {
    return (
      <svg className="h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function ResultsBreakdown({ results }) {
  return (
    <div className="mt-8">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Question Review</h3>
      <ul className="space-y-4">
        {results.map((item) => (
          <li
            key={item.question_number}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <ResultIcon correct={item.correct} />
              <span className="text-sm font-medium text-slate-900">Question {item.question_number}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.explanation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ScoreScreen({ results, onRetry, onGoToDashboard }) {
  const {
    score,
    passed,
    correct_count,
    total_questions,
    results: questionResults,
    weak_area_feedback,
    badge_unlocked,
    next_module_unlocked,
    certificate_eligible,
    module_id,
  } = results;

  if (passed) {
    return (
      <div className="text-center">
        <CheckCircleIcon className="mx-auto h-20 w-20 text-green-600" />
        <h2 className="mt-4 text-3xl font-bold text-slate-900">Congratulations!</h2>
        <p className="mt-3 text-4xl font-bold text-slate-900">You scored {score}%</p>
        <p className="mt-2 text-lg text-slate-600">
          {correct_count} out of {total_questions} correct
        </p>

        {badge_unlocked && (
          <div className="mx-auto mt-6 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <p className="font-semibold">🏆 Badge Earned!</p>
            <p className="mt-1 text-sm">{getModuleBadgeName(module_id)} — {getModuleTitle(module_id)}</p>
          </div>
        )}

        {next_module_unlocked && (
          <div className="mx-auto mt-4 max-w-md rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            <p className="font-semibold">Next module unlocked!</p>
            <p className="mt-1 text-sm">{getModuleTitle(next_module_unlocked)}</p>
          </div>
        )}

        {certificate_eligible && (
          <div className="mx-auto mt-4 max-w-md rounded-lg border-2 border-blue-300 bg-blue-50 px-4 py-4 text-blue-900">
            <p className="font-semibold">🎓 You are now eligible for your certificate!</p>
          </div>
        )}

        <ResultsBreakdown results={questionResults} />

        <button
          type="button"
          onClick={onGoToDashboard}
          className="mt-8 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <XCircleIcon className="mx-auto h-20 w-20 text-red-600" />
      <h2 className="mt-4 text-3xl font-bold text-slate-900">Keep Trying!</h2>
      <p className="mt-3 text-4xl font-bold text-slate-900">You scored {score}%</p>
      <p className="mt-2 text-lg text-slate-600">
        {correct_count} out of {total_questions} correct — you need 4 or more to pass
      </p>

      <ResultsBreakdown results={questionResults} />

      <RetryPrompt
        score={score}
        onRetry={onRetry}
        onGoToDashboard={onGoToDashboard}
        weakAreaFeedback={weak_area_feedback}
      />
    </div>
  );
}
