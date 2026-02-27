import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?redirect=/account/bookings/${id}`);
  }

  // Fetch booking (RLS ensures it belongs to user)
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`
      *,
      booking_items (
        id,
        item_type,
        title,
        slug,
        subtotal_amount,
        vehicle_selection
      )
    `)
    .eq("id", id)
    .single();

  if (bookingError || !booking) {
    console.error("Booking not found or access denied:", bookingError);
    notFound();
  }

  // Verify booking belongs to user (extra security check)
  if (booking.user_id !== user.id) {
    console.error("Unauthorized access attempt:", {
      booking_id: id,
      booking_user_id: booking.user_id,
      current_user_id: user.id,
    });
    notFound();
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-green-100 text-green-800 border-green-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const paymentStatusColors = {
    unpaid: "bg-red-100 text-red-800 border-red-200",
    partial: "bg-yellow-100 text-yellow-800 border-yellow-200",
    paid: "bg-green-100 text-green-800 border-green-200",
    refunded: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const formatVehicleSelection = (selection: any) => {
    if (!selection) return null;
    const parts: string[] = [];
    const labels: Record<string, string> = {
      v8: "8-seater",
      v10: "10-seater",
      v14: "14-seater",
      coaster: "Coaster",
      bigbus: "Big Bus",
    };
    Object.entries(selection).forEach(([key, count]) => {
      if (count && typeof count === "number" && count > 0) {
        parts.push(`${labels[key] || key} x${count}`);
      }
    });
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const showPayButton =
    booking.remaining_amount > 0 &&
    booking.payment_status !== "paid" &&
    booking.booking_status !== "cancelled";

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/account">
          <Button variant="outline" className="mb-6">
            ← Back to My Account
          </Button>
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {booking.customer_name}
              </h1>
              <p className="text-sm text-gray-600 mt-1 font-mono">
                Ref: {booking.reference_code}
              </p>
            </div>
            <div className="flex gap-3">
              <span
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                  statusColors[booking.booking_status as keyof typeof statusColors]
                }`}
              >
                {booking.booking_status.toUpperCase()}
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                  paymentStatusColors[
                    booking.payment_status as keyof typeof paymentStatusColors
                  ]
                }`}
              >
                {booking.payment_status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Booking Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Travel Date</p>
              <p className="text-gray-900 font-medium">
                {formatDate(booking.travel_date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Passengers</p>
              <p className="text-gray-900">{booking.passengers_count} passengers</p>
            </div>
            {booking.large_suitcases > 0 && (
              <div>
                <p className="text-sm text-gray-600">Large Suitcases</p>
                <p className="text-gray-900">{booking.large_suitcases} suitcases</p>
              </div>
            )}
            {booking.pickup_location && (
              <div>
                <p className="text-sm text-gray-600">Pickup Location</p>
                <p className="text-gray-900">{booking.pickup_location}</p>
              </div>
            )}
            {booking.dropoff_location && (
              <div>
                <p className="text-sm text-gray-600">Dropoff Location</p>
                <p className="text-gray-900">{booking.dropoff_location}</p>
              </div>
            )}
            {booking.special_requests && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Special Requests</p>
                <p className="text-gray-900">{booking.special_requests}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        {booking.booking_items && booking.booking_items.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Items</h2>
            <div className="space-y-3">
              {booking.booking_items.map((item: any) => {
                const vehicles = formatVehicleSelection(item.vehicle_selection);
                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {item.item_type}
                      </p>
                      {vehicles && (
                        <p className="text-sm text-gray-700 mt-1">
                          🚐 {vehicles}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.subtotal_amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Payment Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-gray-900 font-semibold">
                {formatCurrency(booking.total_amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid</span>
              <span className="text-green-600 font-medium">
                {formatCurrency(booking.amount_paid)}
              </span>
            </div>
            {booking.remaining_amount > 0 && (
              <div className="flex justify-between pt-3 border-t">
                <span className="text-gray-900 font-semibold">
                  Remaining Balance
                </span>
                <span className="text-red-600 font-bold">
                  {formatCurrency(booking.remaining_amount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`/booking/track?bookingId=${booking.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Track Booking Details
            </Button>
          </Link>
          {showPayButton && (
            <form
              action={`/api/stripe/create-checkout-remaining`}
              method="POST"
              className="flex-1"
            >
              <input type="hidden" name="bookingId" value={booking.id} />
              <Link href={`/account/bookings/${booking.id}/pay`}>
                <Button className="w-full">
                  Pay Remaining ({formatCurrency(booking.remaining_amount)})
                </Button>
              </Link>
            </form>
          )}
        </div>
      </div>
    </Container>
  );
}