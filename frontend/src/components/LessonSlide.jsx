function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

export default function LessonSlide({ slide }) {
  const { heading, body, key_points } = slide;

  return (
    <article className="panel p-6 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
        {heading}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
        {body}
      </p>

      {key_points && key_points.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Key points
          </h3>
          <ul className="space-y-2.5">
            {key_points.map((point, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300 sm:text-base">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
