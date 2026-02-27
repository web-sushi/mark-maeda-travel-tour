"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import CustomerLogoutButton from "@/components/auth/CustomerLogoutButton";

interface MobileMenuProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export default function MobileMenu({ isLoggedIn, isAdmin }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string) =>
    `block px-4 py-3 text-base font-medium rounded-lg transition-all ${
      isActive(path)
        ? "text-[#E4005A] bg-[#FEE2E2]"
        : "text-[#111827] hover:text-[#E4005A] hover:bg-[#F8F9FC]"
    }`;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-[#111827] hover:text-[#E4005A] transition-colors"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-over Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Image
                src="/images/company-logo.jpg"
                alt="Mark Maeda Travel and Tour"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
              />
              <div>
                <h2 className="text-sm font-bold text-[#111827] leading-tight">
                  Mark Maeda
                </h2>
                <p className="text-xs text-gray-600">Travel and Tour</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-500 hover:text-[#E4005A] transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Menu Content */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              <Link href="/" className={linkClass("/")}>
                Home
              </Link>
              <Link href="/tours" className={linkClass("/tours")}>
                Tours
              </Link>
              <Link href="/transfers" className={linkClass("/transfers")}>
                Transfers
              </Link>
              <Link href="/reviews" className={linkClass("/reviews")}>
                Reviews
              </Link>

              <div className="my-4 border-t border-gray-200" />

              {/* User Section */}
              {isLoggedIn ? (
                <>
                  <Link href="/account" className={linkClass("/account")}>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>Account</span>
                    </div>
                  </Link>
                  <div className="px-4 py-3">
                    <CustomerLogoutButton variant="link" />
                  </div>
                </>
              ) : (
                <Link href="/login" className={linkClass("/login")}>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Login</span>
                  </div>
                </Link>
              )}

              {/* Admin Link */}
              {isAdmin && (
                <>
                  <div className="my-4 border-t border-gray-200" />
                  <Link
                    href="/admin"
                    className="block px-4 py-3 text-base font-medium text-[#E4005A] bg-[#FEE2E2] hover:bg-[#E4005A] hover:text-white border border-[#E4005A] rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>Admin Dashboard</span>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Menu Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              © {new Date().getFullYear()} Mark Maeda Travel and Tour
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
