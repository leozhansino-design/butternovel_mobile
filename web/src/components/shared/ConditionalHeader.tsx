// src/components/shared/ConditionalHeader.tsx
'use client'

import { usePathname } from 'next/navigation'

interface ConditionalHeaderProps {
  children: React.ReactNode
}

export default function ConditionalHeader({ children }: ConditionalHeaderProps) {
  const pathname = usePathname()
  
  // ✅ 这些路径不显示 Header
  const hideHeaderPaths = [
    '/admin',           // 管理后台
    '/chapters/',       // 阅读器页面
  ]
  
  const shouldHideHeader = hideHeaderPaths.some(path => pathname.includes(path))
  
  if (shouldHideHeader) {
    return null
  }
  
  return <>{children}</>
}