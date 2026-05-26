import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { getApiErrorMessage } from '../utils/formatters';

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

export default function AccountSettings() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/api/auth/change-password', {
        new_password: password,
      });
      setPassword('');
      setConfirmPassword('');
      setMessage('Password changed successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to change password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel p-6">
      <h2 className="section-title mb-4">Account settings</h2>

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

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </section>
  );
}
