import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Short novel genres
const SHORT_NOVEL_GENRES = [
  'sweet-romance',
  'billionaire-romance',
  'face-slapping',
  'rebirth',
  'revenge',
  'regret',
  'substitute',
  'true-fake-identity',
  'age-gap',
  'entertainment-circle',
  'group-pet',
  'healing-redemption',
  'lgbtq',
  'quick-transmigration',
  'survival-apocalypse',
  'system',
]

// Sample short novel content (placeholder - each should be 15000-50000 chars)
function generateSampleContent(title: string, genre: string): string {
  const baseContent = `
Chapter 1

${title}

The morning sun cast golden rays through the window as our story begins. This is a tale of ${genre.replace(/-/g, ' ')}, where love, fate, and destiny intertwine in unexpected ways.

[This is sample content for the short novel. In production, this would contain the full story of 15,000-50,000 characters. The story would unfold across multiple scenes, with rich character development, emotional moments, and a satisfying conclusion.]

The protagonist's journey begins here, with challenges to overcome and relationships to build. Each moment brings new revelations, new connections, and new understanding of what truly matters in life.

As the sun sets on this first day of our story, the seeds of change have been planted. What grows from them will surprise everyone involved.

To be continued in the following chapters...
`
  // Repeat content to reach minimum length (for demo purposes)
  let content = baseContent
  while (content.length < 16000) {
    content += `\n\n${baseContent}`
  }
  return content.substring(0, 20000) // Trim to reasonable size
}

// Sample short novels data
const shortNovels = [
  {
    title: 'CEO\'s Secret Wife: Falling For You Again',
    genre: 'billionaire-romance',
    blurb: 'After losing her memory, she wakes up as the secret wife of the city\'s most powerful CEO. But why does he look at her with such pain in his eyes?',
  },
  {
    title: 'Reborn: The Villainess Fights Back',
    genre: 'rebirth',
    blurb: 'She died betrayed by everyone she loved. Reborn ten years in the past, she\'s determined to change her fate and make her enemies pay.',
  },
  {
    title: 'Sweet Love: My Cold Husband Melts For Me',
    genre: 'sweet-romance',
    blurb: 'Everyone says the young master of the Gu family is cold and heartless. So why does he only show his gentle side to her?',
  },
  {
    title: 'Face-Slapping the White Lotus Sister',
    genre: 'face-slapping',
    blurb: 'Her adopted sister stole everything from her - her fiance, her career, her family\'s love. Now she\'s back to reclaim what\'s hers and expose the truth.',
  },
  {
    title: 'Revenge of the Abandoned Heiress',
    genre: 'revenge',
    blurb: 'Cast out by her family for a crime she didn\'t commit, she returns five years later as a successful businesswoman ready to destroy those who wronged her.',
  },
  {
    title: 'The Real Daughter Returns',
    genre: 'true-fake-identity',
    blurb: 'Swapped at birth, she grew up in poverty while a fake enjoyed her family\'s wealth. Now the truth is out, and she\'s ready to take back her rightful place.',
  },
  {
    title: 'Substitute Bride: Loved By The Cold King',
    genre: 'substitute',
    blurb: 'Married to the king in her sister\'s place, she expected to be ignored. Instead, the cold-hearted monarch can\'t seem to stay away from her.',
  },
  {
    title: 'Regret: CEO Ex-Husband Wants Me Back',
    genre: 'regret',
    blurb: 'He divorced her for another woman. Now that she\'s moved on and found success, why is he desperately trying to win her back?',
  },
  {
    title: 'Entertainment Circle: Rising Star\'s Revenge',
    genre: 'entertainment-circle',
    blurb: 'Blacklisted from the industry by her scheming rival, she makes a stunning comeback with a new identity and undeniable talent.',
  },
  {
    title: 'Apocalypse Survival: My System Helps Me Thrive',
    genre: 'survival-apocalypse',
    blurb: 'When zombies take over the world, she awakens a survival system that gives her a fighting chance. But can she protect those she loves?',
  },
  {
    title: 'Pampered by Five Older Brothers',
    genre: 'group-pet',
    blurb: 'Reunited with her wealthy family after years apart, she discovers she has five overprotective brothers who spoil her rotten.',
  },
  {
    title: 'Healing Hearts: The Doctor and The CEO',
    genre: 'healing-redemption',
    blurb: 'A wounded CEO and a compassionate doctor find healing in each other, learning that love can mend even the deepest scars.',
  },
  {
    title: 'Age Gap Romance: Professor\'s Secret',
    genre: 'age-gap',
    blurb: 'She never expected to fall for her much older professor. He never expected to find his soulmate in his brightest student.',
  },
  {
    title: 'Quick Transmigration: Saving the Villains',
    genre: 'quick-transmigration',
    blurb: 'Bound to a system, she must travel through different worlds saving tragic villains. But why do they all seem to fall for her?',
  },
  {
    title: 'Her Pride: A Sapphic Love Story',
    genre: 'lgbtq',
    blurb: 'Two women from different worlds meet by chance and discover a love that defies all expectations.',
  },
  {
    title: 'System Activated: Becoming the Top Actress',
    genre: 'system',
    blurb: 'With a mysterious entertainment system, she transforms from a nobody into the nation\'s sweetheart. But fame comes at a price.',
  },
]

async function main() {
  console.log('Starting to seed short novels...')

  // Find or create a default author
  let author = await prisma.user.findFirst({
    where: { isWriter: true },
  })

  if (!author) {
    author = await prisma.user.create({
      data: {
        email: 'shortnovel-author@butternovel.com',
        name: 'Short Novel Author',
        isWriter: true,
        writerName: 'ButterNovel Official',
        isVerified: true,
        isOfficial: true,
      },
    })
    console.log('Created default author:', author.email)
  }

  // Find default category
  let category = await prisma.category.findFirst({
    where: { slug: 'romance' },
  })

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Romance',
        slug: 'romance',
        order: 1,
      },
    })
    console.log('Created default category:', category.name)
  }

  // Create short novels
  for (const novelData of shortNovels) {
    const slug = novelData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check if already exists
    const existing = await prisma.novel.findUnique({
      where: { slug },
    })

    if (existing) {
      console.log(`Skipping existing: ${novelData.title}`)
      continue
    }

    const content = generateSampleContent(novelData.title, novelData.genre)
    const wordCount = content.length

    const novel = await prisma.novel.create({
      data: {
        title: novelData.title,
        slug,
        blurb: novelData.blurb,
        authorName: author.writerName || author.name || 'Anonymous',
        authorId: author.id,
        categoryId: category.id,
        isShortNovel: true,
        shortNovelGenre: novelData.genre,
        readingPreview: novelData.blurb.substring(0, 300),
        wordCount,
        isPublished: true,
        publishedAt: new Date(),
        status: 'COMPLETED',
        chapters: {
          create: {
            title: novelData.title,
            content,
            order: 1,
            wordCount,
            isPublished: true,
            publishedAt: new Date(),
          },
        },
      },
    })

    console.log(`Created: ${novel.title} (${novelData.genre})`)
  }

  console.log('Short novels seeding complete!')
}

main()
  .catch((e) => {
    console.error('Error seeding short novels:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
