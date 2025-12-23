// src/components/ScrollToTop.tsx
// 客户端组件：页面加载时滚动到顶部
'use client'

import { useEffect } from 'react'

export default function ScrollToTop() {
  useEffect(() => {
    // 立即滚动到顶部
    window.scrollTo(0, 0)
  }, [])

  return null
}
