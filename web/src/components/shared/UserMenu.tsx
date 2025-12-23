'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import NotificationPreferencesModal from '@/components/notification/NotificationPreferencesModal';

type UserMenuProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onOpenLibrary?: (view: 'profile' | 'library') => void;
};

export default function UserMenu({ user, onOpenLibrary }: UserMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: pathname });
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* User Button */}
      <button
        className="flex items-center gap-3 px-4 py-2 rounded-full hover:bg-sky-50/50 transition-all duration-200"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center text-sky-700 font-semibold text-sm ring-2 ring-sky-200">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <span className="font-medium text-gray-900 text-sm hidden lg:block">{user.name}</span>
      </button>

      {/* Dropdown Menu */}
      <div className={`absolute right-0 mt-3 w-56 glass-effect rounded-2xl card-shadow-xl border border-sky-200/50 overflow-hidden transition-all duration-200 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>

        {/* User Info Header */}
        <div className="px-4 py-4 bg-gradient-to-br from-sky-50/50 to-white border-b border-sky-100/50">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center text-sky-700 font-semibold border border-sky-200">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm truncate">{user.name || 'User'}</div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          {/* Profile */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenLibrary?.('profile');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span>Profile</span>
          </button>

          {/* My Library */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenLibrary?.('library');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span>My Library</span>
          </button>

          {/* Divider */}
          <div className="h-px bg-sky-100/50 my-2 mx-4"></div>

          {/* Writer Dashboard */}
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span>Writer Dashboard</span>
          </Link>

          {/* Upload My Novel */}
          <Link
            href="/dashboard/upload"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <span>Upload My Novel</span>
          </Link>

          {/* Manage My Novels */}
          <Link
            href="/dashboard/novels"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <span>Manage My Novels</span>
          </Link>

          {/* Divider */}
          <div className="h-px bg-sky-100/50 my-2 mx-4"></div>

          {/* Notification Settings */}
          <button
            onClick={() => {
              setIsOpen(false);
              setShowPreferences(true);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <span>Notification Settings</span>
          </button>
        </div>

        {/* Sign Out */}
        <div className="border-t border-sky-100/50">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Notification Preferences Modal */}
      {showPreferences && (
        <NotificationPreferencesModal
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
}
