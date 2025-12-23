// src/middleware.ts
// Next.js Middleware for handling redirects

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // 重定向旧的分类路由到统一搜索页
  // /category/romance → /search?category=Romance
  if (pathname.startsWith('/category/')) {
    const categorySlug = pathname.replace('/category/', '')
    // 将slug转换为首字母大写的分类名
    const categoryName = categorySlug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    const searchParams = new URLSearchParams(search)
    searchParams.set('category', categoryName)

    const redirectUrl = new URL(`/search?${searchParams.toString()}`, request.url)
    return NextResponse.redirect(redirectUrl, { status: 301 })
  }

  // 重定向旧的标签路由到统一搜索页
  // /tags/ceo → /search?tags=ceo
  if (pathname.startsWith('/tags/')) {
    const tagSlug = pathname.replace('/tags/', '')

    const searchParams = new URLSearchParams(search)
    // 保留可能存在的其他查询参数（如 ?sort=hot）
    const existingTags = searchParams.get('tags')
    if (existingTags) {
      // 如果已经有tags参数，追加新标签
      searchParams.set('tags', `${existingTags},${tagSlug}`)
    } else {
      searchParams.set('tags', tagSlug)
    }

    const redirectUrl = new URL(`/search?${searchParams.toString()}`, request.url)
    return NextResponse.redirect(redirectUrl, { status: 301 })
  }

  // 允许其他请求继续
  return NextResponse.next()
}

// 配置matcher，只匹配需要处理的路由
export const config = {
  matcher: [
    '/category/:path*',
    '/tags/:path*',
  ],
}
