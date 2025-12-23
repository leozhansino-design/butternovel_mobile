import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// 🔧 SECURITY: Removed hardcoded admin accounts
// Admin accounts now stored in database (admin_profile table)

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // 🔧 SECURITY: Query admin from database instead of hardcoded array
    const admin = await prisma.adminProfile.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        displayName: true,
      }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 🔧 SECURITY: Check if password is set in database
    if (!admin.password) {
      return NextResponse.json(
        { error: 'Password not configured. Please contact system administrator.' },
        { status: 401 }
      )
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, admin.password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 🔧 SECURITY: Enforce JWT secret in production
    const jwtSecret = process.env.ADMIN_JWT_SECRET
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      console.error('❌ CRITICAL: ADMIN_JWT_SECRET not set in production!')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const secret = new TextEncoder().encode(
      jwtSecret || 'butternovel-dev-secret-min-32-characters-long-DO-NOT-USE-IN-PRODUCTION'
    )

    // ✅ FIX: Include id in JWT payload to match AdminSession interface
    const token = await new SignJWT({
      id: admin.id,                    // ✅ FIX: Add id field
      email: admin.email,
      name: admin.displayName,
      role: 'super_admin', // AdminProfile doesn't have role field, default to super_admin
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // 7天过期
      .sign(secret)

    // 设置 Cookie
    const response = NextResponse.json({
      success: true,
      admin: {
        email: admin.email,
        name: admin.displayName,
        role: 'super_admin'
      }
    })

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}