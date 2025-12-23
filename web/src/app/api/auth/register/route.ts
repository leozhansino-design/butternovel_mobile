// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validateWithSchema, registerSchema } from '@/lib/validators'
import { verifyTurnstileToken } from '@/lib/turnstile'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // ✅ 使用 Zod 验证
    const validation = validateWithSchema(registerSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { name, email, password } = validation.data

    // ✅ Verify Turnstile token (if enabled)
    const turnstileToken = body.turnstileToken
    const headersList = await headers()
    const clientIp = headersList.get('x-forwarded-for')?.split(',')[0] ||
                     headersList.get('x-real-ip') ||
                     undefined

    const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp)
    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: turnstileResult.error || 'Bot verification failed' },
        { status: 400 }
      )
    }

    // ⚠️ CRITICAL: Reserve "butterpicks" name for admin/official accounts only
    if (name) {
      const normalizedName = name.trim().toLowerCase()
      const isReservedName = normalizedName === 'butterpicks' || normalizedName.includes('butterpicks')

      if (isReservedName) {
        return NextResponse.json(
          { error: 'This name is reserved for official accounts. Please choose a different name.' },
          { status: 400 }
        )
      }
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name: name ? name.trim() : 'User',
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    )
  } catch (error: unknown) {
    // 🔧 FIX: Better error logging for debugging
    console.error('[Register API] Error creating user:', error)

    // Check for specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: unknown }

      // P2002: Unique constraint violation (duplicate email)
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        )
      }

      // P1001: Can't reach database server
      if (prismaError.code === 'P1001') {
        console.error('[Register API] Database connection failed')
        return NextResponse.json(
          { error: 'Database connection error. Please try again.' },
          { status: 503 }
        )
      }

      // P1008: Operations timed out
      if (prismaError.code === 'P1008') {
        console.error('[Register API] Database timeout')
        return NextResponse.json(
          { error: 'Request timed out. Please try again.' },
          { status: 504 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}