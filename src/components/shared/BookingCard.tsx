"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VehicleSelection, VehicleRates, getTotalVehicles } from "@/types/vehicle";
import { TourPlace } from "@/types/tour";
import { CartItem, addItem } from "@/lib/cart/store";
import VehicleSelector from "@/components/checkout/VehicleSelector";
import TourPlacesSelector from "@/components/tours/TourPlacesSelector";
import Button from "@/components/ui/Button";

interface BookingCardProps {
  type: "tour" | "transfer" | "package";
  id: string;
  slug: string;
  title: string;
  vehicleRates: VehicleRates | null | undefined;
  cardTitle?: string;
  places?: TourPlace[];
}

const DEFAULT_SELECTION: VehicleSelection = {
  v8: 0,
  v10: 0,
  v14: 0,
  coaster: 0,
  bigbus: 0,
};

export default function BookingCard({
  type,
  id,
  slug,
  title,
  vehicleRates,
  cardTitle = "Book Now",
  places = [],
}: BookingCardProps) {
  const router = useRouter();
  const [vehicleSelection, setVehicleSelection] = useState<VehicleSelection>(DEFAULT_SELECTION);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const totalVehicles = getTotalVehicles(vehicleSelection);
  const hasSelection = totalVehicles > 0;

  const buildCartItem = (): CartItem => {
    const selectedPlaces = places.filter((p) => selectedPlaceIds.includes(p.id));
    return {
      type,
      id,
      slug,
      title,
      vehicleSelection,
      vehicleRates: vehicleRates || {},
      selectedPlaces: selectedPlaces.length > 0 ? selectedPlaces : undefined,
    };
  };

  const handleAddToCart = () => {
    if (!hasSelection) return;
    addItem(buildCartItem());
    setLoading(true);
    setTimeout(() => setLoading(false), 300);
  };

  const handleBookNow = () => {
    if (!hasSelection) return;
    addItem(buildCartItem());
    router.push("/checkout");
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 sticky top-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">{cardTitle}</h3>

      {/* Places selector — only for tours with configured places */}
      {type === "tour" && places.length > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-100">
          <TourPlacesSelector
            places={places}
            selectedIds={selectedPlaceIds}
            onChange={setSelectedPlaceIds}
          />
        </div>
      )}

      <VehicleSelector
        vehicleRates={vehicleRates}
        initialSelection={vehicleSelection}
        onSelectionChange={setVehicleSelection}
        showSubtotal={true}
      />

      <div className="mt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleAddToCart}
            disabled={loading || !hasSelection}
            variant="outline"
            className="w-full sm:flex-1"
          >
            Add to Cart
          </Button>

          <Button
            onClick={handleBookNow}
            disabled={loading || !hasSelection}
            className="w-full sm:flex-1"
          >
            {loading ? "Processing..." : "Book Now"}
          </Button>
        </div>

        {!hasSelection && (
          <p className="text-sm text-gray-500 text-center mt-3">
            Select at least one vehicle to continue
          </p>
        )}

        {selectedPlaceIds.length > 0 && (
          <p className="text-xs text-blue-600 text-center mt-2">
            {selectedPlaceIds.length} place{selectedPlaceIds.length > 1 ? "s" : ""} selected
          </p>
        )}
      </div>
    </div>
  );
}
