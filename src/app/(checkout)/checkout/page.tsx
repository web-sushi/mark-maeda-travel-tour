"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TripDetailsCard from "@/components/checkout/TripDetailsCard";
import {
  getCart,
  clearCart,
  CartItem,
  TripDetails,
  updateItemTripDetails,
} from "@/lib/cart/store";
import {
  calculateItemSubtotal,
  getTotalVehicles,
  VEHICLE_LABELS,
} from "@/types/vehicle";
import {
  fetchCartProductDataClient,
  enrichCartItems,
  EnrichedCartItem,
} from "@/lib/cart/clientProductData";

function generateReferenceCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface ItemErrors {
  passengersCount?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  travelDate?: string;
  startDate?: string;
  endDate?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<EnrichedCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<Record<string, ItemErrors>>({});
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    deposit_choice: 100,
  });

  useEffect(() => {
    const items = getCart();
    if (items.length === 0) {
      router.push("/cart");
      return;
    }
    setCartItems(items);
    
    // Fetch product data for images
    fetchCartProductDataClient(items)
      .then((productMap) => {
        const enriched = enrichCartItems(items, productMap);
        setCartItems(enriched);
      })
      .catch((error) => {
        console.error("Failed to enrich cart items:", error);
      });
  }, [router]);

  const getItemSubtotal = (item: CartItem): number => {
    return calculateItemSubtotal(item.vehicleSelection, item.vehicleRates);
  };

  const getCartTotal = (): number => {
    return cartItems.reduce((sum, item) => sum + getItemSubtotal(item), 0);
  };

  const getTotalVehiclesCount = (): number => {
    return cartItems.reduce(
      (sum, item) => sum + getTotalVehicles(item.vehicleSelection),
      0
    );
  };

  const handleTripDetailsUpdate = (item: CartItem, tripDetails: TripDetails) => {
    // Update in localStorage
    updateItemTripDetails(item.type, item.id, tripDetails);
    
    // Update local state
    setCartItems((prev) =>
      prev.map((i) =>
        i.type === item.type && i.id === item.id
          ? { ...i, tripDetails: { ...i.tripDetails, ...tripDetails } }
          : i
      )
    );

    // Clear errors for this item
    setItemErrors((prev) => {
      const { [`${item.type}-${item.id}`]: _, ...rest } = prev;
      return rest;
    });
  };

  const validateTripDetails = (): boolean => {
    const errors: Record<string, ItemErrors> = {};
    let hasErrors = false;

    cartItems.forEach((item) => {
      const itemKey = `${item.type}-${item.id}`;
      const itemError: ItemErrors = {};

      // Required passengers count for all items
      const passengersCount = Number(item.tripDetails?.passengersCount);
      if (!item.tripDetails?.passengersCount || passengersCount < 1) {
        itemError.passengersCount = "At least 1 passenger is required";
        hasErrors = true;
      }

      // Required fields for all items
      if (!item.tripDetails?.pickupLocation?.trim()) {
        itemError.pickupLocation = "Pickup location is required";
        hasErrors = true;
      }
      if (!item.tripDetails?.dropoffLocation?.trim()) {
        itemError.dropoffLocation = "Drop-off location is required";
        hasErrors = true;
      }

      // Required dates based on type
      if (item.type === "tour" || item.type === "transfer") {
        if (!item.tripDetails?.travelDate) {
          itemError.travelDate = "Travel date is required";
          hasErrors = true;
        }
      }

      if (item.type === "package") {
        if (!item.tripDetails?.startDate) {
          itemError.startDate = "Start date is required";
          hasErrors = true;
        }
        if (!item.tripDetails?.endDate) {
          itemError.endDate = "End date is required";
          hasErrors = true;
        }
      }

      if (Object.keys(itemError).length > 0) {
        errors[itemKey] = itemError;
      }
    });

    setItemErrors(errors);
    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate customer info
    if (!formData.customer_name.trim()) {
      setError("Customer name is required");
      setLoading(false);
      return;
    }

    if (!formData.customer_email.trim()) {
      setError("Customer email is required");
      setLoading(false);
      return;
    }

    // Validate trip details for all items
    if (!validateTripDetails()) {
      setError("Please fill in all required trip details for each item");
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const totalVehicles = getTotalVehiclesCount();
    if (totalVehicles === 0) {
      setError("At least one vehicle must be selected");
      setLoading(false);
      return;
    }

    try {
      const totalAmount = getCartTotal();
      
      // Prepare booking data
      const bookingData = {
        reference_code: generateReferenceCode(),
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim(),
        customer_phone: formData.customer_phone.trim() || null,
        vehicles_count: totalVehicles,
        items: cartItems.map((item) => ({
          type: item.type,
          id: item.id,
          slug: item.slug,
          title: item.title,
          vehicleSelection: item.vehicleSelection,
          vehicleRates: item.vehicleRates,
          tripDetails: item.tripDetails,
        })),
        total_amount: totalAmount,
        deposit_choice: formData.deposit_choice,
        amount_paid: 0,
        remaining_amount: totalAmount,
        booking_status: "pending",
        payment_status: "unpaid",
      };

      // Prepare cart items with trip details for booking_items table
      const cartItemsWithDetails = cartItems.map((item) => ({
        type: item.type,
        id: item.id,
        title: item.title,
        slug: item.slug,
        vehicleSelection: item.vehicleSelection,
        vehicleRates: item.vehicleRates,
        subtotal: getItemSubtotal(item),
        tripDetails: item.tripDetails || {},
      }));

      // Create booking via API
      const bookingResponse = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingData,
          cartItems: cartItemsWithDetails,
        }),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || "Failed to create booking");
      }

      const { bookingId, publicViewToken } = await bookingResponse.json();

      if (!bookingId || !publicViewToken) {
        throw new Error("No booking ID or token received");
      }

      // Trigger booking notification
      fetch("/api/notify/booking-created", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingId }),
      }).catch((err) => {
        console.error("[checkout] notify booking-created failed:", err);
      });

      // Create Stripe Checkout Session
      const stripeResponse = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          publicViewToken,
          depositChoice: formData.deposit_choice,
        }),
      });

      const stripeData = await stripeResponse.json();

      if (!stripeResponse.ok || !stripeData.ok) {
        throw new Error(stripeData.error || "Failed to create payment session");
      }

      if (!stripeData.url) {
        throw new Error("No checkout URL received from Stripe");
      }

      // Clear cart before redirect
      clearCart();

      // Redirect to Stripe Checkout
      window.location.href = stripeData.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  const hasTripDetailErrors = Object.keys(itemErrors).length > 0;

  return (
    <Container className="py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {hasTripDetailErrors && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p className="font-semibold">Missing trip details</p>
          <p className="text-sm mt-1">
            Please fill in all required fields for each item below.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Customer Info + Trip Details */}
          <div className="lg:col-span-2">
            {/* Customer Information - MOVED TO TOP */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Customer Information
              </h2>
              <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-6">
                <Input
                  label="Customer Name *"
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                />
                <Input
                  label="Customer Email *"
                  type="email"
                  required
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_email: e.target.value })
                  }
                />
                <Input
                  label="Customer Phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_phone: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Trip Details Section - MOVED BELOW CUSTOMER INFO */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Trip Details
              </h2>
              <p className="text-gray-600 mb-6">
                Please provide details for each item in your cart.
              </p>
              <div className="space-y-6">
                {cartItems.map((item) => {
                  const itemKey = `${item.type}-${item.id}`;
                  return (
                    <TripDetailsCard
                      key={itemKey}
                      item={item}
                      onUpdate={(tripDetails) => handleTripDetailsUpdate(item, tripDetails)}
                      errors={itemErrors[itemKey]}
                    />
                  );
                })}
              </div>
            </div>

            {/* Submit Button - AT BOTTOM */}
            <div className="mt-8">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Processing..." : "Continue to Payment"}
              </Button>
            </div>
          </div>

          {/* Right Column - Cart Summary */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cart Summary</h2>
            <div className="border rounded-lg p-6 bg-white sticky top-20">
              <div className="space-y-4 mb-4">
                {cartItems.map((item) => {
                  const subtotal = getItemSubtotal(item);
                  return (
                    <div key={`${item.type}-${item.id}`} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start gap-3 mb-2">
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
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">
                              {item.type === "tour" && "🗺️"}
                              {item.type === "transfer" && "🚐"}
                              {item.type === "package" && "📦"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {item.productData?.title || item.title}
                          </h3>
                          <p className="text-sm text-gray-600 capitalize">{item.type}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {Object.entries(item.vehicleSelection)
                          .filter(([_, qty]) => qty > 0)
                          .map(
                            ([key, qty]) =>
                              `${VEHICLE_LABELS[key as keyof typeof VEHICLE_LABELS]} x${qty}`
                          )
                          .join(", ")}
                      </p>
                      <p className="text-right font-semibold text-gray-900 mt-2">
                        ¥{subtotal.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-lg font-bold text-gray-900 mb-4">
                  <span>Total</span>
                  <span>¥{getCartTotal().toLocaleString()}</span>
                </div>

                {/* Payment Option Selector */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Payment Option
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-white">
                      <input
                        type="radio"
                        name="deposit_choice"
                        value="25"
                        checked={formData.deposit_choice === 25}
                        onChange={() =>
                          setFormData({ ...formData, deposit_choice: 25 })
                        }
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">25% Deposit</span>
                        <span className="block text-sm text-gray-600">
                          Pay ¥{Math.round((getCartTotal() * 25) / 100).toLocaleString()} now
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-white">
                      <input
                        type="radio"
                        name="deposit_choice"
                        value="50"
                        checked={formData.deposit_choice === 50}
                        onChange={() =>
                          setFormData({ ...formData, deposit_choice: 50 })
                        }
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">50% Deposit</span>
                        <span className="block text-sm text-gray-600">
                          Pay ¥{Math.round((getCartTotal() * 50) / 100).toLocaleString()} now
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-white">
                      <input
                        type="radio"
                        name="deposit_choice"
                        value="100"
                        checked={formData.deposit_choice === 100}
                        onChange={() =>
                          setFormData({ ...formData, deposit_choice: 100 })
                        }
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">100% Full Payment</span>
                        <span className="block text-sm text-gray-600">
                          Pay ¥{getCartTotal().toLocaleString()} now
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Amount to Pay Now */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-900">
                      You will pay now:
                    </span>
                    <span className="text-xl font-bold text-blue-900">
                      ¥{Math.round((getCartTotal() * formData.deposit_choice) / 100).toLocaleString()}
                    </span>
                  </div>
                  {formData.deposit_choice < 100 && (
                    <p className="text-xs text-blue-700 mt-2">
                      Remaining ¥{Math.round((getCartTotal() * (100 - formData.deposit_choice)) / 100).toLocaleString()} to be paid later
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Container>
  );
}
