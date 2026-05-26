import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Moon, Shield, Sun } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

function getLoginErrorMessage(error) {
  const code = error?.code;
  if (code) {
    switch (code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/user-disabled':
        return 'This account has been deactivated.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return error.message || 'Login failed. Please try again.';
    }
  }

  const detail = error?.response?.data?.detail;
  if (detail) {
    const message = typeof detail === 'string' ? detail : detail.message;
    if (message?.toLowerCase().includes('deactivated')) {
      return 'This account has been deactivated.';
    }
    if (detail.error === 'USER_NOT_FOUND') {
      return 'No account found with this email.';
    }
    return message || 'Login failed. Please try again.';
  }

  return 'Login failed. Please try again.';
}

export default function Login() {
  const { login, isLoggingIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(getLoginErrorMessage(err));
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 dark:bg-slate-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 rounded-lg p-2 text-slate-600 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10">
            <Shield className="h-8 w-8 text-cyan-500 dark:text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">CyberShield</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingIn && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isLoggingIn ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
