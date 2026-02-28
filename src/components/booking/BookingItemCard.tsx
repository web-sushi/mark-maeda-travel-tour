"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { BookingItemRow } from "@/types/booking";

interface BookingItemCardProps {
  item: BookingItemRow;
  index: number;
}

export default function BookingItemCard({ item, index }: BookingItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Safe date formatter
  const formatDateSafe = (dateString?: string | null): string => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Safe time formatter
  const formatTimeSafe = (timeString?: string | null): string => {
    if (!timeString) return "—";
    // timeString is in HH:MM:SS format
    const [hours, minutes] = timeString.split(":");
    if (!hours || !minutes) return timeString;
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Currency formatter
  const formatCurrency = (amount?: number | null): string => {
    if (!amount) return "—";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  // Get type badge styling
  const getTypeBadge = () => {
    const badges = {
      tour: { label: "TOUR", color: "bg-blue-100 text-blue-800 border-blue-200" },
      transfer: { label: "TRANSFER", color: "bg-purple-100 text-purple-800 border-purple-200" },
      package: { label: "PACKAGE", color: "bg-green-100 text-green-800 border-green-200" },
    };
    return badges[item.item_type] || badges.tour;
  };

  // Get date display
  const getDateDisplay = () => {
    if (item.item_type === "package") {
      const start = formatDateSafe(item.start_date);
      const end = formatDateSafe(item.end_date);
      if (start === "—" && end === "—") return "—";
      if (start === end) return start;
      return `${start} - ${end}`;
    }
    return formatDateSafe(item.travel_date);
  };

  // Get route summary
  const getRouteSummary = () => {
    if (item.pickup_location && item.dropoff_location) {
      return `${item.pickup_location} → ${item.dropoff_location}`;
    }
    if (item.pickup_location) return `From: ${item.pickup_location}`;
    if (item.dropoff_location) return `To: ${item.dropoff_location}`;
    return null;
  };

  const badge = getTypeBadge();
  const dateDisplay = getDateDisplay();
  const routeSummary = getRouteSummary();

  // Extract meta fields
  const flightNumber = item.meta?.flight_number;
  const specialRequests = item.meta?.special_requests;

  // Helper to render field only if value exists
  const renderField = (label: string, value: any, formatter?: (v: any) => string) => {
    if (!value && value !== 0) return null;
    const displayValue = formatter ? formatter(value) : value;
    return (
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 font-medium">{displayValue}</p>
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
      {/* Card Header */}
      <div className="bg-white p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2 py-1 text-xs font-bold rounded border ${badge.color}`}
              >
                {badge.label}
              </span>
              {item.item_type === "transfer" && (
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                  Private Vehicle
                </span>
              )}
            </div>
            <h4 className="text-base font-semibold text-gray-900">
              {item.title || `${item.item_type} (ID: ${item.item_id})`}
            </h4>
          </div>
          {item.subtotal_amount && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Subtotal</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(item.subtotal_amount)}
              </p>
            </div>
          )}
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
          {renderField("Date", dateDisplay)}
          {item.pickup_time && renderField("Pickup Time", formatTimeSafe(item.pickup_time))}
          {item.passengers_count && renderField("Passengers", `${item.passengers_count} pax`)}
          {item.large_suitcases !== null &&
            item.large_suitcases !== undefined &&
            renderField("Luggage", `${item.large_suitcases} bags`)}
        </div>

        {/* Route Summary */}
        {routeSummary && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Route</p>
            <p className="text-sm text-gray-900 font-medium">{routeSummary}</p>
          </div>
        )}
      </div>

      {/* Expandable Details */}
      <div className="border-t border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-sm font-medium text-gray-700"
        >
          <span>{isExpanded ? "Hide details" : "View details"}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {isExpanded && (
          <div className="bg-gray-50 p-4 space-y-4">
            {/* All Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date & Time Section */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Schedule
                </h5>
                {item.item_type === "package" ? (
                  <>
                    {renderField("Start Date", formatDateSafe(item.start_date))}
                    {renderField("End Date", formatDateSafe(item.end_date))}
                  </>
                ) : (
                  renderField("Travel Date", formatDateSafe(item.travel_date))
                )}
                {renderField("Pickup Time", formatTimeSafe(item.pickup_time))}
              </div>

              {/* Location Section */}
              {(item.pickup_location || item.dropoff_location) && (
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Locations
                  </h5>
                  {renderField("Pickup Location", item.pickup_location)}
                  {renderField("Dropoff Location", item.dropoff_location)}
                </div>
              )}

              {/* Passengers & Luggage Section */}
              {(item.passengers_count || item.large_suitcases !== null) && (
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Passengers & Luggage
                  </h5>
                  {renderField("Passengers", item.passengers_count)}
                  {item.large_suitcases !== null &&
                    renderField("Large Suitcases", item.large_suitcases)}
                </div>
              )}

              {/* Vehicle Selection */}
              {item.vehicle_selection && typeof item.vehicle_selection === "object" && (
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Vehicle
                  </h5>
                  {Object.entries(item.vehicle_selection).map(([key, count]) => {
                    if (!count || count === 0) return null;
                    return (
                      <div key={key}>
                        <p className="text-xs text-gray-500 capitalize">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-gray-900 font-medium">x{count as number}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Meta Info (Flight, Special Requests) */}
              {(flightNumber || specialRequests) && (
                <div className="space-y-3 md:col-span-2">
                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Additional Information
                  </h5>
                  {renderField("Flight Number", flightNumber)}
                  {specialRequests && (
                    <div>
                      <p className="text-xs text-gray-500">Special Requests</p>
                      <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                        {specialRequests}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pricing Details */}
            {item.subtotal_amount && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Item Subtotal</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(item.subtotal_amount)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
