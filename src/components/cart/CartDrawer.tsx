"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCart, removeItem, CartItem } from "@/lib/cart/store";
import { calculateItemSubtotal, VEHICLE_LABELS } from "@/types/vehicle";
import {
  fetchCartProductDataClient,
  enrichCartItems,
  EnrichedCartItem,
} from "@/lib/cart/clientProductData";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<EnrichedCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const items = getCart();
      setCartItems(items);
      
      // Fetch product data for images
      setIsLoading(true);
      fetchCartProductDataClient(items)
        .then((productMap) => {
          const enriched = enrichCartItems(items, productMap);
          setCartItems(enriched);
        })
        .catch((error) => {
          console.error("Failed to enrich cart items:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleRemove = async (type: CartItem["type"], id: string) => {
    removeItem(type, id);
    const items = getCart();
    
    // Re-fetch product data after removal
    const productMap = await fetchCartProductDataClient(items);
    const enriched = enrichCartItems(items, productMap);
    setCartItems(enriched);
  };

  const getItemSubtotal = (item: CartItem): number => {
    return calculateItemSubtotal(item.vehicleSelection, item.vehicleRates);
  };

  const getCartTotal = (): number => {
    return cartItems.reduce((sum, item) => sum + getItemSubtotal(item), 0);
  };

  const getVehicleBreakdown = (selection: any): string => {
    const parts: string[] = [];
    Object.entries(selection).forEach(([key, qty]) => {
      if (qty && typeof qty === "number" && qty > 0) {
        parts.push(`${VEHICLE_LABELS[key as keyof typeof VEHICLE_LABELS]} x${qty}`);
      }
    });
    return parts.join(", ") || "No vehicles";
  };

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Cart ({cartItems.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close cart"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-4">Start adding tours, transfers, or packages</p>
                <Link 
                  href="/tours"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#E4005A] text-white rounded-lg hover:bg-[#C4004A] transition-colors"
                >
                  Browse Tours
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const subtotal = getItemSubtotal(item);
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 relative overflow-hidden">
                          {item.productData?.imageUrl ? (
                            <Image
                              src={item.productData.imageUrl}
                              alt={item.productData.title || item.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                              {item.type === "tour" && "🗺️"}
                              {item.type === "transfer" && "🚐"}
                              {item.type === "package" && "📦"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                            {item.productData?.title || item.title}
                          </h4>
                          <p className="text-xs text-gray-600 capitalize mb-1">{item.type}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {getVehicleBreakdown(item.vehicleSelection)}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 mt-2">
                            ¥{subtotal.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemove(item.type, item.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <svg className="w-5 h-5 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer - Only show if cart has items */}
          {cartItems.length > 0 && (
            <div className="border-t p-4 bg-gray-50">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-xl font-bold text-gray-900">
                    ¥{getCartTotal().toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Taxes and fees calculated at checkout
                </p>
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 px-4 bg-[#E4005A] text-white font-semibold rounded-lg hover:bg-[#C4004A] transition-colors shadow-sm"
                >
                  Proceed to Checkout
                </button>
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="block w-full py-2 px-4 text-center text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  View Full Cart
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
