'use client'

import { useState, useEffect, ReactNode } from 'react'

interface AdminLayoutClientProps {
  children: ReactNode
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed')
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }

    // Listen for storage changes
    const handleStorageChange = () => {
      const saved = localStorage.getItem('adminSidebarCollapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Custom event for same-window updates
    const handleSidebarToggle = () => {
      const saved = localStorage.getItem('adminSidebarCollapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    }

    window.addEventListener('sidebarToggle', handleSidebarToggle)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebarToggle', handleSidebarToggle)
    }
  }, [])

  return (
    <div className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
      <main className="min-h-screen p-8">
        {children}
      </main>
    </div>
  )
}
