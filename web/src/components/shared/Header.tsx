'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import AuthModal from '@/components/auth/AuthModal';
import UserMenu from '@/components/shared/UserMenu';
import LibraryModal from '@/components/shared/LibraryModal';
import SearchInput from '@/components/search/SearchInput';
import NotificationBell from '@/components/notification/NotificationBell';
import { CATEGORIES } from '@/lib/constants';
import { SHORT_NOVEL_GENRES } from '@/lib/short-novel';

export default function Header() {
  // ✅ Use useSession to get real-time session updates
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 防止移动端菜单打开时背景滚动
  useEffect(() => {
    if (isMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isMenuOpen]);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; tab: 'login' | 'register' }>({
    isOpen: false,
    tab: 'login',
  });
  const [libraryModal, setLibraryModal] = useState<{ isOpen: boolean; defaultView: 'profile' | 'library' }>({
    isOpen: false,
    defaultView: 'library'
  });
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: pathname });
  };

  const openAuthModal = (tab: 'login' | 'register') => {
    setAuthModal({ isOpen: true, tab });
    setIsMenuOpen(false);
  };

  const openLibraryModal = (view: 'profile' | 'library' = 'library') => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setLibraryModal({ isOpen: true, defaultView: view });
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-effect border-b border-blue-100/50">
        <div className="w-full px-4 md:px-8 lg:px-[150px]">
          <div className="flex items-center justify-between h-14">

            {/* 左侧区域: Logo + 导航 */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="ButterNovel"
                  width={56}
                  height={56}
                  className="w-14 h-14"
                  priority
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent tracking-tight">ButterNovel</span>
                  <span className="text-[10px] text-blue-600/70 font-medium tracking-wide">100% Free Forever</span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/"
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-md transition-all"
                >
                  Home
                </Link>
                <button
                  onClick={() => openLibraryModal('library')}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-md transition-all"
                >
                  Library
                </button>

                {/* Categories Dropdown */}
                <div className="relative group">
                  <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-md transition-all flex items-center gap-1">
                    Categories
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute left-0 mt-1 w-44 glass-effect-strong rounded-lg card-shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1.5">
                      {CATEGORIES.map((category) => (
                        <Link
                          key={category.slug}
                          href={`/search?genre=${category.slug}`}
                          className="block px-3 py-1.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shorts Dropdown */}
                <div className="relative group">
                  <Link
                    href="/shorts"
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-md transition-all flex items-center gap-1"
                  >
                    Shorts
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>

                  {/* Dropdown Menu */}
                  <div className="absolute left-0 mt-1 w-52 glass-effect-strong rounded-lg card-shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1.5 max-h-80 overflow-y-auto">
                      <Link
                        href="/shorts"
                        className="block px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border-b border-gray-100"
                      >
                        All Shorts
                      </Link>
                      {SHORT_NOVEL_GENRES.map((genre) => (
                        <Link
                          key={genre.id}
                          href={`/search?type=shorts&genre=${genre.slug}`}
                          className="block px-3 py-1.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          {genre.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <Link
                  href="/writer"
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-md transition-all"
                >
                  Writer
                </Link>
              </nav>
            </div>

            {/* 右侧区域: 搜索 + 用户功能 */}
            <div className="flex items-center gap-3">
              {/* Search Bar - Desktop */}
              <div className="hidden md:block w-80">
                <SearchInput placeholder="Search..." />
              </div>

              {/* User Menu - Desktop */}
              <div className="hidden md:flex items-center gap-2">
                {user ? (
                  <>
                    <NotificationBell />
                    <UserMenu user={user} onOpenLibrary={openLibraryModal} />
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="btn-ghost px-3 py-1.5 text-sm rounded-md"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => openAuthModal('register')}
                      className="btn-primary px-3 py-1.5 text-sm rounded-md"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-md transition-all"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu - 📱 优化移动端样式 */}
          {isMenuOpen && (
            <div className="md:hidden py-3 border-t border-gray-200 max-h-[calc(100vh-56px)] overflow-y-auto">
              {/* Mobile Search (with autocomplete) */}
              <div className="mb-3">
                <SearchInput placeholder="Search novels..." />
              </div>

              <nav className="space-y-0.5">
                <Link
                  href="/"
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <button
                  onClick={() => openLibraryModal('library')}
                  className="w-full text-left block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Library
                </button>

                <div className="px-3 py-2 text-gray-500 text-xs font-semibold uppercase tracking-wider mt-2">
                  Categories
                </div>
                {CATEGORIES.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/search?genre=${category.slug}`}
                    className="block px-3 py-1.5 pl-6 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}

                <div className="px-3 py-2 text-gray-500 text-xs font-semibold uppercase tracking-wider mt-2">
                  Short Novels
                </div>
                <Link
                  href="/shorts"
                  className="block px-3 py-1.5 pl-6 text-sm font-medium text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  All Shorts
                </Link>
                {SHORT_NOVEL_GENRES.slice(0, 8).map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/search?type=shorts&genre=${genre.slug}`}
                    className="block px-3 py-1.5 pl-6 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {genre.name}
                  </Link>
                ))}

                <Link
                  href="/writer"
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mt-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Writer
                </Link>

                <div className="pt-3 mt-3 border-t border-gray-200 space-y-1">
                  {user ? (
                    <>
                      <div className="px-3 py-2 flex items-center gap-2.5">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || 'User'}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 font-semibold border border-zinc-200 flex-shrink-0 text-sm">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-zinc-900 text-sm truncate">{user.name}</div>
                          <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => openLibraryModal('profile')}
                        className="w-full text-left block px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 rounded-md transition-colors"
                      >
                        Profile
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openAuthModal('login')}
                        className="btn-ghost block w-full px-3 py-2 text-center text-sm rounded-md"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => openAuthModal('register')}
                        className="btn-primary block w-full px-3 py-2 text-center text-sm rounded-md"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        defaultTab={authModal.tab}
      />

      {user && (
        <LibraryModal
          isOpen={libraryModal.isOpen}
          onClose={() => setLibraryModal({ ...libraryModal, isOpen: false })}
          user={user}
          defaultView={libraryModal.defaultView}
        />
      )}
    </>
  );
}