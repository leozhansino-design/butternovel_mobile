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
  console.log('🔍 Diagnosing author ID mismatches...\n')

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

  console.log('📋 Users in database:')
  console.log('─'.repeat(80))
  users.forEach(user => {
    console.log(`ID: ${user.id}`)
    console.log(`Email: ${user.email}`)
    console.log(`Name: ${user.name}`)
    console.log(`Writer: ${user.isWriter}`)
    console.log(`Writer Name: ${user.writerName}`)
    console.log('─'.repeat(80))
  })

  // 获取所有小说
  const novels = await prisma.novel.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      authorId: true,
      authorName: true,
    }
  })

  console.log('\n📚 Novels in database:')
  console.log('─'.repeat(80))
  novels.forEach(novel => {
    console.log(`ID: ${novel.id}`)
    console.log(`Title: ${novel.title}`)
    console.log(`Slug: ${novel.slug}`)
    console.log(`Author ID: ${novel.authorId}`)
    console.log(`Author Name: ${novel.authorName}`)

    // 检查author ID是否存在于User表中
    const userExists = users.find(u => u.id === novel.authorId)
    if (!userExists) {
      console.log(`⚠️  WARNING: Author ID "${novel.authorId}" NOT FOUND in User table!`)
    } else {
      console.log(`✅ Author ID matches user: ${userExists.email}`)
    }
    console.log('─'.repeat(80))
  })

  // 汇总问题
  console.log('\n📊 Summary:')
  console.log('─'.repeat(80))
  console.log(`Total Users: ${users.length}`)
  console.log(`Total Novels: ${novels.length}`)

  const mismatches = novels.filter(novel =>
    !users.find(u => u.id === novel.authorId)
  )

  console.log(`\n⚠️  Novels with invalid author IDs: ${mismatches.length}`)
  if (mismatches.length > 0) {
    console.log('\nNovels that need fixing:')
    mismatches.forEach(novel => {
      console.log(`  - "${novel.title}" (ID: ${novel.id}, authorId: ${novel.authorId})`)
    })
  }

  // 建议修复方案
  if (mismatches.length > 0 && users.length > 0) {
    const adminUser = users.find(u =>
      u.email.includes('admin') ||
      u.writerName === 'ButterNovel Official' ||
      u.name === 'butterpicks'
    )

    if (adminUser) {
      console.log('\n💡 Suggested fix:')
      console.log(`Update all novels to use admin user ID: ${adminUser.id}`)
      console.log(`Admin user: ${adminUser.email} (${adminUser.name})`)
      console.log('\nRun: npm run db:fix-authors')
    }
  }

  console.log('─'.repeat(80))
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
