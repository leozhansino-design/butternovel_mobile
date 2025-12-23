// src/app/help/page.tsx
import Link from 'next/link'
import Footer from '@/components/shared/Footer'

export const metadata = {
  title: 'Help Center | ButterNovel',
  description: 'Find answers to frequently asked questions about ButterNovel',
}

export default function HelpPage() {
  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'Is ButterNovel really free?',
          a: 'Yes! ButterNovel is 100% free forever. Read unlimited novels without any subscription fees or hidden charges.',
        },
        {
          q: 'Do I need an account to read novels?',
          a: 'You can browse and read novels without an account. However, creating a free account lets you bookmark novels, track your reading progress, and get personalized recommendations.',
        },
        {
          q: 'How do I create an account?',
          a: 'Click "Sign Up" in the top right corner. You can register with your email or use Google/Facebook login for quick access.',
        },
      ],
    },
    {
      category: 'Reading',
      questions: [
        {
          q: 'How do I add novels to my library?',
          a: 'Click the bookmark icon on any novel page to add it to your library. Access your library anytime by clicking "Library" in the header.',
        },
        {
          q: 'How do I track my reading progress?',
          a: 'Your reading progress is automatically saved as you read. You can resume from where you left off anytime.',
        },
        {
          q: 'Can I read offline?',
          a: 'Currently, ButterNovel requires an internet connection to read novels. Offline reading may be added in future updates.',
        },
      ],
    },
    {
      category: 'Writing',
      questions: [
        {
          q: 'How do I become a writer?',
          a: 'Click "Become a Writer" in the header to access the Writer Dashboard. Create an account if you haven\'t already, then you can start publishing your stories.',
        },
        {
          q: 'Can I earn money from my stories?',
          a: 'ButterNovel is a free platform for readers and writers. We may introduce monetization features in the future.',
        },
        {
          q: 'What content is allowed?',
          a: 'We welcome original stories across all genres. Content must comply with our Terms of Service and Community Guidelines. No plagiarism, hate speech, or illegal content.',
        },
      ],
    },
    {
      category: 'Account & Privacy',
      questions: [
        {
          q: 'How do I reset my password?',
          a: 'Click "Login", then "Forgot Password". Enter your email address and we\'ll send you a password reset link.',
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes. Go to your Profile Settings and scroll to "Account Management". You can request account deletion there.',
        },
        {
          q: 'How is my data protected?',
          a: 'We take privacy seriously. Read our Privacy Policy for details on how we collect, use, and protect your data.',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
            <p className="text-lg md:text-xl text-blue-100">
              Find answers to frequently asked questions
            </p>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="container mx-auto px-4 max-w-4xl py-12">
          <div className="space-y-12">
            {faqs.map((section) => (
              <div key={section.category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-500">
                  {section.category}
                </h2>
                <div className="space-y-6">
                  {section.questions.map((faq, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {faq.q}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-blue-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Still need help?
            </h2>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
