"use client";

interface VehicleQuantitySelectorProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export default function VehicleQuantitySelector({
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
}: VehicleQuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (max === undefined || value < max) {
      onChange(value + 1);
    }
  };

  const isMinDisabled = disabled || value <= min;
  const isMaxDisabled = disabled || (max !== undefined && value >= max);

  return (
    <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Minus Button */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={isMinDisabled}
        aria-label="Decrease quantity"
        className={`w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors ${
          isMinDisabled
            ? "opacity-40 cursor-not-allowed hover:bg-white"
            : "active:bg-gray-200"
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </button>

      {/* Value Display */}
      <div className="w-12 h-10 flex items-center justify-center border-x border-gray-300 bg-gray-50">
        <span className="text-base font-semibold text-gray-900">{value}</span>
      </div>

      {/* Plus Button */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={isMaxDisabled}
        aria-label="Increase quantity"
        className={`w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors ${
          isMaxDisabled
            ? "opacity-40 cursor-not-allowed hover:bg-white"
            : "active:bg-gray-200"
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
}
