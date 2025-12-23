/**
 * Script to set admin role for butterpicks account
 * Run with: npx tsx scripts/set-admin-role.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setAdminRole() {
  try {
    console.log('🔧 Setting admin role for butterpicks account...')

    // Find butterpicks user by email
    const butterPicksEmail = 'butterpicks@gmail.com'

    const user = await prisma.user.findUnique({
      where: { email: butterPicksEmail },
      select: { id: true, email: true, name: true, role: true }
    })

    if (!user) {
      console.error(`❌ User with email ${butterPicksEmail} not found`)
      console.log('Please make sure the butterpicks account exists in the database')
      return
    }

    console.log('📋 Current user data:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Current Role: ${user.role}`)

    if (user.role !== 'USER') {
      console.log(`✅ User already has role: ${user.role}`)
      console.log('No update needed.')
      return
    }

    // Update role to ADMIN
    const updated = await prisma.user.update({
      where: { email: butterPicksEmail },
      data: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, role: true }
    })

    console.log('\n✅ Successfully updated user role!')
    console.log('📋 Updated user data:')
    console.log(`   ID: ${updated.id}`)
    console.log(`   Email: ${updated.email}`)
    console.log(`   Name: ${updated.name}`)
    console.log(`   New Role: ${updated.role}`)

  } catch (error) {
    console.error('❌ Error setting admin role:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setAdminRole()
  .then(() => {
    console.log('\n✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
