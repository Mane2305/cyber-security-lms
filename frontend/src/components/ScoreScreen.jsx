import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { MODULES } from '../data/modules';
import RetryPrompt from './RetryPrompt';

function getModuleTitle(moduleId) {
  return MODULES.find((m) => m.id === moduleId)?.title ?? moduleId;
}

function getModuleBadgeName(moduleId) {
  return MODULES.find((m) => m.id === moduleId)?.badge_name ?? 'Module Badge';
}

function AnimatedScore({ score }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const target = Math.round(score ?? 0);
    if (target === 0) {
      setDisplayed(0);
      return undefined;
    }

    const step = Math.max(1, Math.ceil(target / 30));
    const interval = setInterval(() => {
      setDisplayed((prev) => {
        const next = prev + step;
        if (next >= target) {
          clearInterval(interval);
          return target;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [score]);

  return <span>{displayed}%</span>;
}

function ResultIcon({ correct }) {
  if (correct) {
    return <span className="text-green-600 dark:text-green-400">✓</span>;
  }
  return <span className="text-red-600 dark:text-red-400">✗</span>;
}

function ResultsBreakdown({ results }) {
  return (
    <div className="mt-6 text-left">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Question review
      </h3>
      <ul className="space-y-3">
        {results.map((item) => (
          <li key={item.question_number} className="panel-muted px-4 py-3">
            <div className="flex items-center gap-2">
              <ResultIcon correct={item.correct} />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Question {item.question_number}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {item.explanation}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const noticeClass =
  'mx-auto mt-4 max-w-md rounded-lg border px-4 py-3 text-sm';

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
      <div className="panel mx-auto max-w-lg p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-600 dark:text-green-400" />
        <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">Congratulations!</h2>
        <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
          You scored <AnimatedScore score={score} />
        </p>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {correct_count} out of {total_questions} correct
        </p>

        {badge_unlocked && (
          <div className={`${noticeClass} border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200`}>
            <p className="font-semibold">Badge earned</p>
            <p className="mt-0.5">
              {getModuleBadgeName(module_id)} — {getModuleTitle(module_id)}
            </p>
          </div>
        )}

        {next_module_unlocked && (
          <div className={`${noticeClass} border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200`}>
            <p className="font-semibold">Next module unlocked</p>
            <p className="mt-0.5">{getModuleTitle(next_module_unlocked)}</p>
          </div>
        )}

        {certificate_eligible && (
          <div className={`${noticeClass} border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200`}>
            <p className="font-semibold">You are eligible for your certificate</p>
          </div>
        )}

        <ResultsBreakdown results={questionResults} />

        <button
          type="button"
          onClick={onGoToDashboard}
          className="mt-6 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-cyan-500"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="panel mx-auto max-w-lg p-6 text-center sm:p-8">
      <XCircle className="mx-auto h-16 w-16 text-red-500 dark:text-red-400" />
      <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">Keep trying</h2>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
        You scored <AnimatedScore score={score} />
      </p>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
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
