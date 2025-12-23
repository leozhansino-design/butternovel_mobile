// src/app/privacy/page.tsx
import Footer from '@/components/shared/Footer'

export const metadata = {
  title: 'Privacy Policy | ButterNovel',
  description: 'Learn how ButterNovel collects, uses, and protects your personal information',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg text-blue-100">
              Last updated: January 2025
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 max-w-4xl py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 space-y-8">

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Welcome to ButterNovel ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
              </p>
              <p className="text-gray-600 leading-relaxed">
                By using ButterNovel, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1 Personal Information</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                When you register for an account, we may collect:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Email address</li>
                <li>Username and password</li>
                <li>Profile information (display name, avatar, bio)</li>
                <li>Social media account information (if you sign up via social login)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                When you use our services, we automatically collect:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, reading history)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Location data (general geographic location based on IP address)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3 User-Generated Content</h3>
              <p className="text-gray-600 leading-relaxed">
                Content you create or share on ButterNovel, including novels, comments, ratings, and reviews, may be collected and displayed publicly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We use the collected information for various purposes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>To provide and maintain our services</li>
                <li>To personalize your experience and provide content recommendations</li>
                <li>To process your transactions and manage your account</li>
                <li>To communicate with you about updates, features, and support</li>
                <li>To improve our website and services</li>
                <li>To detect and prevent fraud, abuse, and security issues</li>
                <li>To comply with legal obligations</li>
                <li>To send promotional materials (with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Public Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Your profile, published novels, comments, and ratings are publicly visible to other users.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Service Providers</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may share information with third-party service providers who help us operate our platform (hosting, analytics, customer support).
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Legal Requirements</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may disclose your information if required by law or in response to valid legal requests.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.4 Business Transfers</h3>
              <p className="text-gray-600 leading-relaxed">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new owner.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies and Tracking Technologies</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze site traffic and user behavior</li>
                <li>Provide personalized content and advertisements</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct your information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Data Portability:</strong> Request your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                To exercise these rights, please contact us at <a href="mailto:privacy@butternovel.com" className="text-blue-600 hover:underline">privacy@butternovel.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                ButterNovel is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-600 leading-relaxed">
                Your information may be transferred to and maintained on servers located outside of your country of residence. By using our services, you consent to such transfers. We take appropriate measures to ensure your data is treated securely and in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Third-Party Links</h2>
              <p className="text-gray-600 leading-relaxed">
                Our website may contain links to third-party websites. We are not responsible for the privacy practices of these websites. We encourage you to read their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> <a href="mailto:privacy@butternovel.com" className="text-blue-600 hover:underline">privacy@butternovel.com</a>
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Support:</strong> <a href="/contact" className="text-blue-600 hover:underline">Contact Form</a>
                </p>
                <p className="text-gray-700">
                  <strong>Mail:</strong> ButterNovel Privacy Team
                </p>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
