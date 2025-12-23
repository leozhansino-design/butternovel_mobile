'use client';

import { useState, useEffect, useRef } from 'react';
import NotificationItem from './NotificationItem';

type Tab = 'inbox' | 'archives';

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [tab, setTab] = useState<Tab>('inbox');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, [tab]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?archived=${tab === 'archives'}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveAll = async () => {
    try {
      const res = await fetch('/api/notifications/archive-all', { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to archive all:', error);
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
        {tab === 'inbox' && notifications.length > 0 && (
          <button
            onClick={handleArchiveAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Archive All
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('inbox')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            tab === 'inbox'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Inbox
        </button>
        <button
          onClick={() => setTab('archives')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            tab === 'archives'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Archives
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {tab === 'inbox' ? 'No new notifications' : 'No archived notifications'}
          </div>
        ) : (
          notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onArchive={fetchNotifications}
            />
          ))
        )}
      </div>
    </div>
  );
}
