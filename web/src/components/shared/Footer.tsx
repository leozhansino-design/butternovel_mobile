import Link from 'next/link';
import Image from 'next/image';

// 🔧 FIX: Use static categories to avoid hydration mismatch
// Footer can be imported by client components, so we use static data
const FOOTER_CATEGORIES = [
  { slug: 'fantasy', name: 'Fantasy' },
  { slug: 'romance', name: 'Romance' },
  { slug: 'mystery', name: 'Mystery' },
  { slug: 'sci-fi', name: 'Sci-Fi' },
  { slug: 'horror', name: 'Horror' },
  { slug: 'adventure', name: 'Adventure' },
  { slug: 'werewolf', name: 'Werewolf' },
  { slug: 'vampire', name: 'Vampire' },
];

const FOOTER_SHORT_GENRES = [
  { slug: 'sweet-romance', name: 'Sweet Romance' },
  { slug: 'ceo-billionaire', name: 'CEO/Billionaire' },
  { slug: 'horror-thriller', name: 'Horror/Thriller' },
  { slug: 'comedy-humor', name: 'Comedy/Humor' },
  { slug: 'family-drama', name: 'Family Drama' },
  { slug: 'paranormal-fantasy', name: 'Paranormal' },
];

export default function Footer() {
  const categories = FOOTER_CATEGORIES;

  return (
    <footer className="bg-gradient-to-b from-white to-sky-50/30 border-t border-sky-200/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">

          {/* About */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="ButterNovel"
                width={64}
                height={64}
                className="w-16 h-16"
              />
              <span className="text-lg font-bold text-gray-900">ButterNovel</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              100% Free Forever. Read millions of free novels across all genres—no hidden fees, ever.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-600 hover:text-sky-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/novels" className="text-sm text-gray-600 hover:text-sky-600 transition-colors">
                  Browse Novels
                </Link>
              </li>
              <li>
                <Link href="/writer" className="text-sm text-gray-600 hover:text-sky-600 transition-colors">
                  Become a Writer
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.slice(0, 6).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/search?category=${category.slug}`}
                    className="text-sm text-gray-600 hover:text-sky-600 transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Short Novels */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Short Novels</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/shorts"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  All Shorts
                </Link>
              </li>
              {FOOTER_SHORT_GENRES.map((genre) => (
                <li key={genre.slug}>
                  <Link
                    href={`/search?type=shorts&genre=${genre.slug}`}
                    className="text-sm text-gray-600 hover:text-sky-600 transition-colors"
                  >
                    {genre.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-gray-600 hover:text-sky-600 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-sky-600 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-sky-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-sky-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              © 2025 ButterNovel. All rights reserved.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-sky-500 transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-sky-500 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-sky-500 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}