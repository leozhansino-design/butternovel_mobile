'use client'

import { Bell, User } from 'lucide-react'

type Props = {
  title: string
  adminName?: string
  adminEmail?: string
}

export default function AdminHeader({ title, adminName, adminEmail }: Props) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-72 z-10">
      <div className="h-full px-8 flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Admin Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {adminName || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500">
                {adminEmail || 'admin@butternovel.com'}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}