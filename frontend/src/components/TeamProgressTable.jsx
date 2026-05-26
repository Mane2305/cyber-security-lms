import RiskScoreBadge from './RiskScoreBadge';
import { formatRelativeTime } from '../utils/formatters';

function MiniProgressBar({ completed, total }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-cyan-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="shrink-0 text-xs text-slate-400">
        {completed}/{total}
      </span>
    </div>
  );
}

function CertificateBadge({ earned }) {
  if (earned) {
    return (
      <span className="inline-flex rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
        Earned
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-400">
      Pending
    </span>
  );
}

export default function TeamProgressTable({ members = [], onMemberClick, onRemind, actionLoading }) {
  if (!members.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        No team members assigned yet
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Progress</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Completion %</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Risk</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Certificate</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Last Active</th>
              {onRemind && (
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {members.map((member) => (
              <tr
                key={member.uid}
                onClick={() => onMemberClick?.(member)}
                className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${onMemberClick ? 'cursor-pointer' : ''}`}
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                  {member.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">{member.email}</td>
                <td className="px-4 py-3">
                  <MiniProgressBar
                    completed={member.modules_completed ?? 0}
                    total={member.modules_total ?? 8}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                  {member.completion_percentage ?? 0}%
                </td>
                <td className="px-4 py-3">
                  {member.risk ? (
                    <RiskScoreBadge
                      score={member.risk.score}
                      level={member.risk.level}
                      reasons={member.risk.reasons}
                      size="sm"
                    />
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <CertificateBadge earned={member.certificate_earned} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                  {formatRelativeTime(member.last_active)}
                </td>
                {onRemind && (
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemind(member);
                      }}
                      disabled={actionLoading === member.uid}
                      className="rounded-lg border border-cyan-200 px-3 py-1.5 text-xs font-medium text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-60 dark:border-cyan-500/40 dark:text-cyan-400 dark:hover:bg-cyan-500/10"
                    >
                      {actionLoading === member.uid ? 'Sending...' : 'Remind'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
