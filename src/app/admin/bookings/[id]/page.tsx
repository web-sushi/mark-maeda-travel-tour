import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BookingStatusForm from "@/components/admin/BookingStatusForm";
import AdminNotesSection from "@/components/admin/AdminNotesSection";
import BookingActionButtons from "@/components/admin/BookingActionButtons";
import BookingEventsTimeline from "@/components/admin/BookingEventsTimeline";
import { 
  fetchItemNames, 
  computeTripSummary, 
  formatDate, 
  formatTime, 
  getItemAdminUrl,
  sortItemsBySchedule,
  formatDateRange
} from "@/lib/admin/booking-helpers";
import { BookingItemRow } from "@/types/booking";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !booking) {
    notFound();
  }

  // Fetch booking_items with all trip details
  const { data: bookingItems, error: itemsError } = await supabase
    .from("booking_items")
    .select("*")
    .eq("booking_id", id)
    .order("created_at", { ascending: true });

  const items: BookingItemRow[] = bookingItems || [];

  // Fetch item names from their respective tables
  const enhancedItems = items.length > 0 ? await fetchItemNames(items) : [];

  // Compute trip summary
  const tripSummary = items.length > 0 ? computeTripSummary(items) : null;

  // Sort items for schedule view
  const scheduledItems = sortItemsBySchedule(enhancedItems);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/bookings"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Bookings
        </Link>
        <h1 className="text-4xl font-bold text-gray-900">
          Booking: {booking.reference_code}
        </h1>
      </div>

      <div className="space-y-6 max-w-6xl">
        {/* Trip Summary Card */}
        {tripSummary && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📅</span>
              Trip Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date Range</p>
                <p className="text-base font-semibold text-gray-900">{tripSummary.dateRange}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-base font-semibold text-gray-900">{tripSummary.totalItems}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Passengers</p>
                <p className="text-base font-semibold text-gray-900">
                  {tripSummary.totalPassengers || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Large Suitcases</p>
                <p className="text-base font-semibold text-gray-900">
                  {tripSummary.totalSuitcases || "—"}
                </p>
              </div>
              {!tripSummary.hasMultipleLocations && (
                <>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Pickup Location</p>
                    <p className="text-base font-semibold text-gray-900">
                      {tripSummary.pickupLocation || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Dropoff Location</p>
                    <p className="text-base font-semibold text-gray-900">
                      {tripSummary.dropoffLocation || "—"}
                    </p>
                  </div>
                </>
              )}
              {tripSummary.hasMultipleLocations && (
                <div className="col-span-2 md:col-span-4">
                  <p className="text-sm text-gray-600">Locations</p>
                  <p className="text-base font-semibold text-amber-700">
                    Varies per item (see details below)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer Info */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-base text-gray-900">{booking.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-base text-gray-900">{booking.customer_email}</p>
            </div>
            {booking.customer_phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-base text-gray-900">{booking.customer_phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Reference Code</p>
              <p className="text-base font-mono text-gray-900">{booking.reference_code}</p>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Financials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(booking.total_amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Deposit Choice</p>
              <p className="text-base text-gray-900">{booking.deposit_choice}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Paid</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(booking.amount_paid)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining Amount</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(booking.remaining_amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Booking Items - Detailed Cards */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Items</h2>
          {enhancedItems.length > 0 ? (
            <div className="space-y-4">
              {enhancedItems.map((item, index) => {
                const itemDate = item.item_type === 'package' 
                  ? formatDateRange(item.start_date, item.end_date)
                  : formatDate(item.travel_date);
                
                const displayName = item.fetched_name || item.title || `${item.item_type}-${item.item_id.slice(0, 8)}`;
                const specialRequest = item.meta?.special_requests || item.meta?.flight_number;

                return (
                  <div
                    key={item.id}
                    className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors"
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {item.item_type === 'tour' && '🎫'}
                          {item.item_type === 'transfer' && '🚗'}
                          {item.item_type === 'package' && '📦'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded ${
                                item.item_type === "tour"
                                  ? "bg-blue-100 text-blue-800"
                                  : item.item_type === "transfer"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {item.item_type.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">Item #{index + 1}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
                        </div>
                      </div>
                      <Link
                        href={getItemAdminUrl(item.item_type, item.item_id)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Item →
                      </Link>
                    </div>

                    {/* Item Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {/* Date */}
                      <div>
                        <p className="text-gray-600 font-medium">
                          {item.item_type === 'package' ? 'Travel Period' : 'Travel Date'}
                        </p>
                        <p className="text-gray-900">{itemDate}</p>
                      </div>

                      {/* Pickup Time */}
                      {item.pickup_time && (
                        <div>
                          <p className="text-gray-600 font-medium">Pickup Time</p>
                          <p className="text-gray-900">{formatTime(item.pickup_time)}</p>
                        </div>
                      )}

                      {/* Passengers */}
                      {item.passengers_count !== null && item.passengers_count !== undefined && (
                        <div>
                          <p className="text-gray-600 font-medium">Passengers</p>
                          <p className="text-gray-900">{item.passengers_count}</p>
                        </div>
                      )}

                      {/* Large Suitcases */}
                      {item.large_suitcases !== null && item.large_suitcases !== undefined && (
                        <div>
                          <p className="text-gray-600 font-medium">Large Suitcases</p>
                          <p className="text-gray-900">{item.large_suitcases}</p>
                        </div>
                      )}

                      {/* Subtotal */}
                      {item.subtotal_amount && (
                        <div>
                          <p className="text-gray-600 font-medium">Subtotal</p>
                          <p className="text-gray-900 font-semibold">
                            {formatCurrency(item.subtotal_amount)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Locations */}
                    {(item.pickup_location || item.dropoff_location) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-sm">
                          {item.pickup_location && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 font-semibold">📍 From:</span>
                                <span className="text-gray-900">{item.pickup_location}</span>
                              </div>
                              {item.dropoff_location && (
                                <span className="text-gray-400">→</span>
                              )}
                            </>
                          )}
                          {item.dropoff_location && (
                            <div className="flex items-center gap-2">
                              <span className="text-red-600 font-semibold">🎯 To:</span>
                              <span className="text-gray-900">{item.dropoff_location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Special Requests / Flight Number */}
                    {specialRequest && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          {item.meta?.flight_number ? 'Flight Number' : 'Special Requests'}
                        </p>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                          {specialRequest}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600">No booking items found</p>
          )}
        </div>

        {/* Schedule View */}
        {scheduledItems.length > 0 && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🗓️</span>
              Schedule Timeline
            </h2>
            <div className="space-y-3">
              {scheduledItems.map((item, index) => {
                const itemDate = item.item_type === 'package' 
                  ? formatDateRange(item.start_date, item.end_date)
                  : formatDate(item.travel_date);
                
                const displayName = item.fetched_name || item.title || `${item.item_type}-${item.item_id.slice(0, 8)}`;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-shrink-0 w-32">
                      <p className="text-sm font-semibold text-gray-900">{itemDate}</p>
                      {item.pickup_time && (
                        <p className="text-xs text-gray-600">{formatTime(item.pickup_time)}</p>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded ${
                        item.item_type === "tour"
                          ? "bg-blue-100 text-blue-800"
                          : item.item_type === "transfer"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {item.item_type.toUpperCase()}
                    </span>
                    <p className="flex-grow text-sm text-gray-900 font-medium">{displayName}</p>
                    {item.pickup_location && item.dropoff_location && (
                      <p className="flex-shrink-0 text-xs text-gray-600">
                        {item.pickup_location} → {item.dropoff_location}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <AdminNotesSection
          bookingId={booking.id}
          initialNotes={booking.admin_notes}
        />

        {/* Action Buttons */}
        <BookingActionButtons
          bookingId={booking.id}
          bookingStatus={booking.booking_status}
          paymentStatus={booking.payment_status}
          totalAmount={booking.total_amount}
          amountPaid={booking.amount_paid}
          remainingAmount={booking.remaining_amount}
        />

        {/* Status */}
        <BookingStatusForm
          bookingId={booking.id}
          initialBookingStatus={booking.booking_status}
          initialPaymentStatus={booking.payment_status}
        />

        {/* Event Timeline */}
        <BookingEventsTimeline bookingId={booking.id} />
      </div>
    </div>
  );
}
