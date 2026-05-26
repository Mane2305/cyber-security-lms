import { NavLink, useNavigate } from 'react-router-dom';
import {
  Award,
  BadgeCheck,
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const NAV_BY_ROLE = {
  employee: [
    { to: '/dashboard/employee', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/dashboard/employee/modules', label: 'Modules', icon: FileText },
    { to: '/badges', label: 'Badges', icon: Award },
    { to: '/certificate', label: 'Certificate', icon: BadgeCheck },
    { to: '/dashboard/employee/settings', label: 'Settings', icon: Settings },
  ],
  manager: [
    { to: '/dashboard/manager', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/dashboard/manager/team', label: 'Team', icon: Users },
    { to: '/dashboard/manager/reports', label: 'Reports', icon: BarChart3 },
    { to: '/dashboard/manager/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { to: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/dashboard/admin/users', label: 'Users', icon: Users },
    { to: '/dashboard/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/dashboard/admin/settings', label: 'Settings', icon: Settings },
  ],
};

const ROLE_BADGE = {
  employee: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
  manager: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  admin: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
};

function getInitials(name, email) {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return (email?.[0] ?? 'U').toUpperCase();
}

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'border-l-2 border-cyan-500 bg-slate-200/80 pl-[10px] text-cyan-600 dark:bg-slate-700/50 dark:text-cyan-400'
      : 'border-l-2 border-transparent text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-slate-100'
  }`;

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const role = currentUser?.role ?? 'employee';
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.employee;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-5 dark:border-slate-700">
        <Shield className="h-7 w-7 text-cyan-500 dark:text-cyan-400" />
        <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">CyberShield</span>
        {mobileOpen && (
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto rounded-lg p-1 text-slate-500 hover:bg-slate-200 lg:hidden dark:hover:bg-slate-700"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onMobileClose}
            className={linkClass}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4 dark:border-slate-700">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-600 dark:text-cyan-400">
            {getInitials(currentUser?.name, currentUser?.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {currentUser?.name || currentUser?.email}
            </p>
            <span
              className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE[role] ?? ROLE_BADGE.employee}`}
            >
              {role}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-slate-200 bg-white lg:hidden dark:border-slate-800 dark:bg-slate-900">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-2 text-slate-600 hover:bg-slate-200 lg:hidden dark:text-slate-300 dark:hover:bg-slate-700"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
