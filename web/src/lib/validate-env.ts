// src/lib/validate-env.ts
// 🔧 增强版环境变量验证 - 检查存在性、格式和连接

// 🔧 FIX: Only access process.env in Node.js environment
const requiredEnvVars = typeof window === 'undefined' ? {
  // 数据库
  DATABASE_URL: process.env.DATABASE_URL,

  // NextAuth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Admin
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET,
} : {}

/**
 * 验证 DATABASE_URL 格式是否正确
 */
function validateDatabaseUrl(url: string): { valid: boolean; error?: string } {
  // 检查是否是示例/占位符（但允许 db.prisma.io，因为它是有效的 Vercel Prisma Postgres）
  const invalidPatterns = [
    'your-database-url',      // ❌ 占位符
    'postgresql://...',       // ❌ 未填写
    'postgres://...',         // ❌ 未填写
    'localhost:5432',         // ❌ 示例
    'example.com',            // ❌ 示例
  ]

  for (const pattern of invalidPatterns) {
    if (url.includes(pattern)) {
      return {
        valid: false,
        error: `DATABASE_URL contains invalid placeholder: "${pattern}"`
      }
    }
  }

  // 检查是否是有效的 PostgreSQL URL
  // 支持 URL 编码的字符（%XX）- Supabase 连接字符串会包含这些
  const postgresUrlPattern = /^postgres(ql)?:\/\/.+[:@].+@.+:\d+\/.+$/
  if (!postgresUrlPattern.test(url)) {
    return {
      valid: false,
      error: 'DATABASE_URL must be a valid PostgreSQL connection string (postgresql://user:password@host:port/database)'
    }
  }

  return { valid: true }
}

/**
 * 验证环境变量存在性和格式
 */
export function validateEnv() {
  const errors: string[] = []
  const missing: string[] = []

  // 1. 检查必需变量是否存在
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      missing.push(key)
    }
  })

  if (missing.length > 0) {
    console.error('\n❌ 缺少必需的环境变量:')
    missing.forEach(key => {
      console.error(`   - ${key}`)
    })
    console.error('\n💡 解决方案:')
    console.error('   1. 创建 .env 文件（复制 .env.example）')
    console.error('   2. 填入所有必需的环境变量')
    console.error('   3. 重启开发服务器')
    console.error('\n📖 详细指南: 查看 DATABASE_FIX.md\n')
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }

  // 2. 验证 DATABASE_URL 格式
  const dbUrl = process.env.DATABASE_URL!
  const dbValidation = validateDatabaseUrl(dbUrl)

  if (!dbValidation.valid) {
    console.error('\n❌ DATABASE_URL 配置错误:')
    console.error(`   ${dbValidation.error}`)
    console.error('\n💡 解决方案:')
    console.error('   1. 访问 Vercel Dashboard -> Storage -> Database')
    console.error('   2. 点击 ".env.local" 标签')
    console.error('   3. 复制正确的 DATABASE_URL')
    console.error('   4. 更新 .env 文件')
    console.error('   5. 重启开发服务器')
    console.error('\n📖 详细指南: 查看 DATABASE_FIX.md')
    console.error('\n⚠️  当前 DATABASE_URL: ' + dbUrl.substring(0, 40) + '...')
    console.error('')
    throw new Error('Invalid DATABASE_URL configuration')
  }

}

/**
 * 测试数据库连接（可选，用于启动时检查）
 */
export async function testDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    // 动态导入 prisma 避免循环依赖
    const { prisma } = await import('./prisma')

    // 执行简单查询测试连接
    await prisma.$queryRaw`SELECT 1`

    return { success: true }
  } catch (error: any) {
    const errorMessage = error.message || String(error)

    console.error('\n❌ 数据库连接失败:')
    console.error(`   ${errorMessage}`)

    if (error.code === 'P1001') {
      console.error('\n💡 这通常意味着:')
      console.error('   1. DATABASE_URL 配置错误')
      console.error('   2. 数据库服务器不可达')
      console.error('   3. 网络连接问题')
      console.error('\n📖 查看修复指南: DATABASE_FIX.md\n')
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

// 自动验证（只在服务端，且不在构建时）
if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  // 验证环境变量
  try {
    validateEnv()
  } catch (error) {
    // 在开发环境输出警告但不阻塞
    if (process.env.NODE_ENV === 'development') {
      console.warn('\n⚠️  环境变量验证失败，但应用将继续启动')
      console.warn('⚠️  错误:', error)
    }
  }

  // 在开发环境下测试数据库连接
  if (process.env.NODE_ENV === 'development') {
    testDatabaseConnection().catch(() => {
      // 不阻塞应用启动，但输出警告
      console.warn('\n⚠️  警告: 数据库连接测试失败，但应用将继续启动')
      console.warn('⚠️  大部分功能将不可用，请修复数据库配置\n')
    })
  }
}