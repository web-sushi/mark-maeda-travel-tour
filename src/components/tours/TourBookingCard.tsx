"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VehicleSelection, VehicleRates, getTotalVehicles } from "@/types/vehicle";
import { CartItem, addItem } from "@/lib/cart/store";
import VehicleSelector from "@/components/checkout/VehicleSelector";
import Button from "@/components/ui/Button";

interface TourBookingCardProps {
  type: "tour" | "transfer" | "package";
  id: string;
  slug: string;
  title: string;
  vehicleRates: VehicleRates | null | undefined;
}

const DEFAULT_SELECTION: VehicleSelection = {
  v8: 0,
  v10: 0,
  v14: 0,
  coaster: 0,
  bigbus: 0,
};

export default function TourBookingCard({
  type,
  id,
  slug,
  title,
  vehicleRates,
}: TourBookingCardProps) {
  const router = useRouter();
  const [vehicleSelection, setVehicleSelection] = useState<VehicleSelection>(DEFAULT_SELECTION);
  const [loading, setLoading] = useState(false);

  const totalVehicles = getTotalVehicles(vehicleSelection);
  const hasSelection = totalVehicles > 0;

  const handleAddToCart = () => {
    if (!hasSelection) return;

    const cartItem: CartItem = {
      type,
      id,
      slug,
      title,
      vehicleSelection,
      vehicleRates: vehicleRates || {},
    };

    addItem(cartItem);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  const handleBookNow = () => {
    if (!hasSelection) return;

    const cartItem: CartItem = {
      type,
      id,
      slug,
      title,
      vehicleSelection,
      vehicleRates: vehicleRates || {},
    };

    addItem(cartItem);
    router.push("/checkout");
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 sticky top-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Book This Tour</h3>
      
      <VehicleSelector
        vehicleRates={vehicleRates}
        initialSelection={vehicleSelection}
        onSelectionChange={setVehicleSelection}
        showSubtotal={true}
      />

      <div className="mt-6 space-y-3">
        <Button
          onClick={handleBookNow}
          disabled={loading || !hasSelection}
          className="w-full"
        >
          {loading ? "Processing..." : "Book Now"}
        </Button>
        
        <Button
          onClick={handleAddToCart}
          disabled={loading || !hasSelection}
          variant="outline"
          className="w-full"
        >
          Add to Cart
        </Button>

        {!hasSelection && (
          <p className="text-sm text-gray-500 text-center mt-2">
            Select at least one vehicle to continue
          </p>
        )}
      </div>
    </div>
  );
}
