// src/components/seo/HomePageJsonLd.tsx
// Structured data for homepage - helps Google understand the site better
// Includes: Organization, WebSite, WebPage, CollectionPage, SiteNavigation, FAQ

export default function HomePageJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

  // Organization schema - tells Google about ButterNovel as a brand
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'ButterNovel',
    alternateName: ['Butter Novel', 'Butter-Novel', 'butternovel.com'],
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/icon-512.png`,
      width: 512,
      height: 512,
    },
    sameAs: [
      'https://twitter.com/butternovel',
      // Add other social media profiles here
    ],
    description: 'ButterNovel is a free online novel reading platform offering thousands of web novels in fantasy, romance, sci-fi, and more genres.',
  }

  // WebSite schema - enables sitelinks search box in Google
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'ButterNovel',
    alternateName: ['Butter Novel', 'ButterNovel.com'],
    url: baseUrl,
    description: 'Free online novel reading platform',
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-US',
  }

  // WebPage schema for homepage
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${baseUrl}/#webpage`,
    url: baseUrl,
    name: 'ButterNovel - Free Novels Online | Read Web Novels Free',
    description: 'ButterNovel (Butter Novel) - Read millions of free novels online. Fantasy, romance, sci-fi, adventure and more.',
    isPartOf: {
      '@id': `${baseUrl}/#website`,
    },
    about: {
      '@id': `${baseUrl}/#organization`,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${baseUrl}/og-image.png`,
    },
    inLanguage: 'en-US',
  }

  // CollectionPage schema - tells Google this is a collection of novels
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Free Novels Collection',
    description: 'Browse our collection of free online novels including fantasy, romance, sci-fi, and more.',
    url: baseUrl,
    isPartOf: {
      '@id': `${baseUrl}/#website`,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Fantasy Novels',
          url: `${baseUrl}/search?category=fantasy`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Romance Novels',
          url: `${baseUrl}/search?category=romance`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Sci-Fi Novels',
          url: `${baseUrl}/search?category=sci-fi`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'Adventure Novels',
          url: `${baseUrl}/search?category=adventure`,
        },
        {
          '@type': 'ListItem',
          position: 5,
          name: 'Mystery Novels',
          url: `${baseUrl}/search?category=mystery`,
        },
        {
          '@type': 'ListItem',
          position: 6,
          name: 'Horror Novels',
          url: `${baseUrl}/search?category=horror`,
        },
        {
          '@type': 'ListItem',
          position: 7,
          name: 'Werewolf Novels',
          url: `${baseUrl}/search?category=werewolf`,
        },
        {
          '@type': 'ListItem',
          position: 8,
          name: 'Vampire Novels',
          url: `${baseUrl}/search?category=vampire`,
        },
      ],
    },
  }

  // SiteNavigationElement schema - helps Google understand navigation
  const navigationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    name: 'Main Navigation',
    hasPart: [
      { '@type': 'WebPage', name: 'Home', url: baseUrl },
      { '@type': 'WebPage', name: 'Browse Novels', url: `${baseUrl}/novels` },
      { '@type': 'WebPage', name: 'Search', url: `${baseUrl}/search` },
      { '@type': 'WebPage', name: 'Fantasy', url: `${baseUrl}/search?category=fantasy` },
      { '@type': 'WebPage', name: 'Romance', url: `${baseUrl}/search?category=romance` },
      { '@type': 'WebPage', name: 'Sci-Fi', url: `${baseUrl}/search?category=sci-fi` },
      { '@type': 'WebPage', name: 'Mystery', url: `${baseUrl}/search?category=mystery` },
      { '@type': 'WebPage', name: 'Horror', url: `${baseUrl}/search?category=horror` },
      { '@type': 'WebPage', name: 'Werewolf', url: `${baseUrl}/search?category=werewolf` },
      { '@type': 'WebPage', name: 'Vampire', url: `${baseUrl}/search?category=vampire` },
      { '@type': 'WebPage', name: 'Writer Program', url: `${baseUrl}/writer` },
      { '@type': 'WebPage', name: 'Help', url: `${baseUrl}/help` },
    ],
  }

  // FAQPage schema for homepage - enables FAQ rich snippets
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is ButterNovel free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, ButterNovel (Butter Novel) is 100% free forever. You can read millions of novels across all genres without any hidden fees, subscriptions, or in-app purchases.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is Butter Novel?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Butter Novel (ButterNovel) is a free online novel reading platform where you can discover and read millions of web novels across genres like fantasy, romance, sci-fi, mystery, horror, werewolf, and vampire stories.',
        },
      },
      {
        '@type': 'Question',
        name: 'What genres are available on ButterNovel?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ButterNovel offers a wide variety of genres including Fantasy, Romance, Sci-Fi, Mystery, Horror, Adventure, Werewolf, Vampire, and many more. Use our search and filter options to find exactly what you want to read.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I write and publish my own novels on ButterNovel?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! ButterNovel welcomes writers. You can create a free account and start publishing your own stories on our platform.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I search for novels on Butter Novel?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can search for novels by title, author, genre, or tags using the search bar at the top of the page. You can also browse by category or use filters to find specific types of stories.',
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}
