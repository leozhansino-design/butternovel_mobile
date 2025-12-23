// src/components/seo/FAQJsonLd.tsx
// SEO: FAQPage structured data for FAQ sections
// Enables FAQ rich snippets in Google search results

interface FAQItem {
  question: string
  answer: string
}

interface FAQJsonLdProps {
  faqs: FAQItem[]
}

export default function FAQJsonLd({ faqs }: FAQJsonLdProps) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  )
}

// Pre-built FAQ content for the platform
export const platformFAQs: FAQItem[] = [
  {
    question: 'Is ButterNovel free to use?',
    answer: 'Yes, ButterNovel is 100% free forever. You can read millions of novels across all genres without any hidden fees, subscriptions, or in-app purchases.',
  },
  {
    question: 'How do I read novels on ButterNovel?',
    answer: 'Simply browse our collection, click on any novel that interests you, and start reading immediately. No registration required to read, though creating an account lets you save your reading progress and bookmarks.',
  },
  {
    question: 'What genres are available on ButterNovel?',
    answer: 'ButterNovel offers a wide variety of genres including Fantasy, Romance, Sci-Fi, Mystery, Horror, Adventure, Werewolf, Vampire, and many more. Use our search and filter options to find exactly what you want to read.',
  },
  {
    question: 'Can I write and publish my own novels on ButterNovel?',
    answer: 'Yes! ButterNovel welcomes writers. You can create an account and start publishing your own stories. Visit our Writer page to learn more about becoming an author on our platform.',
  },
  {
    question: 'How do I save my reading progress?',
    answer: 'Create a free account to automatically save your reading progress. Your bookmarks and reading history sync across all your devices.',
  },
  {
    question: 'Is ButterNovel available on mobile devices?',
    answer: 'Yes, ButterNovel is fully responsive and works great on mobile phones, tablets, and desktop computers. You can also add it to your home screen for an app-like experience.',
  },
  {
    question: 'How often are new novels added?',
    answer: 'New novels are added daily by our community of writers. You can find the latest releases on our homepage or use the search to filter by newest additions.',
  },
  {
    question: 'Can I download novels for offline reading?',
    answer: 'Currently, ButterNovel is an online reading platform. For the best experience, we recommend reading with an internet connection.',
  },
]

// Novel-specific FAQs
export function getNovelFAQs(novelTitle: string, authorName: string, chapterCount: number): FAQItem[] {
  return [
    {
      question: `Is "${novelTitle}" free to read?`,
      answer: `Yes, "${novelTitle}" by ${authorName} is completely free to read on ButterNovel. All ${chapterCount} chapters are available without any cost.`,
    },
    {
      question: `How many chapters does "${novelTitle}" have?`,
      answer: `"${novelTitle}" currently has ${chapterCount} chapters available on ButterNovel. New chapters may be added as the author continues the story.`,
    },
    {
      question: `Who is the author of "${novelTitle}"?`,
      answer: `"${novelTitle}" is written by ${authorName}. You can find more novels by this author on ButterNovel.`,
    },
  ]
}
