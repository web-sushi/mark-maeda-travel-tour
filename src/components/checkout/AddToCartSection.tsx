"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VehicleSelection, VehicleRates, getTotalVehicles } from "@/types/vehicle";
import { CartItem, addItem } from "@/lib/cart/store";
import VehicleSelector from "./VehicleSelector";
import Button from "@/components/ui/Button";

interface AddToCartSectionProps {
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

export default function AddToCartSection({
  type,
  id,
  slug,
  title,
  vehicleRates,
}: AddToCartSectionProps) {
  const router = useRouter();
  const [vehicleSelection, setVehicleSelection] = useState<VehicleSelection>(DEFAULT_SELECTION);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = () => {
    const totalVehicles = getTotalVehicles(vehicleSelection);
    if (totalVehicles === 0) {
      alert("Please select at least one vehicle");
      return;
    }

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
      // Show success message or update UI
    }, 300);
  };

  const handleBookNow = () => {
    const totalVehicles = getTotalVehicles(vehicleSelection);
    if (totalVehicles === 0) {
      alert("Please select at least one vehicle");
      return;
    }

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
    <div className="border rounded-lg p-6 bg-white">
      <VehicleSelector
        vehicleRates={vehicleRates}
        initialSelection={vehicleSelection}
        onSelectionChange={setVehicleSelection}
        showSubtotal={true}
      />
      <div className="mt-6 flex gap-4">
        <Button
          onClick={handleAddToCart}
          disabled={loading || getTotalVehicles(vehicleSelection) === 0}
          className="flex-1"
        >
          {loading ? "Adding..." : "Add to Cart"}
        </Button>
        <Button
          onClick={handleBookNow}
          disabled={loading || getTotalVehicles(vehicleSelection) === 0}
          variant="outline"
          className="flex-1"
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}
