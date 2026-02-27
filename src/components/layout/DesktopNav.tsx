"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CustomerLogoutButton from "@/components/auth/CustomerLogoutButton";
import { useState, useEffect } from "react";
import { getCart } from "@/lib/cart/store";
import CartDrawer from "@/components/cart/CartDrawer";

interface DesktopNavProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export default function DesktopNav({ isLoggedIn, isAdmin }: DesktopNavProps) {
  const pathname = usePathname();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    setCartItemCount(getCart().length);

    const handleStorageChange = () => {
      setCartItemCount(getCart().length);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleStorageChange);
    };
  }, []);

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-all ${
      isActive(path)
        ? "text-[#E4005A] bg-[#FEE2E2]"
        : "text-[#111827] hover:text-[#E4005A] hover:bg-[#F8F9FC]"
    }`;

  return (
    <>
      <nav className="hidden md:flex items-center gap-1">
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

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Cart */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative px-3 py-2 text-sm font-medium text-[#111827] hover:text-[#E4005A] hover:bg-[#F8F9FC] rounded-lg transition-all flex items-center gap-1"
          aria-label={`Shopping cart with ${cartItemCount} items`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>Cart</span>
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#E4005A] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </button>

        {/* User Account/Login */}
        {isLoggedIn ? (
          <>
            <Link
              href="/account"
              className="px-3 py-2 text-sm font-medium text-[#111827] hover:text-[#E4005A] hover:bg-[#F8F9FC] rounded-lg transition-all flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Account</span>
            </Link>
            <CustomerLogoutButton variant="link" />
          </>
        ) : (
          <Link
            href="/login"
            className="px-3 py-2 text-sm font-medium text-[#111827] hover:text-[#E4005A] hover:bg-[#F8F9FC] rounded-lg transition-all flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            <span>Login</span>
          </Link>
        )}

        {/* Admin Link */}
        {isAdmin && (
          <Link
            href="/admin"
            className="px-3 py-2 text-sm font-medium text-[#E4005A] hover:text-white hover:bg-[#E4005A] border border-[#E4005A] rounded-lg transition-all"
          >
            Admin
          </Link>
        )}
      </nav>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
