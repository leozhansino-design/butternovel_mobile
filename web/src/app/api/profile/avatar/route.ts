// src/app/api/profile/avatar/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // 验证文件大小 (最大 512KB)
    if (file.size > 512 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 512KB.' }, { status: 400 })
    }

    // 获取当前用户的旧头像 publicId（如果有）
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarPublicId: true }
    })

    // 如果有旧头像，先删除
    if (currentUser?.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(currentUser.avatarPublicId)
      } catch (error) {
        // 继续执行，不阻止上传新头像
      }
    }

    // 转换为 buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 上传到 Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'butternovel/avatars',
          resource_type: 'image',
          transformation: [
            { width: 256, height: 256, crop: 'fill', gravity: 'auto' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    // 更新用户头像和 publicId
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatar: uploadResult.secure_url,
        avatarPublicId: uploadResult.public_id
      },
      select: { avatar: true }
    })

    return NextResponse.json({
      avatar: updatedUser.avatar,
      message: 'Avatar uploaded successfully'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}
