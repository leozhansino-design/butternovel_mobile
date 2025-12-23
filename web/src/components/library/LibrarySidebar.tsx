// src/components/library/LibrarySidebar.tsx
'use client'

type LibrarySidebarProps = {
  activeView: 'profile' | 'library'
  onViewChange: (view: 'profile' | 'library') => void
}

export default function LibrarySidebar({ activeView, onViewChange }: LibrarySidebarProps) {
  const menuItems = [
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'library' as const,
      label: 'My Library',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ]

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <div className="space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeView === item.id
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-white hover:shadow-sm'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
