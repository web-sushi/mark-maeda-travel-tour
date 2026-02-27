"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import Link from "next/link";
import {
  getCart,
  removeItem,
  updateItemVehicles,
  CartItem,
} from "@/lib/cart/store";
import {
  calculateItemSubtotal,
  getTotalVehicles,
  VEHICLE_LABELS,
  VehicleSelection,
} from "@/types/vehicle";
import VehicleSelector from "@/components/checkout/VehicleSelector";
import {
  fetchCartProductDataClient,
  enrichCartItems,
  EnrichedCartItem,
} from "@/lib/cart/clientProductData";

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<EnrichedCartItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const items = getCart();
    setCartItems(items);
    
    // Fetch product data for images
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
  }, []);

  const handleRemove = async (type: CartItem["type"], id: string) => {
    removeItem(type, id);
    const items = getCart();
    
    // Re-fetch product data after removal
    const productMap = await fetchCartProductDataClient(items);
    const enriched = enrichCartItems(items, productMap);
    setCartItems(enriched);
  };

  const handleUpdateVehicles = async (
    type: CartItem["type"],
    id: string,
    vehicleSelection: VehicleSelection
  ) => {
    updateItemVehicles(type, id, vehicleSelection);
    const items = getCart();
    
    // Re-fetch product data after update
    const productMap = await fetchCartProductDataClient(items);
    const enriched = enrichCartItems(items, productMap);
    setCartItems(enriched);
    setEditingItem(null);
  };

  const getItemSubtotal = (item: CartItem): number => {
    return calculateItemSubtotal(item.vehicleSelection, item.vehicleRates);
  };

  const getCartTotal = (): number => {
    return cartItems.reduce((sum, item) => sum + getItemSubtotal(item), 0);
  };

  const getVehicleBreakdown = (selection: VehicleSelection): string => {
    const parts: string[] = [];
    Object.entries(selection).forEach(([key, qty]) => {
      if (qty > 0) {
        parts.push(`${VEHICLE_LABELS[key as keyof typeof VEHICLE_LABELS]} x${qty}`);
      }
    });
    return parts.join(", ") || "No vehicles selected";
  };

  if (cartItems.length === 0) {
    return (
      <Container className="py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-lg text-gray-600 mb-8">
            Start adding tours, transfers, or packages to your cart.
          </p>
          <Link href="/tours">
            <Button>Browse Tours</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const subtotal = getItemSubtotal(item);
            const isEditing = editingItem === `${item.type}-${item.id}`;

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="border rounded-lg p-6 bg-white"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 relative overflow-hidden">
                      {item.productData?.imageUrl ? (
                        <Image
                          src={item.productData.imageUrl}
                          alt={item.productData.title || item.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl">
                          {item.type === "tour" && "🗺️"}
                          {item.type === "transfer" && "🚐"}
                          {item.type === "package" && "📦"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.productData?.title || item.title}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">{item.type}</p>
                      {!isEditing && (
                        <p className="text-sm text-gray-600 mt-2">
                          {getVehicleBreakdown(item.vehicleSelection)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-gray-900">
                      ¥{subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4">
                    <VehicleSelector
                      vehicleRates={item.vehicleRates}
                      initialSelection={item.vehicleSelection}
                      onSelectionChange={(selection) => {
                        handleUpdateVehicles(item.type, item.id, selection);
                      }}
                      showSubtotal={false}
                    />
                    <Button
                      onClick={() => setEditingItem(null)}
                      variant="outline"
                      className="mt-4"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setEditingItem(`${item.type}-${item.id}`)}
                      variant="outline"
                      size="sm"
                    >
                      Edit Vehicles
                    </Button>
                    <Button
                      onClick={() => handleRemove(item.type, item.id)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 bg-white sticky top-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>¥{getCartTotal().toLocaleString()}</span>
              </div>
            </div>
            <Link href="/checkout" className="block">
              <Button className="w-full" size="lg">
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
