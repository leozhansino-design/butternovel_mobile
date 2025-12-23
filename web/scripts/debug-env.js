// debug-env.js
// 运行: node debug-env.js

console.log('🔍 Environment Variables Debug\n')

const vars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'ADMIN_JWT_SECRET'
]

console.log('📊 Current Environment Variables:\n')

vars.forEach(key => {
  const value = process.env[key]
  if (value) {
    const display = value.length > 30 ? value.substring(0, 30) + '...' : value
    console.log(`✅ ${key}: ${display}`)
  } else {
    console.log(`❌ ${key}: NOT SET`)
  }
})

console.log('\n💡 Debugging Tips:')
console.log('1. Check .env file is in project root')
console.log('2. Restart dev server: npm run dev')
console.log('3. Clear Next.js cache: rm -rf .next')
console.log('4. Check file permissions: ls -la .env')