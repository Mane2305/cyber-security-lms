import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import ModuleCard from '../components/ModuleCard';
import ProgressBar from '../components/ProgressBar';
import RiskScoreBadge from '../components/RiskScoreBadge';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import { useDashboardView } from '../hooks/useDashboardView';
import { formatDateTime, getApiErrorMessage } from '../utils/formatters';

const ACTION_LABELS = {
  module_started: 'Started a module',
  module_completed: 'Completed a module',
  quiz_passed: 'Passed a quiz',
  quiz_failed: 'Failed a quiz',
  badge_earned: 'Earned a badge',
  certificate_generated: 'Certificate generated',
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const OVERVIEW_MODULE_LIMIT = 4;

function StatCard({ label, value, valueClassName = 'text-slate-900 dark:text-slate-100' }) {
  return (
    <div className="panel p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${valueClassName}`}>{value}</p>
    </div>
  );
}

function ModulesGrid({ modules }) {
  if (modules.length === 0) {
    return (
      <div className="panel px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        No modules available
      </div>
    );
  }

  return (
    <motion.div
      variants={gridVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {modules.map((mod) => (
        <motion.div key={mod.id} variants={cardVariants} className="h-full">
          <ModuleCard module={mod} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function EmployeeDashboard() {
  const view = useDashboardView('overview');
  const [dashboard, setDashboard] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      const [dashResult, modulesResult] = await Promise.allSettled([
        axiosInstance.get('/api/dashboard/employee'),
        axiosInstance.get('/api/modules'),
      ]);

      const errors = [];

      if (dashResult.status === 'fulfilled') {
        setDashboard(dashResult.value.data.data);
      } else {
        errors.push(getApiErrorMessage(dashResult.reason, 'Failed to load dashboard.'));
      }

      if (modulesResult.status === 'fulfilled') {
        setModules(modulesResult.value.data.data.modules ?? []);
      } else {
        errors.push(getApiErrorMessage(modulesResult.reason, 'Failed to load modules.'));
      }

      if (errors.length) setError(errors.join(' '));
      setLoading(false);
    };

    loadData();
  }, []);

  const displayName = dashboard?.employee_name || 'there';
  const modulesCompleted = dashboard?.modules_completed ?? 0;
  const modulesTotal = dashboard?.modules_total ?? 8;
  const certificateEarned = dashboard?.certificate_issued;
  const riskScore = dashboard?.risk_score;
  const recentActivity = (dashboard?.recent_activity ?? []).slice(0, 5);
  const deadline = dashboard?.deadline;

  if (loading) return <DashboardSkeleton />;

  const errorAlert = error && (
    <div className="alert-error mb-5" role="alert">
      {error}
    </div>
  );

  if (view === 'modules') {
    return (
      <div className="space-y-5">
        {errorAlert}
        <p className="page-lead">Browse and continue your assigned training modules.</p>
        <ModulesGrid modules={modules} />
      </div>
    );
  }

  const previewModules = modules.slice(0, OVERVIEW_MODULE_LIMIT);
  const hasMoreModules = modules.length > OVERVIEW_MODULE_LIMIT;

  return (
    <div className="space-y-6">
      <p className="page-lead">Welcome back, {displayName}</p>
      {errorAlert}

      {!error && dashboard && (
        <>
          {deadline?.deadline && (
            <section
              className={`panel border-l-4 p-4 ${
                deadline.is_overdue
                  ? 'border-red-500 bg-red-50 dark:bg-red-500/10'
                  : 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
              }`}
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Training deadline: {formatDateTime(deadline.deadline)}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {deadline.is_overdue
                  ? 'This deadline is overdue.'
                  : `${deadline.days_remaining} day${deadline.days_remaining === 1 ? '' : 's'} remaining.`}
              </p>
            </section>
          )}

          <section className="panel p-5">
            <h2 className="section-title mb-3">Your progress</h2>
            <ProgressBar completed={modulesCompleted} total={modulesTotal} />
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Completed" value={modulesCompleted} />
            <StatCard label="Badges" value={dashboard.badges_earned ?? 0} />
            <StatCard
              label="Certificate"
              value={certificateEarned ? 'Earned' : 'In progress'}
              valueClassName={
                certificateEarned
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-600 dark:text-slate-400'
              }
            />
            <div className="panel flex flex-col items-start justify-center p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Risk score
              </p>
              <div className="mt-2">
                {riskScore ? (
                  <RiskScoreBadge
                    score={riskScore.score}
                    level={riskScore.level}
                    reasons={riskScore.reasons}
                    size="sm"
                  />
                ) : (
                  <span className="text-sm text-slate-500">—</span>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title">Training modules</h2>
              {hasMoreModules && (
                <Link
                  to="/dashboard/employee/modules"
                  className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                >
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <ModulesGrid modules={previewModules} />
          </section>

          <section className="space-y-3">
            <h2 className="section-title">Recent activity</h2>
            <div className="panel overflow-hidden">
              {recentActivity.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No recent activity yet
                </p>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                  {recentActivity.map((item, index) => (
                    <li
                      key={`${item.module_id}-${item.timestamp}-${index}`}
                      className="flex items-center justify-between gap-4 px-5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {ACTION_LABELS[item.action] ?? item.action}
                          {item.module_id && (
                            <span className="font-normal text-slate-500 dark:text-slate-400">
                              {' '}
                              · Module {item.module_id}
                            </span>
                          )}
                        </p>
                      </div>
                      <time className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(item.timestamp)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
