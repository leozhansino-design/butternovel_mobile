'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Plus,
  Upload,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Upload Novel',
    href: '/admin/novels/new',
    icon: Plus,
  },
  {
    title: 'Batch Upload',
    href: '/admin/batch-upload',
    icon: Upload,
  },
  {
    title: 'Batch Upload Shorts',
    href: '/admin/batch-upload-shorts',
    icon: Upload,
  },
  {
    title: 'Manage Novels',
    href: '/admin/novels',
    icon: BookOpen,
  },
  {
    title: 'Manage Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Admin Profile',
    href: '/admin/profile',
    icon: Users,
  },
]

type Props = {
  adminName?: string
  adminEmail?: string
}

export default function AdminSidebar({ adminName, adminEmail }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed')
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('adminSidebarCollapsed', String(newState))
    // Trigger custom event to notify layout
    window.dispatchEvent(new Event('sidebarToggle'))
  }

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include' // ✅ 确保 cookie 总是被发送
      })
      router.push('/auth/admin-login')
      router.refresh()
    } catch (error) {
      alert('Logout failed')
    }
  }

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#1a1a1a] min-h-screen fixed left-0 top-0 flex flex-col transition-all duration-300 ease-in-out`}>
      {/* Logo Section */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
          <div className={`text-[#D4A574] font-bold tracking-tight transition-all duration-300 ${isCollapsed ? 'text-lg' : 'text-2xl'}`}>
            {isCollapsed ? 'BN' : 'ButterNovel'}
          </div>
        </Link>
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-8">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'}
                    ${isActive
                      ? 'bg-[#D4A574] text-[#1a1a1a]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10">
        {/* Admin Info */}
        {adminName && !isCollapsed && (
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4A574] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#1a1a1a] text-sm font-bold">
                  {adminName[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {adminName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {adminEmail}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed Admin Avatar */}
        {adminName && isCollapsed && (
          <div className="p-4 border-b border-white/10 flex justify-center">
            <div className="w-10 h-10 bg-[#D4A574] rounded-full flex items-center justify-center" title={adminName}>
              <span className="text-[#1a1a1a] text-sm font-bold">
                {adminName[0].toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-3">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all ${isCollapsed ? 'px-3 justify-center' : 'px-4'}`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}