import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { join } from 'path'

// Load .env file if it exists
const envPath = join(process.cwd(), '.env')
if (existsSync(envPath)) {
  config()
}

// Strip quotes from environment variables if present
if (process.env.DATABASE_URL?.startsWith('"') && process.env.DATABASE_URL?.endsWith('"')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.slice(1, -1)
}
if (process.env.DIRECT_URL?.startsWith('"') && process.env.DIRECT_URL?.endsWith('"')) {
  process.env.DIRECT_URL = process.env.DIRECT_URL.slice(1, -1)
}

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing author ID mismatches...\n')

  // 获取所有用户
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isWriter: true,
      writerName: true,
    }
  })

  if (users.length === 0) {
    console.log('❌ No users found in database. Please create users first.')
    return
  }

  // 查找admin/butterpicks用户
  const adminUser = users.find(u =>
    u.email.includes('admin') ||
    u.writerName === 'ButterNovel Official' ||
    u.name?.toLowerCase().includes('butterpicks')
  )

  if (!adminUser) {
    console.log('❌ Admin user not found. Available users:')
    users.forEach(u => console.log(`  - ${u.email} (${u.name})`))
    console.log('\nPlease specify which user should be the author.')
    return
  }

  console.log('✅ Found admin user:')
  console.log(`   ID: ${adminUser.id}`)
  console.log(`   Email: ${adminUser.email}`)
  console.log(`   Name: ${adminUser.name}`)
  console.log(`   Writer Name: ${adminUser.writerName}\n`)

  // 获取所有小说
  const novels = await prisma.novel.findMany({
    select: {
      id: true,
      title: true,
      authorId: true,
      authorName: true,
    }
  })

  console.log(`📚 Found ${novels.length} novels\n`)

  // 找出需要修复的小说
  const novelsToFix = novels.filter(novel => novel.authorId !== adminUser.id)

  if (novelsToFix.length === 0) {
    console.log('✅ All novels already have correct author IDs. Nothing to fix.')
    return
  }

  console.log(`⚠️  Found ${novelsToFix.length} novels with incorrect author IDs:\n`)
  novelsToFix.forEach(novel => {
    console.log(`  - "${novel.title}"`)
    console.log(`    Current authorId: ${novel.authorId}`)
    console.log(`    Current authorName: ${novel.authorName}`)
  })

  console.log('\n🔧 Updating novels...\n')

  // 更新所有小说的authorId
  for (const novel of novelsToFix) {
    try {
      await prisma.novel.update({
        where: { id: novel.id },
        data: {
          authorId: adminUser.id,
          authorName: adminUser.writerName || adminUser.name || 'ButterNovel Official'
        }
      })
      console.log(`✅ Updated: "${novel.title}"`)
    } catch (error) {
      console.log(`❌ Failed to update: "${novel.title}"`)
      console.error(error)
    }
  }

  console.log('\n✅ Fix completed!')
  console.log(`   Updated ${novelsToFix.length} novels`)
  console.log(`   New author ID: ${adminUser.id}`)
  console.log(`   New author name: ${adminUser.writerName || adminUser.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
