'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState<number | string>(0);
  const [showPanel, setShowPanel] = useState(false);

  // Poll unread count every 30 seconds
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePanelClose = () => {
    setShowPanel(false);
    // Refresh unread count
    fetch('/api/notifications/unread-count')
      .then((res) => res.json())
      .then((data) => setUnreadCount(data.count))
      .catch((error) => console.error('Failed to fetch unread count:', error));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={24} />
        {(typeof unreadCount === 'number' && unreadCount > 0) || unreadCount === '99+' ? (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-semibold">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {showPanel && <NotificationPanel onClose={handlePanelClose} />}
    </div>
  );
}
