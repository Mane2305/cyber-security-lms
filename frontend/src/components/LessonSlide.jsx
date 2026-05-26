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
    <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{heading}</h2>
      <p className="mt-6 text-base leading-relaxed text-slate-700 md:text-lg">{body}</p>

      {key_points && key_points.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Key Points</h3>
          <ul className="space-y-3">
            {key_points.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <span className="text-slate-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
