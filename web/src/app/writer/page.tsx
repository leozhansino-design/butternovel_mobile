// src/app/writer/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/shared/Footer'
import AuthModal from '@/components/auth/AuthModal'
import Link from 'next/link'

export default function WriterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; tab: 'login' | 'register' }>({
    isOpen: false,
    tab: 'login',
  })

  // If logged in, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const handleStartWriting = () => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    } else {
      setAuthModal({ isOpen: true, tab: 'login' })
    }
  }

  // Show loading while checking auth status
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-2 w-32 bg-blue-200 rounded mx-auto"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gradient-to-b from-blue-50/30 via-white to-white">
        <div className="container mx-auto px-4 max-w-4xl py-20">
          {/* Hero Section - 简约高端 */}
          <div className="text-center mb-20">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-6 tracking-tight">
              Become a Writer
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Share your stories with millions of readers worldwide. Start your writing journey today.
            </p>
          </div>

          {/* Features Grid - 简约设计，无 icon */}
          <div className="grid md:grid-cols-2 gap-6 mb-20">
            <div className="glass-effect p-8 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-all group">
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Easy to Publish
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Simple and intuitive tools to write, edit, and publish your novels. Focus on what matters - your story.
              </p>
            </div>

            <div className="glass-effect p-8 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-all group">
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Reach Global Readers
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Connect with readers from around the world. Build your fanbase and grow your audience.
              </p>
            </div>

            <div className="glass-effect p-8 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-all group">
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Monetize Your Work
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Earn from your passion. Multiple monetization options available for published authors.
              </p>
            </div>

            <div className="glass-effect p-8 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-all group">
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Track Your Success
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Detailed analytics to understand your readers. See what works and grow your craft.
              </p>
            </div>
          </div>

          {/* CTA Section - 简约高端蓝色 */}
          <div className="text-center glass-effect-blue rounded-2xl p-12 border border-blue-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Writing?
            </h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
              Join thousands of writers who are already sharing their stories on ButterNovel.
            </p>
            <button
              onClick={handleStartWriting}
              className="btn-primary px-8 py-4 text-white font-semibold rounded-lg"
            >
              Start Writing Now
            </button>
          </div>

          {/* Info Notice - 简约 */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              Sign in to access your Writer Dashboard and start publishing your novels.
            </p>
          </div>
        </div>
      </main>

      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        defaultTab={authModal.tab}
      />
    </div>
  )
}
