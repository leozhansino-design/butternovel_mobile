// scripts/cleanup-tags.ts
// Utility script to clean up orphaned tags and sync tag counts
// Run with: npm run tags:cleanup

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Starting tag cleanup and sync...\n')

  try {
    // 1. Get all tags with their actual novel counts
    console.log('📊 Step 1: Analyzing tags...')
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        count: true,
        _count: {
          select: {
            novels: {
              where: {
                isPublished: true,
                isBanned: false
              }
            }
          }
        }
      }
    })

    console.log(`   Found ${tags.length} tags in database\n`)

    // 2. Sync tag counts
    console.log('🔄 Step 2: Syncing tag counts...')
    let syncedCount = 0
    let orphanedCount = 0

    for (const tag of tags) {
      const actualCount = tag._count.novels
      const storedCount = tag.count

      if (actualCount !== storedCount) {
        await prisma.tag.update({
          where: { id: tag.id },
          data: { count: actualCount }
        })

        console.log(`   ✓ Updated "${tag.name}": ${storedCount} → ${actualCount}`)
        syncedCount++

        if (actualCount === 0) {
          orphanedCount++
        }
      }
    }

    console.log(`   Synced ${syncedCount} tag counts\n`)

    // 3. Clean up orphaned tags (optional - uncomment to enable)
    console.log('🗑️  Step 3: Cleaning up orphaned tags...')
    const orphanedTags = await prisma.tag.findMany({
      where: {
        count: 0
      }
    })

    if (orphanedTags.length > 0) {
      console.log(`   Found ${orphanedTags.length} orphaned tags:`)
      orphanedTags.forEach((tag: { name: string; slug: string }) => {
        console.log(`   - ${tag.name} (${tag.slug})`)
      })

      // Uncomment the following lines to actually delete orphaned tags
      // const deleted = await prisma.tag.deleteMany({
      //   where: { count: 0 }
      // })
      // console.log(`   ✓ Deleted ${deleted.count} orphaned tags\n`)

      console.log(`   ℹ️  To delete these tags, uncomment the deletion code in the script\n`)
    } else {
      console.log(`   No orphaned tags found\n`)
    }

    // 4. Summary
    console.log('📈 Summary:')
    console.log(`   - Total tags: ${tags.length}`)
    console.log(`   - Tags synced: ${syncedCount}`)
    console.log(`   - Orphaned tags: ${orphanedTags.length}`)
    console.log(`   - Active tags: ${tags.filter((t: { _count: { novels: number } }) => t._count.novels > 0).length}`)

    console.log('\n✅ Tag cleanup completed successfully!')

  } catch (error) {
    console.error('❌ Error during tag cleanup:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
