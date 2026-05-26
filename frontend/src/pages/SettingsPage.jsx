import { useEffect, useState } from 'react';
import AccountSettings from '../components/AccountSettings';
import axiosInstance from '../utils/axiosInstance';
import { formatDateTime, getApiErrorMessage } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

function ManagerDeadlineSettings() {
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDeadline = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get('/api/manager/team-deadline');
      const data = response.data.data;
      setStatus(data);
      setDeadline(data.deadline ? data.deadline.slice(0, 16) : '');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load team deadline.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeadline();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const isoDeadline = deadline ? new Date(deadline).toISOString() : '';
      await axiosInstance.post('/api/manager/set-team-deadline', {
        deadline: isoDeadline,
      });
      setMessage('Team deadline updated.');
      await loadDeadline();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update team deadline.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel p-6">
      <h2 className="section-title mb-4">Team deadline</h2>

      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="alert-error mb-4" role="alert">
          {error}
        </div>
      )}

      {!loading && status?.deadline && (
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Current deadline: {formatDateTime(status.deadline)}
          {typeof status.days_remaining === 'number' && ` (${status.days_remaining} days remaining)`}
        </p>
      )}

      <form onSubmit={handleSave} className="flex max-w-xl flex-col gap-3 sm:flex-row">
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={saving}
          className="shrink-0 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save deadline'}
        </button>
      </form>
    </section>
  );
}

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  return (
    <div className="space-y-6">
      <AccountSettings />
      {role === 'manager' && <ManagerDeadlineSettings />}
    </div>
  );
}
