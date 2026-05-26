import { useState } from 'react';
import Sidebar, { MobileMenuButton } from './Sidebar';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import PageMotion from './PageMotion';

export default function AppLayout({ children, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-4 shadow-sm sm:px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 items-center gap-3">
            <MobileMenuButton onClick={() => setMobileOpen(true)} />
            {title && (
              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h1>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
          <PageMotion>{children}</PageMotion>
        </main>
      </div>
    </div>
  );
}
