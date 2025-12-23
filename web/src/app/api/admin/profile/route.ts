// src/app/api/admin/profile/route.ts (改进版 - 使用数据库)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAdminAuth } from '@/lib/admin-middleware'

export const GET = withAdminAuth(async (session, request: Request) => {
  try {

    // ⭐ 从数据库读取 admin profile
    let profile = await prisma.adminProfile.findUnique({
      where: { email: session.email },
    })

    // 如果不存在，创建默认的
    if (!profile) {
      profile = await prisma.adminProfile.create({
        data: {
          email: session.email,
          displayName: 'Admin',
          bio: '',
          avatar: null,
        },
      })
    }

    return NextResponse.json({
      displayName: profile.displayName,
      bio: profile.bio || '',
      avatar: profile.avatar || '',
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
})

export const POST = withAdminAuth(async (session, request: Request) => {
  try {

    const { displayName, bio, avatar } = await request.json()

    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }

    // ⭐ 验证头像大小（Base64 编码会增大约 1.33 倍）
    if (avatar && avatar.length > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Avatar is too large' },
        { status: 400 }
      )
    }

    // ⭐ 更新或创建 admin profile
    const profile = await prisma.adminProfile.upsert({
      where: { email: session.email },
      update: {
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        avatar: avatar || null,
      },
      create: {
        email: session.email,
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        avatar: avatar || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      displayName: profile.displayName,
      bio: profile.bio,
      avatar: profile.avatar ? 'Image saved' : 'No avatar',
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
})