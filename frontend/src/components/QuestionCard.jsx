import { useState } from 'react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionCard({ question, selectedOption, onSelect, disabled }) {
  const [hintVisible, setHintVisible] = useState(false);
  const { question_text, options, hint } = question;

  return (
    <article className="panel p-6 sm:p-8">
      <p className="text-lg font-semibold leading-relaxed text-slate-900 dark:text-slate-100 sm:text-xl">
        {question_text}
      </p>

      <div className="mt-6 grid gap-2.5">
        {options.map((option, index) => {
          const isSelected = selectedOption === index;

          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelect(index)}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition sm:text-base ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-50 text-slate-900 ring-1 ring-cyan-500/30 dark:bg-cyan-500/10 dark:text-slate-100'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800/80'
              } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isSelected
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                {OPTION_LABELS[index]}
              </span>
              <span className="pt-0.5 leading-snug">{option}</span>
            </button>
          );
        })}
      </div>

      {hint && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setHintVisible((v) => !v)}
            className="text-sm font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400"
          >
            {hintVisible ? 'Hide hint' : 'Show hint'}
          </button>
          {hintVisible && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              {hint}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
