"use client";

import { CartItem, TripDetails } from "@/lib/cart/store";
import Input from "@/components/ui/Input";

interface TripDetailsCardProps {
  item: CartItem;
  onUpdate: (tripDetails: TripDetails) => void;
  errors?: {
    passengersCount?: string;
    pickupLocation?: string;
    dropoffLocation?: string;
    travelDate?: string;
    startDate?: string;
    endDate?: string;
  };
}

export default function TripDetailsCard({
  item,
  onUpdate,
  errors,
}: TripDetailsCardProps) {
  const tripDetails = item.tripDetails || {};
  const hasErrors = errors && Object.keys(errors).length > 0;

  const handleChange = (field: keyof TripDetails, value: string) => {
    onUpdate({
      ...tripDetails,
      [field]: value,
    });
  };

  return (
    <div
      className={`bg-white rounded-xl border p-6 ${
        hasErrors ? "border-red-300 bg-red-50" : "border-gray-200"
      }`}
    >
      {/* Item Header */}
      <div className="flex items-start gap-3 mb-4 pb-4 border-b">
        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-2xl flex-shrink-0">
          {item.type === "tour" && "🗺️"}
          {item.type === "transfer" && "🚐"}
          {item.type === "package" && "📦"}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{item.title}</h3>
          <p className="text-sm text-gray-600 capitalize">{item.type}</p>
        </div>
      </div>

      {/* Trip Details Form */}
      <div className="space-y-4">
        {/* Passengers Count - Required for all */}
        <div>
          <Input
            label="Passengers *"
            type="number"
            min="1"
            required
            value={tripDetails.passengersCount || ""}
            onChange={(e) => handleChange("passengersCount", e.target.value)}
            placeholder="Number of passengers"
          />
          {errors?.passengersCount && (
            <p className="text-sm text-red-600 mt-1">{errors.passengersCount}</p>
          )}
        </div>

        {/* Large Suitcases - Optional for all */}
        <div>
          <Input
            label="Large Suitcases"
            type="number"
            min="0"
            value={tripDetails.largeSuitcases || ""}
            onChange={(e) => handleChange("largeSuitcases", e.target.value)}
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional - enter 0 if no large suitcases
          </p>
        </div>

        {/* Pickup Location - Required for all */}
        <div>
          <Input
            label="Pickup Location *"
            type="text"
            required
            value={tripDetails.pickupLocation || ""}
            onChange={(e) => handleChange("pickupLocation", e.target.value)}
            placeholder="e.g., Narita Airport Terminal 1"
          />
          {errors?.pickupLocation && (
            <p className="text-sm text-red-600 mt-1">{errors.pickupLocation}</p>
          )}
        </div>

        {/* Dropoff Location - Required for all */}
        <div>
          <Input
            label="Drop-off Location *"
            type="text"
            required
            value={tripDetails.dropoffLocation || ""}
            onChange={(e) => handleChange("dropoffLocation", e.target.value)}
            placeholder="e.g., Tokyo Station"
          />
          {errors?.dropoffLocation && (
            <p className="text-sm text-red-600 mt-1">{errors.dropoffLocation}</p>
          )}
        </div>

        {/* Date fields based on item type */}
        {(item.type === "tour" || item.type === "transfer") && (
          <div>
            <Input
              label="Travel Date *"
              type="date"
              required
              value={tripDetails.travelDate || ""}
              onChange={(e) => handleChange("travelDate", e.target.value)}
            />
            {errors?.travelDate && (
              <p className="text-sm text-red-600 mt-1">{errors.travelDate}</p>
            )}
          </div>
        )}

        {item.type === "package" && (
          <>
            <div>
              <Input
                label="Start Date *"
                type="date"
                required
                value={tripDetails.startDate || ""}
                onChange={(e) => handleChange("startDate", e.target.value)}
              />
              {errors?.startDate && (
                <p className="text-sm text-red-600 mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <Input
                label="End Date *"
                type="date"
                required
                value={tripDetails.endDate || ""}
                onChange={(e) => handleChange("endDate", e.target.value)}
              />
              {errors?.endDate && (
                <p className="text-sm text-red-600 mt-1">{errors.endDate}</p>
              )}
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                The same pickup and drop-off locations will be used for all days of your package.
              </p>
            </div>
          </>
        )}

        {/* Optional fields for transfers */}
        {item.type === "transfer" && (
          <>
            <div>
              <Input
                label="Pickup Time (Optional)"
                type="time"
                value={tripDetails.pickupTime || ""}
                onChange={(e) => handleChange("pickupTime", e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Specify pickup time if needed
              </p>
            </div>
            <div>
              <Input
                label="Flight Number (Optional)"
                type="text"
                value={tripDetails.flightNumber || ""}
                onChange={(e) => handleChange("flightNumber", e.target.value)}
                placeholder="e.g., NH123"
              />
              <p className="text-xs text-gray-500 mt-1">
                For airport pickups - we'll track your flight
              </p>
            </div>
          </>
        )}

        {/* Special Requests */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Special Requests for this item (Optional)
          </label>
          <textarea
            value={tripDetails.specialRequests || ""}
            onChange={(e) => handleChange("specialRequests", e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            rows={3}
            placeholder="Any specific requests for this tour/transfer..."
          />
        </div>
      </div>
    </div>
  );
}
