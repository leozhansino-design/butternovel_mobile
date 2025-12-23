#!/usr/bin/env node
/**
 * 🔧 Admin Password Setup Utility
 *
 * This script allows you to set or update the admin password in the database.
 *
 * Usage:
 *   node scripts/set-admin-password.js
 *
 * Features:
 * - Interactive password input
 * - Automatic bcrypt hashing
 * - Updates AdminProfile table in database
 * - Validates password strength
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const prisma = new PrismaClient()

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Promisify readline question
function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

// Hide password input
function questionSecret(query) {
  return new Promise((resolve) => {
    const stdin = process.stdin
    stdin.resume()
    stdin.setRawMode(true)

    process.stdout.write(query)
    let password = ''

    stdin.on('data', function listener(char) {
      char = char.toString()

      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl-D
          stdin.setRawMode(false)
          stdin.pause()
          stdin.removeListener('data', listener)
          process.stdout.write('\n')
          resolve(password)
          break
        case '\u0003': // Ctrl-C
          process.exit()
          break
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1)
            process.stdout.clearLine()
            process.stdout.cursorTo(0)
            process.stdout.write(query + '*'.repeat(password.length))
          }
          break
        default:
          password += char
          process.stdout.write('*')
          break
      }
    })
  })
}

// Validate password strength
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  return { valid: true }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}`)
  console.log('╔═══════════════════════════════════════╗')
  console.log('║   🔐 Admin Password Setup Utility    ║')
  console.log('║         ButterNovel Platform          ║')
  console.log('╚═══════════════════════════════════════╝')
  console.log(colors.reset)

  try {
    // Step 1: Check admin profile exists
    console.log(`\n${colors.blue}📋 Step 1: Checking admin profile...${colors.reset}`)

    const admin = await prisma.adminProfile.findUnique({
      where: { email: 'admin@butternovel.com' }
    })

    if (!admin) {
      console.log(`${colors.red}❌ Error: Admin profile not found in database!${colors.reset}`)
      console.log(`${colors.yellow}Please ensure admin@butternovel.com exists in admin_profile table.${colors.reset}`)
      process.exit(1)
    }

    console.log(`${colors.green}✓ Found admin profile: ${admin.email}${colors.reset}`)
    console.log(`   Display Name: ${admin.displayName}`)

    // Step 2: Get new password
    console.log(`\n${colors.blue}📋 Step 2: Set new password${colors.reset}`)
    console.log(`${colors.yellow}Password requirements:${colors.reset}`)
    console.log(`  • At least 8 characters long`)
    console.log(`  • Contains uppercase and lowercase letters`)
    console.log(`  • Contains at least one number`)
    console.log()

    let password, confirmPassword
    let valid = false

    while (!valid) {
      password = await questionSecret('Enter new password: ')

      if (!password) {
        console.log(`${colors.red}❌ Password cannot be empty${colors.reset}\n`)
        continue
      }

      const validation = validatePassword(password)
      if (!validation.valid) {
        console.log(`${colors.red}❌ ${validation.message}${colors.reset}\n`)
        continue
      }

      confirmPassword = await questionSecret('Confirm password: ')

      if (password !== confirmPassword) {
        console.log(`${colors.red}❌ Passwords do not match${colors.reset}\n`)
        continue
      }

      valid = true
    }

    // Step 3: Hash password
    console.log(`\n${colors.blue}📋 Step 3: Hashing password...${colors.reset}`)
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log(`${colors.green}✓ Password hashed successfully${colors.reset}`)

    // Step 4: Update database
    console.log(`\n${colors.blue}📋 Step 4: Updating database...${colors.reset}`)
    await prisma.adminProfile.update({
      where: { email: 'admin@butternovel.com' },
      data: { password: hashedPassword }
    })
    console.log(`${colors.green}✓ Password updated in database${colors.reset}`)

    // Success message
    console.log(`\n${colors.bright}${colors.green}`)
    console.log('╔═══════════════════════════════════════╗')
    console.log('║        ✅ Success!                    ║')
    console.log('║   Password updated successfully       ║')
    console.log('╚═══════════════════════════════════════╝')
    console.log(colors.reset)

    console.log(`\n${colors.cyan}You can now login with:${colors.reset}`)
    console.log(`  Email: ${colors.bright}admin@butternovel.com${colors.reset}`)
    console.log(`  Password: ${colors.bright}[your new password]${colors.reset}`)

  } catch (error) {
    console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}`)
    if (error.code === 'P1001') {
      console.log(`\n${colors.yellow}💡 Tip: Make sure DATABASE_URL is set in .env file${colors.reset}`)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    rl.close()
  }
}

main()
