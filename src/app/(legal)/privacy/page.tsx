import Container from "@/components/layout/Container";
import { Metadata } from "next";

// PLACEHOLDER BUSINESS DETAILS - Replace with actual information before going live
const BUSINESS_NAME = "Mark Maeda Travel & Tour";
const BUSINESS_EMAIL = "contact@markmaeda.com";
const BUSINESS_PHONE = "+81 (0)XX-XXXX-XXXX";
const BUSINESS_ADDRESS = "Tokyo, Japan";
const LAST_UPDATED = "February 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | Mark Maeda Travel & Tour",
  description: "Privacy Policy for Mark Maeda Travel & Tour - Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
          {/* Header */}
          <div className="mb-8 pb-6 border-b">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: {LAST_UPDATED}</p>
          </div>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {BUSINESS_NAME} ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services for booking private tours and transfers in Japan.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using our services, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.1 Personal Information</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              We collect personal information that you voluntarily provide when booking our services:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Name and contact details (email address, phone number)</li>
              <li>Billing and payment information (processed securely via Stripe)</li>
              <li>Account credentials (if you create an account)</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Booking Information</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              To process your bookings, we collect:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Travel dates and times</li>
              <li>Pickup and drop-off locations</li>
              <li>Number of passengers and luggage details</li>
              <li>Special requests or accessibility requirements</li>
              <li>Flight information (for airport transfers)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 Technical Data</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              We automatically collect certain information when you visit our website:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>IP address and browser type</li>
              <li>Device information and operating system</li>
              <li>Pages visited and time spent on our site</li>
              <li>Referring website addresses</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Service Delivery:</strong> To process and fulfill your bookings, arrange transportation, and coordinate with drivers</li>
              <li><strong>Communication:</strong> To send booking confirmations, updates, and respond to your inquiries</li>
              <li><strong>Payment Processing:</strong> To process payments securely through our payment provider (Stripe)</li>
              <li><strong>Customer Support:</strong> To provide assistance and resolve issues</li>
              <li><strong>Service Improvement:</strong> To analyze usage patterns and improve our website and services</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
              <li><strong>Marketing:</strong> To send promotional communications (only with your consent, and you may opt out at any time)</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We work with trusted third-party service providers to deliver our services:
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.1 Payment Processing (Stripe)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              All payment transactions are processed by Stripe, a PCI-DSS compliant payment processor. We do not store your complete credit card information on our servers. Stripe's privacy policy can be found at{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                stripe.com/privacy
              </a>.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Data Hosting (Supabase)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our database and authentication services are hosted on Supabase, a secure cloud platform. Your data is stored with industry-standard encryption and security measures.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.3 Email Communications (Brevo)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use Brevo (formerly Sendinblue) for sending transactional emails such as booking confirmations and updates. Your email address is shared with Brevo solely for this purpose.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.4 Website Hosting (Vercel)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our website is hosted on Vercel's infrastructure, which provides secure and reliable hosting services.
            </p>
          </section>

          {/* Data Storage & Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Storage & Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and updates</li>
              <li>Restricted access to personal data (only authorized personnel)</li>
              <li>Regular backups to prevent data loss</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li><strong>Booking Data:</strong> Retained for at least 7 years for legal and tax compliance purposes</li>
              <li><strong>Account Data:</strong> Retained until you request account deletion</li>
              <li><strong>Marketing Data:</strong> Retained until you unsubscribe or request deletion</li>
              <li><strong>Technical Logs:</strong> Typically retained for 90 days unless required for security investigations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              After the retention period, we will securely delete or anonymize your personal information.
            </p>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Under applicable data protection laws, you have the following rights:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
              <li><strong>Data Portability:</strong> Request transfer of your data to another service provider</li>
              <li><strong>Objection:</strong> Object to processing of your personal information for marketing purposes</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw consent at any time (without affecting prior processing)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To exercise any of these rights, please contact us using the information provided in Section 9.
            </p>
          </section>

          {/* Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to enhance your experience on our website:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li><strong>Essential Cookies:</strong> Required for website functionality and security (e.g., authentication, session management)</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website to improve user experience</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You can control cookies through your browser settings. However, disabling certain cookies may affect website functionality.
            </p>
          </section>

          {/* International Data Transfers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              As our third-party service providers (Stripe, Supabase, Brevo, Vercel) may be located outside of Japan, your personal information may be transferred to and processed in other countries. We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable data protection laws.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will delete such information.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. The "Last Updated" date at the top of this page indicates when it was last revised. We encourage you to review this Privacy Policy periodically. Your continued use of our services after changes are posted constitutes your acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <p className="text-gray-900 font-semibold mb-2">{BUSINESS_NAME}</p>
              <p className="text-gray-700 mb-1">
                <strong>Email:</strong> {BUSINESS_EMAIL}
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Phone:</strong> {BUSINESS_PHONE}
              </p>
              <p className="text-gray-700">
                <strong>Address:</strong> {BUSINESS_ADDRESS}
              </p>
            </div>
          </section>

          {/* Compliance Notice */}
          <section className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-600 italic">
              This Privacy Policy is designed to comply with the Act on the Protection of Personal Information (APPI) in Japan and incorporates principles from international data protection regulations including GDPR.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
