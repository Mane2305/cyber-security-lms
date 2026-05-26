import { useState } from 'react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionCard({ question, selectedOption, onSelect, disabled }) {
  const [hintVisible, setHintVisible] = useState(false);
  const { question_text, options, hint } = question;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xl font-semibold leading-relaxed text-slate-900 md:text-2xl">{question_text}</p>

      <div className="mt-8 space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedOption === index;
          const baseClasses =
            'flex w-full items-start gap-4 rounded-lg border px-4 py-3.5 text-left text-base transition';
          const interactiveClasses = disabled
            ? 'cursor-default border-slate-200 bg-white text-slate-700'
            : 'cursor-pointer border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50';
          const selectedClasses = isSelected
            ? 'border-blue-600 bg-blue-50 text-slate-900 ring-1 ring-blue-600'
            : interactiveClasses;

          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelect(index)}
              className={`${baseClasses} ${selectedClasses}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
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
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setHintVisible((v) => !v)}
            className="text-sm font-medium text-blue-600 transition hover:text-blue-800"
          >
            {hintVisible ? 'Hide Hint' : 'Hint'}
          </button>
          {hintVisible && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {hint}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
