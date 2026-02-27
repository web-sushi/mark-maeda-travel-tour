"use client";

import { VehicleRates, VehicleKey, VEHICLE_LABELS } from "@/types/vehicle";

interface VehicleRatesEditorProps {
  value: VehicleRates | null | undefined;
  onChange: (nextRates: VehicleRates) => void;
}

const VEHICLE_KEYS: VehicleKey[] = ["v8", "v10", "v14", "coaster", "bigbus"];

const VEHICLE_DISPLAY_LABELS: Record<VehicleKey, string> = {
  v8: "8-seater",
  v10: "10-seater",
  v14: "14-seater",
  coaster: "Coaster Bus",
  bigbus: "Big Bus",
};

export default function VehicleRatesEditor({
  value,
  onChange,
}: VehicleRatesEditorProps) {
  const rates = value || {};

  const handleChange = (key: VehicleKey, newValue: string) => {
    const numValue = parseInt(newValue) || 0;
    const updatedRates: VehicleRates = {
      ...rates,
      [key]: numValue >= 0 ? numValue : 0,
    };
    onChange(updatedRates);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Vehicle Rates (JPY per vehicle)
        </label>
        <div className="space-y-3">
          {VEHICLE_KEYS.map((key) => {
            const currentValue = rates[key] || 0;
            return (
              <div key={key} className="flex items-center gap-4">
                <label className="w-32 text-sm text-gray-700">
                  {VEHICLE_DISPLAY_LABELS[key]}:
                </label>
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={currentValue}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder="¥0"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />
                </div>
                {currentValue > 0 && (
                  <span className="text-sm text-gray-600 w-32 text-right">
                    {formatCurrency(currentValue)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          These prices are per vehicle and determine cart & checkout totals.
        </p>
        {/* TODO: Add bulk pricing tools (e.g., apply percentage increase to all rates) */}
        {/* TODO: Add currency conversion support if multi-currency is needed in the future */}
      </div>
    </div>
  );
}
