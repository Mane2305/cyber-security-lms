import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import axiosInstance from '../utils/axiosInstance';
import AnalyticsCard from '../components/AnalyticsCard';
import UserManagement from '../components/UserManagement';
import ComplianceReport from '../components/ComplianceReport';
import AccountSettings from '../components/AccountSettings';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import { useDashboardView } from '../hooks/useDashboardView';
import { formatDateTime, getApiErrorMessage } from '../utils/formatters';

const RISK_COLORS = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#22c55e',
};

const panelClass = 'panel';

function shortenTitle(title, max = 22) {
  if (!title || title.length <= max) return title;
  return `${title.slice(0, max)}…`;
}

export default function AdminDashboard() {
  const view = useDashboardView('overview');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosInstance.get('/api/dashboard/admin');
        setDashboard(response.data.data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load admin dashboard.'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const moduleChartData = useMemo(
    () =>
      (dashboard?.module_completion_rates ?? []).map((mod) => ({
        name: shortenTitle(mod.module_title || `Module ${mod.module_id}`),
        rate: Math.round(mod.completion_rate ?? 0),
      })),
    [dashboard]
  );

  const riskPieData = useMemo(() => {
    const dist = dashboard?.risk_distribution ?? {};
    return [
      { name: 'High', value: dist.high_risk_count ?? 0, color: RISK_COLORS.High },
      { name: 'Medium', value: dist.medium_risk_count ?? 0, color: RISK_COLORS.Medium },
      { name: 'Low', value: dist.low_risk_count ?? 0, color: RISK_COLORS.Low },
    ];
  }, [dashboard]);

  const riskTotal = riskPieData.reduce((sum, d) => sum + d.value, 0);

  if (loading) return <DashboardSkeleton />;

  const errorAlert = error && (
    <div className="alert-error mb-5" role="alert">
      {error}
    </div>
  );

  if (error) return <div>{errorAlert}</div>;
  if (!dashboard) return null;

  if (view === 'users') {
    return (
      <div>
        {errorAlert}
        <UserManagement />
      </div>
    );
  }

  if (view === 'reports') {
    return (
      <div>
        {errorAlert}
        <section className={`${panelClass} p-6`}>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Compliance Report
          </h2>
          <ComplianceReport />
        </section>
      </div>
    );
  }

  if (view === 'settings') {
    return (
      <div className="space-y-6">
        {errorAlert}
        <AccountSettings />
        <section className={`${panelClass} p-6`}>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Organization Settings
          </h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-slate-500 dark:text-slate-400">Training Deadline</dt>
              <dd className="mt-1 text-slate-900 dark:text-slate-100">
                {dashboard.training_deadline
                  ? formatDateTime(dashboard.training_deadline)
                  : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500 dark:text-slate-400">Total Employees</dt>
              <dd className="mt-1 text-slate-900 dark:text-slate-100">
                {dashboard.total_employees ?? 0}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500 dark:text-slate-400">
                Overall Completion
              </dt>
              <dd className="mt-1 text-slate-900 dark:text-slate-100">
                {dashboard.overall_completion_percentage ?? 0}%
              </dd>
            </div>
          </dl>
        </section>
      </div>
    );
  }

  const fraudFlags = dashboard.recent_fraud_flags ?? [];

  return (
    <div>
      {errorAlert}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard title="Total Employees" value={dashboard.total_employees ?? 0} />
        <AnalyticsCard title="Certified" value={dashboard.total_certified ?? 0} color="green" />
        <AnalyticsCard
          title="Completion %"
          value={`${dashboard.overall_completion_percentage ?? 0}%`}
          color="cyan"
        />
        <AnalyticsCard
          title="Fraud Flags"
          value={dashboard.fraud_flags_count ?? 0}
          color={dashboard.fraud_flags_count > 0 ? 'red' : 'default'}
        />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`${panelClass} p-6`}>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Module Completion
          </h2>
          {moduleChartData.length === 0 ? (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              No module data available
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={moduleChartData} layout="vertical" margin={{ left: 8, right: 48 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                  formatter={(v) => [`${v}%`, 'Completion']}
                />
                <Bar dataKey="rate" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                  <LabelList
                    dataKey="rate"
                    position="right"
                    fill="#64748b"
                    fontSize={12}
                    formatter={(v) => `${v}%`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`${panelClass} p-6`}>
          <h2 className="section-title mb-4">Risk distribution</h2>
          <div className="relative mx-auto max-w-xs">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={riskPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {riskPieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {riskTotal}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">employees</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4 sm:gap-6">
            {riskPieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                <span className="text-slate-600 dark:text-slate-300">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Recent Fraud Flags
        </h2>
        {fraudFlags.length === 0 ? (
          <div
            className={`${panelClass} px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400`}
          >
            No fraud flags recorded
          </div>
        ) : (
          <div className={`overflow-hidden ${panelClass}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                      Completion Time
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                      Flagged At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {fraudFlags.map((flag) => {
                    const suspicious = (flag.completion_time_minutes ?? 0) < 10;
                    return (
                      <tr
                        key={`${flag.uid}-${flag.flagged_at}`}
                        className={
                          suspicious
                            ? 'bg-red-50 dark:bg-red-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                        }
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {flag.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                          {flag.completion_time_minutes} min
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                          {formatDateTime(flag.flagged_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
