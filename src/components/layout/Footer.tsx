import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1B0C3F] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-4">Mark Maeda Travel & Tour</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Your trusted partner for private tours and transfers in Japan. Licensed, insured, and dedicated to making your journey unforgettable.
            </p>
            <div className="flex items-center gap-4 text-gray-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Tokyo, Japan</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-[#E4005A]">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/tours" className="text-gray-300 hover:text-white transition-colors">
                  Tours
                </Link>
              </li>
              <li>
                <Link href="/transfers" className="text-gray-300 hover:text-white transition-colors">
                  Transfers
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-gray-300 hover:text-white transition-colors">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/booking/track" className="text-gray-300 hover:text-white transition-colors">
                  Track Booking
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4 text-[#E4005A]">Contact Us</h4>
            <div className="flex items-center gap-3 text-gray-300">
              <a
                href="mailto:contact@markmaedatravelandtour.com"
                aria-label="Email"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E4005A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B0C3F] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </a>

              <a
                href="tel:+819063756697"
                aria-label="Call"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E4005A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B0C3F] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </a>

              <a
                href="https://www.facebook.com/markmaedatour"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E4005A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B0C3F] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 12.07C22 6.49 17.52 2 12 2S2 6.49 2 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.9h2.54V9.86c0-2.52 1.49-3.92 3.78-3.92 1.1 0 2.25.2 2.25.2v2.47H15.2c-1.25 0-1.64.78-1.64 1.57v1.89h2.8l-.45 2.9h-2.35V22c4.78-.75 8.44-4.91 8.44-9.93z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Mark Maeda Travel & Tour. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
