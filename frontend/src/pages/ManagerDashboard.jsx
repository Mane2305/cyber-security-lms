import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import axiosInstance from '../utils/axiosInstance';
import AnalyticsCard from '../components/AnalyticsCard';
import TeamProgressTable from '../components/TeamProgressTable';
import ComplianceReport from '../components/ComplianceReport';
import RiskScoreBadge from '../components/RiskScoreBadge';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import { useDashboardView } from '../hooks/useDashboardView';
import { getApiErrorMessage } from '../utils/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function getBarColor(pct) {
  if (pct < 40) return '#ef4444';
  if (pct <= 70) return '#f59e0b';
  return '#22c55e';
}

const panelClass = 'panel p-6';

export default function ManagerDashboard() {
  const view = useDashboardView('overview');
  const [dashboard, setDashboard] = useState(null);
  const [riskMap, setRiskMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetail, setMemberDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const [dashRes, riskRes] = await Promise.all([
          axiosInstance.get('/api/dashboard/manager'),
          axiosInstance.get('/api/manager/team-risk'),
        ]);
        setDashboard(dashRes.data.data);

        const riskMembers = riskRes.data.data?.team_members ?? [];
        const map = {};
        riskMembers.forEach((m) => {
          map[m.uid] = {
            score: m.risk_score,
            level: m.risk_level,
            reasons: m.reasons ?? [],
          };
        });
        setRiskMap(map);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load manager dashboard.'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const teamChartData = useMemo(
    () =>
      (dashboard?.team_members ?? []).map((m) => ({
        name: (m.name || m.email || 'Unknown').split(' ')[0],
        completion: m.completion_percentage ?? 0,
        fill: getBarColor(m.completion_percentage ?? 0),
      })),
    [dashboard]
  );

  const membersWithRisk = useMemo(
    () =>
      (dashboard?.team_members ?? []).map((m) => ({
        ...m,
        risk: riskMap[m.uid],
      })),
    [dashboard, riskMap]
  );

  const handleMemberClick = async (member) => {
    setSelectedMember(member);
    setDetailLoading(true);
    setMemberDetail(null);
    try {
      const response = await axiosInstance.get(`/api/manager/employee-detail/${member.uid}`);
      setMemberDetail(response.data.data);
    } catch {
      setMemberDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRemind = async (member) => {
    setActionLoading(member.uid);
    setActionMessage('');
    setActionError('');
    try {
      await axiosInstance.post('/api/manager/remind-employee', {
        employee_uid: member.uid,
        message: 'Please complete your assigned CyberShield training.',
      });
      setActionMessage(`Reminder sent to ${member.name || member.email}.`);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to send reminder.'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const errorAlert = error && (
    <div className="alert-error mb-5" role="alert">
      {error}
    </div>
  );

  if (error) {
    return <div>{errorAlert}</div>;
  }

  if (!dashboard) return null;

  if (view === 'team') {
    return (
      <div>
        {errorAlert}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Team Members
          </h2>
          {actionMessage && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
              {actionMessage}
            </div>
          )}
          {actionError && (
            <div className="alert-error mb-4" role="alert">
              {actionError}
            </div>
          )}
          <TeamProgressTable
            members={membersWithRisk}
            onMemberClick={handleMemberClick}
            onRemind={handleRemind}
            actionLoading={actionLoading}
          />
        </section>
        <MemberDetailDialog
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
          detailLoading={detailLoading}
          memberDetail={memberDetail}
        />
      </div>
    );
  }

  if (view === 'reports') {
    return (
      <div>
        {errorAlert}
        <section className={panelClass}>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Compliance Report
          </h2>
          <ComplianceReport />
        </section>
      </div>
    );
  }

  return (
    <div>
      {errorAlert}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard title="Team Size" value={dashboard.team_size ?? 0} />
        <AnalyticsCard title="Fully Certified" value={dashboard.fully_certified ?? 0} color="green" />
        <AnalyticsCard title="In Progress" value={dashboard.in_progress ?? 0} />
        <AnalyticsCard title="Not Started" value={dashboard.not_started ?? 0} />
      </section>

      <section className={`mb-8 p-8 text-center ${panelClass}`}>
        <p className="text-5xl font-bold text-cyan-600 dark:text-cyan-400">
          {dashboard.team_completion_percentage ?? 0}%
        </p>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Team Completion Rate
        </p>
      </section>

      <section className={`mb-8 ${panelClass}`}>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Team Progress
        </h2>
        {teamChartData.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">No team members</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={teamChartData} margin={{ bottom: 8 }}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--foreground)',
                }}
                formatter={(v) => [`${v}%`, 'Completion']}
              />
              <Bar dataKey="completion" radius={[4, 4, 0, 0]}>
                {teamChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <MemberDetailDialog
        selectedMember={selectedMember}
        setSelectedMember={setSelectedMember}
        detailLoading={detailLoading}
        memberDetail={memberDetail}
      />
    </div>
  );
}

function MemberDetailDialog({ selectedMember, setSelectedMember, detailLoading, memberDetail }) {
  return (
    <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
      <DialogContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            {selectedMember?.name || 'Employee Details'}
          </DialogTitle>
        </DialogHeader>
        {detailLoading && (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        )}
        {!detailLoading && memberDetail && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{memberDetail.email}</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-slate-500">Completion</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {memberDetail.completion_percentage}%
                </p>
              </div>
              {memberDetail.risk_score && (
                <div className="flex flex-col items-center">
                  <p className="mb-1 text-xs text-slate-500">Risk Score</p>
                  <RiskScoreBadge
                    score={memberDetail.risk_score.score}
                    level={memberDetail.risk_score.level}
                    reasons={memberDetail.risk_score.reasons}
                  />
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Modules: {memberDetail.modules_completed}/{memberDetail.modules_total} · Badges:{' '}
              {memberDetail.badges_earned}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
