import { useState } from 'react';
import { Check, Lock, Share2, Shield } from 'lucide-react';

function formatEarnedDate(earnedAt) {
  if (!earnedAt) return '';
  const date = new Date(earnedAt);
  if (Number.isNaN(date.getTime())) return earnedAt;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BadgeCard({ badge }) {
  const { module_title, badge_name, badge_description, earned, earned_at } = badge;
  const [shareStatus, setShareStatus] = useState('');

  const handleShare = async () => {
    const shareText = `I earned the ${badge_name} badge for completing ${module_title} in CyberShield.`;
    const shareData = {
      title: `${badge_name} badge earned`,
      text: shareText,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus('Shared');
      } else {
        await navigator.clipboard.writeText(`${shareText} ${window.location.origin}`);
        setShareStatus('Copied');
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setShareStatus('Unable to share');
    }

    window.setTimeout(() => setShareStatus(''), 2200);
  };

  if (earned) {
    return (
      <article className="panel flex flex-col border-cyan-500/30 p-5 ring-1 ring-cyan-500/20">
        <div className="flex items-start justify-between gap-3">
          <Shield className="h-10 w-10 text-cyan-600 dark:text-cyan-400" />
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 transition hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
            aria-label={`Share ${badge_name} badge`}
            title={`Share ${badge_name} badge`}
          >
            {shareStatus === 'Copied' || shareStatus === 'Shared' ? (
              <Check className="h-4 w-4" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </button>
        </div>
        <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">{badge_name}</h3>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{module_title}</p>
        {badge_description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {badge_description}
          </p>
        )}
        {earned_at && (
          <p className="mt-3 text-xs font-medium text-cyan-600 dark:text-cyan-400">
            Earned {formatEarnedDate(earned_at)}
          </p>
        )}
        {shareStatus && (
          <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400" aria-live="polite">
            {shareStatus}
          </p>
        )}
      </article>
    );
  }

  return (
    <article className="panel-muted relative flex flex-col overflow-hidden p-5 opacity-80">
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/50">
        <Lock className="h-8 w-8 text-slate-400 dark:text-slate-500" />
      </div>
      <Shield className="h-10 w-10 text-slate-300 dark:text-slate-600" />
      <h3 className="mt-3 text-base font-medium text-slate-500 dark:text-slate-500">{badge_name}</h3>
      <p className="mt-0.5 text-sm text-slate-400">{module_title}</p>
      <p className="mt-3 text-xs text-slate-400">Complete the module to unlock</p>
    </article>
  );
}

function AchievementBadgeCard({ achievement }) {
  const { name, description, earned, earned_at } = achievement;

  if (!earned) {
    return (
      <article className="panel-muted relative flex flex-col p-5 opacity-60">
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-base font-medium text-slate-500">{name}</p>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </article>
    );
  }

  return (
    <article className="panel flex flex-col border-purple-500/30 p-5 ring-1 ring-purple-500/20">
      <span className="text-xl" aria-hidden="true">
        ⭐
      </span>
      <h3 className="mt-2 text-base font-semibold text-purple-700 dark:text-purple-400">{name}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      {earned_at && (
        <p className="mt-3 text-xs text-purple-600 dark:text-purple-400">
          Earned {formatEarnedDate(earned_at)}
        </p>
      )}
    </article>
  );
}

export { AchievementBadgeCard };
