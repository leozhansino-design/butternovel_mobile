import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding categories...')

  const categories = [
    { name: 'Fantasy', slug: 'fantasy', order: 1 },
    { name: 'Urban', slug: 'urban', order: 2 },
    { name: 'Romance', slug: 'romance', order: 3 },
    { name: 'Sci-Fi', slug: 'sci-fi', order: 4 },
    { name: 'Mystery', slug: 'mystery', order: 5 },
    { name: 'Historical', slug: 'historical', order: 6 },
    { name: 'Adventure', slug: 'adventure', order: 7 },
    { name: 'Horror', slug: 'horror', order: 8 },
    { name: 'Crime', slug: 'crime', order: 9 },
    { name: 'LGBTQ+', slug: 'lgbtq', order: 10 },
    { name: 'Paranormal', slug: 'paranormal', order: 11 },
    { name: 'System', slug: 'system', order: 12 },
    { name: 'Reborn', slug: 'reborn', order: 13 },
    { name: 'Revenge', slug: 'revenge', order: 14 },
    { name: 'Fanfiction', slug: 'fanfiction', order: 15 },
    { name: 'Humor', slug: 'humor', order: 16 },
    { name: 'Werewolf', slug: 'werewolf', order: 17 },
    { name: 'Vampire', slug: 'vampire', order: 18 },
  ]

  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
    console.log(`✅ ${result.name}`)
  }

  console.log('🎉 Done!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })