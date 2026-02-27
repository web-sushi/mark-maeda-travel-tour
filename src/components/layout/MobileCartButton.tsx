"use client";

import { useState, useEffect } from "react";
import { getCartTotalQuantity } from "@/lib/cart/store";
import CartDrawer from "@/components/cart/CartDrawer";

export default function MobileCartButton() {
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const updateCartCount = () => {
      setTotalQuantity(getCartTotalQuantity());
    };

    updateCartCount();

    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setIsCartOpen(true)}
        className="relative p-2 text-[#111827] hover:text-[#E4005A] transition-colors"
        aria-label={`Shopping cart with ${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}`}
        type="button"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {totalQuantity > 0 && (
          <span 
            className="absolute -top-0.5 -right-0.5 bg-[#E4005A] text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center"
            aria-hidden="true"
          >
            {totalQuantity > 99 ? '99+' : totalQuantity}
          </span>
        )}
      </button>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
