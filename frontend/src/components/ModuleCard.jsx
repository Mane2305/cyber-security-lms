import { useNavigate } from 'react-router-dom';

function LockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function BadgeIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l2.4 4.8 5.4.8-3.9 3.8.9 5.4L12 14.8 7.2 17.8l.9-5.4L4.2 7.6l5.4-.8L12 2z" />
    </svg>
  );
}

const statusStyles = {
  locked: {
    card: 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500',
    badge: 'bg-slate-300 text-slate-600',
    badgeLabel: 'Locked',
  },
  unlocked: {
    card: 'cursor-pointer border-blue-200 bg-blue-50 text-slate-900 hover:border-blue-400 hover:shadow-md',
    badge: null,
    badgeLabel: null,
  },
  completed: {
    card: 'cursor-pointer border-green-200 bg-green-50 text-slate-900 hover:border-green-400 hover:shadow-md',
    badge: 'bg-green-500 text-white',
    badgeLabel: 'Completed',
  },
};

export default function ModuleCard({ module }) {
  const navigate = useNavigate();
  const { id, title, description, status, badge_earned, order } = module;
  const styles = statusStyles[status] || statusStyles.locked;
  const isClickable = status === 'unlocked' || status === 'completed';

  const handleClick = () => {
    if (isClickable) {
      navigate(`/module/${id}`);
    }
  };

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      navigate(`/module/${id}`);
    }
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative flex flex-col rounded-xl border p-5 shadow-sm transition ${styles.card}`}
    >
      {badge_earned && (
        <BadgeIcon className="absolute right-3 top-3 h-5 w-5 text-amber-500" title="Badge earned" />
      )}

      {styles.badge && (
        <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}>
          {styles.badgeLabel}
        </span>
      )}

      <div className="mb-3 mt-6 flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold">
          {order}
        </span>
        {status === 'locked' && <LockIcon className="h-5 w-5 text-slate-400" />}
        {status === 'completed' && <CheckIcon className="h-5 w-5 text-green-600" />}
      </div>

      <h3 className="text-base font-semibold leading-snug">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed opacity-80">{description}</p>
    </div>
  );
}
