import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { formatRelativeTime } from '../utils/formatters';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get('/api/notifications');
      const data = response.data.data;
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMarkRead = async (notification) => {
    if (notification.read) return;
    try {
      await axiosInstance.post('/api/notifications/mark-read', {
        notification_id: notification.id,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Loading…</p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications</p>
            )}
            {!loading &&
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleMarkRead(notification)}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/50 ${
                    !notification.read ? 'bg-slate-100 dark:bg-slate-700/30' : ''
                  }`}
                >
                  <p className="text-sm text-slate-800 dark:text-slate-200">{notification.message}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
