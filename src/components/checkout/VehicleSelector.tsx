"use client";

import { useState, useEffect } from "react";
import { VehicleKey, VehicleRates, VehicleSelection, VEHICLE_LABELS, calculateItemSubtotal, getTotalVehicles } from "@/types/vehicle";
import VehicleQuantitySelector from "@/components/ui/VehicleQuantitySelector";

interface VehicleSelectorProps {
  vehicleRates: VehicleRates | null | undefined;
  initialSelection?: VehicleSelection;
  onSelectionChange: (selection: VehicleSelection) => void;
  showSubtotal?: boolean;
}

const DEFAULT_SELECTION: VehicleSelection = {
  v8: 0,
  v10: 0,
  v14: 0,
  coaster: 0,
  bigbus: 0,
};

export default function VehicleSelector({
  vehicleRates,
  initialSelection,
  onSelectionChange,
  showSubtotal = true,
}: VehicleSelectorProps) {
  const [selection, setSelection] = useState<VehicleSelection>(
    initialSelection || DEFAULT_SELECTION
  );

  useEffect(() => {
    if (initialSelection) {
      setSelection(initialSelection);
    }
  }, [initialSelection]);

  const handleQuantityChange = (key: VehicleKey, value: number) => {
    const newSelection = {
      ...selection,
      [key]: Math.max(0, value),
    };
    setSelection(newSelection);
    onSelectionChange(newSelection);
  };

  const subtotal = vehicleRates ? calculateItemSubtotal(selection, vehicleRates) : 0;
  const totalVehicles = getTotalVehicles(selection);

  const vehicleKeys: VehicleKey[] = ["v8", "v10", "v14", "coaster", "bigbus"];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Select Vehicles</h3>
      <div className="space-y-3">
        {vehicleKeys.map((key) => {
          const rate = vehicleRates?.[key];
          const qty = selection[key];
          const isSelected = qty > 0;

          return (
            <div
              key={key}
              className={`flex items-center justify-between p-3 border rounded-lg transition-all min-h-[72px] ${
                isSelected
                  ? "bg-gray-50 border-gray-300"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Left: Vehicle info */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900 mb-0.5">
                  {VEHICLE_LABELS[key]}
                </label>
                {rate !== undefined && rate !== null ? (
                  <p className="text-xs text-gray-600 whitespace-nowrap">
                    ¥{rate.toLocaleString()} / vehicle
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    Not available
                  </p>
                )}
              </div>

              {/* Right: Quantity selector */}
              <div className="flex-shrink-0">
                <VehicleQuantitySelector
                  value={qty}
                  onChange={(newValue) => handleQuantityChange(key, newValue)}
                  min={0}
                  disabled={rate === undefined || rate === null}
                />
              </div>
            </div>
          );
        })}
      </div>
      {showSubtotal && (
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Subtotal:</span>
            <span className="text-xl font-bold text-gray-900">
              {subtotal > 0 ? `¥${subtotal.toLocaleString()}` : "¥0"}
            </span>
          </div>
          {totalVehicles === 0 && (
            <p className="mt-2 text-sm text-red-600">
              Please select at least one vehicle
            </p>
          )}
        </div>
      )}
    </div>
  );
}
