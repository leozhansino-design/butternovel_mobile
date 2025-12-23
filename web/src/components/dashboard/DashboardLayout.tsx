'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, BookOpen, PenLine, LogOut } from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
  userName: string
  userEmail: string
  userImage?: string | null
}

export default function DashboardLayout({ children, userName, userEmail, userImage }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) return pathname === path
    return pathname === path || pathname.startsWith(path + '/')
  }

  const navItems = [
    {
      path: '/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      exact: true
    },
    {
      path: '/dashboard/novels',
      label: 'My Stories',
      icon: BookOpen,
      exact: false
    },
    {
      path: '/dashboard/upload',
      label: 'Write',
      icon: PenLine,
      exact: false
    },
  ]

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="ButterNovel"
              width={56}
              height={56}
              className="w-14 h-14"
            />
            <span className="text-lg font-semibold text-gray-900">ButterNovel</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path, item.exact)

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                    active
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r" />
                  )}
                  <Icon size={20} className="flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            {userImage ? (
              <img
                src={userImage}
                alt={userName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                {userName?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userName || 'Author'}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60">
        {children}
      </main>
    </div>
  )
}
