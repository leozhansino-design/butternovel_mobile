// scripts/check-env.js
// 运行: node scripts/check-env.js

console.log('🔍 Checking environment variables...\n')

const required = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'DATABASE_URL',
]

const missing = []
const present = []

required.forEach(key => {
  if (process.env[key]) {
    present.push(key)
    console.log(`✅ ${key}: ${process.env[key].substring(0, 20)}...`)
  } else {
    missing.push(key)
    console.log(`❌ ${key}: NOT SET`)
  }
})

console.log('\n📊 Summary:')
console.log(`Present: ${present.length}/${required.length}`)
console.log(`Missing: ${missing.length}/${required.length}`)

if (missing.length > 0) {
  console.log('\n⚠️  Missing variables:', missing.join(', '))
  console.log('\nPlease add them to your .env.local file')
} else {
  console.log('\n✅ All required environment variables are set!')
}