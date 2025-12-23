import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating admin user...')

  // 先检查是否已存在
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@butternovel.com' }
  })

  if (existingUser) {
    console.log('✅ Admin user already exists:', existingUser.email)
    console.log('   ID:', existingUser.id)
    return
  }

  // 创建管理员用户
  const admin = await prisma.user.create({
    data: {
      email: 'admin@butternovel.com',
      name: 'Admin',
      isWriter: true,
      writerName: 'ButterNovel Official',
      isVerified: true,
      isActive: true,
    }
  })

  console.log('✅ Admin user created!')
  console.log('   ID:', admin.id)
  console.log('   Email:', admin.email)
  console.log('   Name:', admin.name)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })