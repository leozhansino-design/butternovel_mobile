// src/components/seo/SiteNavigationJsonLd.tsx
// SEO: SiteNavigationElement structured data
// Helps Google understand site navigation structure

interface NavigationItem {
  name: string
  url: string
}

interface SiteNavigationJsonLdProps {
  items?: NavigationItem[]
}

const defaultNavigationItems: NavigationItem[] = [
  { name: 'Home', url: '/' },
  { name: 'Browse Novels', url: '/novels' },
  { name: 'Search', url: '/search' },
  { name: 'Fantasy', url: '/search?category=fantasy' },
  { name: 'Romance', url: '/search?category=romance' },
  { name: 'Sci-Fi', url: '/search?category=sci-fi' },
  { name: 'Mystery', url: '/search?category=mystery' },
  { name: 'Horror', url: '/search?category=horror' },
  { name: 'Adventure', url: '/search?category=adventure' },
  { name: 'Werewolf', url: '/search?category=werewolf' },
  { name: 'Vampire', url: '/search?category=vampire' },
  { name: 'Writer Program', url: '/writer' },
  { name: 'Help', url: '/help' },
  { name: 'Contact', url: '/contact' },
]

export default function SiteNavigationJsonLd({ items = defaultNavigationItems }: SiteNavigationJsonLdProps) {
  const baseUrl = 'https://butternovel.com'

  const navigationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    name: 'Main Navigation',
    hasPart: items.map((item) => ({
      '@type': 'WebPage',
      name: item.name,
      url: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationSchema) }}
    />
  )
}
