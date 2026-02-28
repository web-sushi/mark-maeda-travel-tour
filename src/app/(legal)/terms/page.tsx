import Container from "@/components/layout/Container";
import { Metadata } from "next";

// PLACEHOLDER BUSINESS DETAILS - Replace with actual information before going live
const BUSINESS_NAME = "Mark Maeda Travel & Tour";
const BUSINESS_EMAIL = "contact@markmaedatravelandtour.com";
const BUSINESS_PHONE = "+81 90-6375-6697";
const BUSINESS_ADDRESS = "Kanagawa, Yokohama, Aobaku Utsukushigaoka 2-7-9 2F";
const LAST_UPDATED = "February 2026";

// PLACEHOLDER CANCELLATION POLICY - Adjust percentages and timeframes as needed
const CANCELLATION_POLICY = {
  FULL_REFUND_DAYS: 14, // Days before travel date for full refund
  PARTIAL_REFUND_DAYS: 7, // Days before travel date for partial refund
  PARTIAL_REFUND_PERCENT: 50, // Percentage refunded for partial refund
  NO_REFUND_DAYS: 3, // Days before travel date for no refund
};

export const metadata: Metadata = {
  title: "Terms & Conditions | Mark Maeda Travel & Tour",
  description: "Terms & Conditions for Mark Maeda Travel & Tour - Read our booking terms, cancellation policy, and service guidelines.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
          {/* Header */}
          <div className="mb-8 pb-6 border-b">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
            <p className="text-gray-600">Last updated: {LAST_UPDATED}</p>
          </div>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to {BUSINESS_NAME}. By accessing our website, making a booking, or using our services, you agree to be bound by these Terms and Conditions ("Terms"). Please read them carefully before proceeding with any booking.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms constitute a legally binding agreement between you (the "Customer" or "you") and {BUSINESS_NAME} ("we," "us," or "our"). If you do not agree with these Terms, you must not use our services.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to our website. Your continued use of our services after changes are posted constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Services Overview */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Services Overview</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {BUSINESS_NAME} provides private tour and transportation services in Japan, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Private guided tours to various destinations in Japan</li>
              <li>Airport transfers (to and from airports)</li>
              <li>City-to-city transfers</li>
              <li>Theme park and attraction transfers</li>
              <li>Custom itinerary planning and transportation</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              All services are subject to availability and confirmation. We reserve the right to decline any booking request at our discretion.
            </p>
          </section>

          {/* Booking & Payment */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Booking & Payment</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.1 Booking Process</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To make a booking, you must provide accurate and complete information, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Full name and contact details</li>
              <li>Travel dates, times, and locations</li>
              <li>Number of passengers and luggage</li>
              <li>Any special requirements or requests</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Once you submit a booking, you will receive a confirmation email with your booking reference code. This confirmation does not guarantee service completion until full payment is received.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 Pricing</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              All prices are quoted in Japanese Yen (JPY) and are inclusive of:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Vehicle rental and fuel</li>
              <li>Professional driver/guide services</li>
              <li>Standard highway tolls (unless otherwise specified)</li>
              <li>Vehicle insurance coverage</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Prices do NOT include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Admission fees to attractions or theme parks</li>
              <li>Meals and refreshments</li>
              <li>Parking fees at certain locations (if applicable)</li>
              <li>Additional stops or route changes not included in the original itinerary</li>
              <li>Gratuities (optional but appreciated)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.3 Deposit Payment</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              At the time of booking, you may choose to pay a deposit of 25%, 50%, or 100% of the total booking amount. The deposit secures your reservation and confirms your commitment to the booking.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              All deposit payments are processed securely through Stripe, our payment processor. We accept major credit and debit cards.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.4 Remaining Balance</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you choose to pay a partial deposit, the remaining balance must be paid no later than 7 days before your scheduled service date. We will send you a payment reminder via email with a secure payment link.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Failure to pay the remaining balance by the due date may result in automatic cancellation of your booking, and deposit refund will be subject to our cancellation policy.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.5 Payment Security</h3>
            <p className="text-gray-700 leading-relaxed">
              We do not store your complete credit card information. All payment transactions are processed securely by Stripe in compliance with PCI-DSS standards. Your payment information is encrypted and transmitted securely.
            </p>
          </section>

          {/* Cancellation Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cancellation Policy</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.1 Customer Cancellations</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you need to cancel your booking, please notify us as soon as possible via email at {BUSINESS_EMAIL}. The following cancellation fees apply based on the notice period:
            </p>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-4">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>{CANCELLATION_POLICY.FULL_REFUND_DAYS}+ days before travel date:</strong> Full refund of all payments made
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>{CANCELLATION_POLICY.PARTIAL_REFUND_DAYS}-{CANCELLATION_POLICY.FULL_REFUND_DAYS - 1} days before travel date:</strong> {CANCELLATION_POLICY.PARTIAL_REFUND_PERCENT}% refund of total amount
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>Less than {CANCELLATION_POLICY.NO_REFUND_DAYS} days before travel date:</strong> No refund
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>No-show or same-day cancellation:</strong> No refund
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              Refunds will be processed to the original payment method within 7-10 business days after cancellation is confirmed.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Company Cancellations</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We reserve the right to cancel a booking due to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Vehicle breakdown or mechanical failure</li>
              <li>Driver illness or unavailability</li>
              <li>Severe weather conditions or natural disasters</li>
              <li>Government restrictions or unforeseen circumstances</li>
              <li>Non-payment of remaining balance by the due date</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              In the event we cancel your booking, you will receive a full refund of all payments made, or we will offer to reschedule your service at no additional cost. We are not liable for any indirect costs or expenses incurred as a result of cancellation.
            </p>
          </section>

          {/* Changes & Modifications */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Changes & Modifications</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.1 Customer-Initiated Changes</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you wish to modify your booking (change dates, times, locations, or number of passengers), please contact us at least 48 hours before your scheduled service. We will do our best to accommodate your request, subject to availability.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Changes that result in additional costs (e.g., longer routes, extra stops, increased vehicle capacity) will require payment of the difference before the service date.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.2 Same-Day Changes</h3>
            <p className="text-gray-700 leading-relaxed">
              Changes requested on the day of service are subject to availability and may incur additional fees. We cannot guarantee that last-minute changes can be accommodated.
            </p>
          </section>

          {/* Customer Responsibilities */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Customer Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              As a customer, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li><strong>Punctuality:</strong> Be ready at the designated pickup location at the scheduled time. Late arrivals may result in reduced service time or cancellation without refund.</li>
              <li><strong>Accurate Information:</strong> Provide correct details for all booking information, including flight numbers, pickup locations, and contact details.</li>
              <li><strong>Passenger Limits:</strong> Not exceed the maximum passenger or luggage capacity of the selected vehicle.</li>
              <li><strong>Conduct:</strong> Behave respectfully toward drivers, guides, and other passengers. We reserve the right to terminate service immediately for abusive or disruptive behavior without refund.</li>
              <li><strong>Safety:</strong> Follow all safety instructions, including seatbelt usage and child seat requirements as per Japanese law.</li>
              <li><strong>Prohibited Items:</strong> Not transport illegal substances, hazardous materials, or prohibited items.</li>
              <li><strong>Damages:</strong> Be responsible for any damages caused to the vehicle or equipment during the service period.</li>
            </ul>
          </section>

          {/* Liability Limitations */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Liability Limitations</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.1 Insurance Coverage</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              All our vehicles are fully insured for passenger liability and third-party damage in accordance with Japanese law. Our insurance covers:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Personal injury during transportation</li>
              <li>Vehicle collision or damage</li>
              <li>Third-party liability claims</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.2 Limitation of Liability</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To the maximum extent permitted by law, {BUSINESS_NAME} shall not be liable for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Indirect, incidental, or consequential damages</li>
              <li>Lost profits, business interruption, or data loss</li>
              <li>Delays caused by traffic, weather, or circumstances beyond our control</li>
              <li>Personal property loss or damage (customers are responsible for their belongings)</li>
              <li>Missed flights, connections, or events due to traffic or unforeseen delays</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our total liability for any claim arising from or related to our services shall not exceed the amount paid for the specific booking in question.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.3 Personal Belongings</h3>
            <p className="text-gray-700 leading-relaxed">
              While we take care to ensure passenger safety and comfort, we are not responsible for personal belongings left in vehicles. We recommend keeping valuables with you at all times.
            </p>
          </section>

          {/* Force Majeure */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Force Majeure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We shall not be held liable for failure to perform our obligations due to circumstances beyond our reasonable control, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Natural disasters (earthquakes, typhoons, floods, etc.)</li>
              <li>Acts of war, terrorism, or civil unrest</li>
              <li>Government orders or restrictions</li>
              <li>Strikes or labor disputes</li>
              <li>Pandemics or public health emergencies</li>
              <li>Severe weather conditions that make travel unsafe</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              In such cases, we will work with you to reschedule your service or provide a full refund.
            </p>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All content on our website, including text, graphics, logos, images, and software, is the property of {BUSINESS_NAME} or its licensors and is protected by Japanese and international copyright laws.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You may not reproduce, distribute, modify, or create derivative works from any content on our website without our express written permission.
            </p>
          </section>

          {/* Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Your use of our services is also governed by our Privacy Policy. Please review our{" "}
              <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</a> to understand how we collect, use, and protect your personal information.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Governing Law & Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms and any disputes arising from or related to our services shall be governed by and construed in accordance with the laws of Japan.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Any disputes shall be resolved through good-faith negotiation. If negotiation fails, the dispute shall be subject to the exclusive jurisdiction of the courts of Tokyo, Japan.
            </p>
          </section>

          {/* Severability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Severability</h2>
            <p className="text-gray-700 leading-relaxed">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          {/* Entire Agreement */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Entire Agreement</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and {BUSINESS_NAME} regarding the use of our services and supersede all prior agreements and understandings.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions or concerns about these Terms & Conditions, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <p className="text-gray-900 font-semibold mb-2">{BUSINESS_NAME}</p>
              <p className="text-gray-700 mb-1">
                <strong>Email:</strong>{" "}
                <a href="mailto:contact@markmaedatravelandtour.com" className="text-blue-600 hover:text-blue-800 underline">
                  {BUSINESS_EMAIL}
                </a>
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Phone:</strong>{" "}
                <a href="tel:+819063756697" className="text-blue-600 hover:text-blue-800 underline">
                  {BUSINESS_PHONE}
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Address:</strong> {BUSINESS_ADDRESS}
              </p>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="mt-8 pt-6 border-t">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                By making a booking with {BUSINESS_NAME}, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
              </p>
              <p className="text-sm text-blue-800">
                Please review these Terms carefully before completing your booking. If you have any questions, please contact us before proceeding.
              </p>
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
}
