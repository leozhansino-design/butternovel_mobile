'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Archive, X } from 'lucide-react';

interface NotificationItemProps {
  notification: any;
  onArchive: () => void;
}

// Check if this is an author notification
function isAuthorNotification(type: string): boolean {
  const authorTypes = ['NOVEL_RATING', 'NOVEL_COMMENT'];
  return authorTypes.includes(type);
}

export default function NotificationItem({
  notification,
  onArchive,
}: NotificationItemProps) {
  const router = useRouter();

  // Click notification content - mark as read and navigate
  const handleClick = async () => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    // Navigate to link
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  // Archive notification
  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    try {
      await fetch(`/api/notifications/${notification.id}/archive`, {
        method: 'POST',
      });
      onArchive();
    } catch (error) {
      console.error('Failed to archive notification:', error);
    }
  };

  const isAuthor = isAuthorNotification(notification.type);
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: enUS,
  });

  return (
    <div
      className={`p-4 border-b border-gray-200 dark:border-gray-700 transition-colors relative group ${
        !notification.isRead
          ? 'bg-blue-50 dark:bg-blue-900/10'
          : ''
      } ${
        isAuthor
          ? 'border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-900/10'
          : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar/Icon */}
        <div
          onClick={handleClick}
          className="cursor-pointer flex-shrink-0"
        >
          {notification.imageUrl ? (
            <img
              src={notification.imageUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-lg">🔔</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          onClick={handleClick}
          className="flex-1 min-w-0 cursor-pointer"
        >
          {isAuthor && (
            <span className="inline-block text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
              ✍️ Author Notification
            </span>
          )}

          <div className="font-medium text-gray-900 dark:text-white text-sm">
            {notification.title}
          </div>

          {notification.content && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {notification.content}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {timeAgo}
            </div>
            {!notification.isRead && (
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            )}
          </div>
        </div>

        {/* Archive button */}
        {!notification.isArchived && (
          <button
            onClick={handleArchive}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex-shrink-0"
            title="Archive"
          >
            <Archive className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}
