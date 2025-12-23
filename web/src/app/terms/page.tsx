// src/app/terms/page.tsx
import Footer from '@/components/shared/Footer'

export const metadata = {
  title: 'Terms of Service | ButterNovel',
  description: 'Terms and conditions for using ButterNovel',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg text-blue-100">
              Last updated: January 2025
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 max-w-4xl py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 space-y-8">

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Welcome to ButterNovel! By accessing or using our website and services, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our services.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. Your continued use of ButterNovel after changes are posted constitutes your acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Services</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                ButterNovel is a free online platform that provides:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Access to read millions of user-generated novels and stories</li>
                <li>Tools for writers to publish and share their creative works</li>
                <li>Community features including comments, ratings, and social interactions</li>
                <li>Personalized reading recommendations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.1 Account Creation</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Account Security</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Age Requirement</h3>
              <p className="text-gray-600 leading-relaxed">
                You must be at least 13 years old to create an account. If you are under 18, you must have parental or guardian consent to use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Content</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.1 Content Ownership</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You retain all ownership rights to content you submit, post, or display on ButterNovel ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, distribute, and display your content on our platform.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Content Responsibilities</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                You are solely responsible for your User Content. You represent and warrant that:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>You own or have the necessary rights to submit the content</li>
                <li>Your content does not infringe on any third-party rights</li>
                <li>Your content complies with these Terms and applicable laws</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.3 Prohibited Content</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                You may not submit content that:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Infringes on intellectual property rights or plagiarizes others' work</li>
                <li>Contains hate speech, harassment, or promotes violence</li>
                <li>Contains explicit sexual content involving minors</li>
                <li>Promotes illegal activities or terrorism</li>
                <li>Contains spam, malware, or phishing attempts</li>
                <li>Impersonates another person or entity</li>
                <li>Violates privacy rights of others</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.4 Content Rating</h3>
              <p className="text-gray-600 leading-relaxed">
                Writers must accurately rate their content for mature themes, violence, or explicit content. Failure to properly rate content may result in content removal or account suspension.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use Policy</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Use our services for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the services or servers</li>
                <li>Use automated systems (bots) without our permission</li>
                <li>Collect information about other users without consent</li>
                <li>Create multiple accounts to manipulate ratings or views</li>
                <li>Engage in harassment, bullying, or abusive behavior</li>
                <li>Circumvent any access restrictions or security features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property Rights</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.1 ButterNovel's Rights</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                All rights, title, and interest in ButterNovel's services, including our logo, design, text, graphics, and software, are owned by us or our licensors and are protected by copyright, trademark, and other laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Copyright Infringement</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                We respect intellectual property rights and expect our users to do the same. If you believe content on ButterNovel infringes your copyright, please contact us with:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Identification of the copyrighted work</li>
                <li>Location of the infringing material</li>
                <li>Your contact information</li>
                <li>A statement of good faith belief that the use is not authorized</li>
                <li>A statement that the information is accurate and you are authorized to act</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Send copyright notices to: <a href="mailto:copyright@butternovel.com" className="text-blue-600 hover:underline">copyright@butternovel.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Content Moderation</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We reserve the right to review, monitor, and remove any content that violates these Terms or is otherwise objectionable. However, we are not obligated to monitor all content and are not responsible for user-generated content.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Violations may result in content removal, account suspension, or permanent ban without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Your use of ButterNovel is also governed by our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>. Please review our Privacy Policy to understand our practices regarding your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.1 Service "As Is"</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                ButterNovel is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.2 User Content Disclaimer</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We do not endorse, support, represent, or guarantee the accuracy, completeness, or reliability of any user-generated content. Views expressed in user content do not represent our views.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.3 No Guarantee of Service</h3>
              <p className="text-gray-600 leading-relaxed">
                We do not guarantee that our services will be uninterrupted, secure, or error-free. We may modify, suspend, or discontinue any aspect of our services at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                To the fullest extent permitted by law, ButterNovel and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-600 leading-relaxed">
                You agree to defend, indemnify, and hold harmless ButterNovel, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including attorney's fees) arising out of or related to your use of our services, your User Content, or your violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Termination</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may terminate or suspend your account and access to our services immediately, without prior notice or liability, for any reason, including if you breach these Terms.
              </p>
              <p className="text-gray-600 leading-relaxed">
                You may terminate your account at any time by contacting us. Upon termination, your right to use the services will immediately cease, but your User Content may remain available on our platform unless you request deletion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Dispute Resolution</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">13.1 Governing Law</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">13.2 Arbitration</h3>
              <p className="text-gray-600 leading-relaxed">
                Any dispute arising out of or relating to these Terms or our services shall be resolved through binding arbitration, except that either party may seek injunctive relief in court for intellectual property infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. General Provisions</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">14.1 Entire Agreement</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                These Terms constitute the entire agreement between you and ButterNovel regarding the use of our services.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.2 Severability</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">14.3 Waiver</h3>
              <p className="text-gray-600 leading-relaxed">
                Our failure to enforce any right or provision of these Terms will not constitute a waiver of such right or provision.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> <a href="mailto:legal@butternovel.com" className="text-blue-600 hover:underline">legal@butternovel.com</a>
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Support:</strong> <a href="/contact" className="text-blue-600 hover:underline">Contact Form</a>
                </p>
                <p className="text-gray-700">
                  <strong>Help Center:</strong> <a href="/help" className="text-blue-600 hover:underline">FAQ & Support</a>
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
