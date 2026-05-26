import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../utils/axiosInstance';
import ModuleCard from '../components/ModuleCard';
import ProgressBar from '../components/ProgressBar';

export default function EmployeeDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosInstance.get('/api/modules');
        setModules(response.data.data.modules);
      } catch (err) {
        const message =
          err?.response?.data?.detail?.message ||
          err?.response?.data?.detail ||
          'Failed to load modules. Please try again.';
        setError(typeof message === 'string' ? message : 'Failed to load modules. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const completedCount = modules.filter((m) => m.status === 'completed').length;
  const totalCount = modules.length || 8;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">CyberShield LMS</h1>
            <p className="mt-1 text-sm text-slate-600">Welcome, {currentUser?.name}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {loading && (
          <div className="flex justify-center py-24">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
              role="status"
              aria-label="Loading modules"
            />
          </div>
        )}

        {!loading && error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-8">
              <ProgressBar completed={completedCount} total={totalCount} />
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {modules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
