import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard - Coming in Chunk 6</h1>
        <p className="mt-4 text-slate-600">Welcome, {currentUser?.name}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
