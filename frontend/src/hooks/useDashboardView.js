import { useLocation } from 'react-router-dom';

export function useDashboardView(defaultView = 'overview') {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];

  const knownViews = ['team', 'reports', 'users', 'settings', 'modules'];
  if (knownViews.includes(last)) return last;
  return defaultView;
}
