import { createClient } from "@/lib/supabase/server";
import BookingsTableClient from "@/components/admin/BookingsTableClient";

export const dynamic = "force-dynamic";

interface Booking {
  id: string;
  reference_code: string;
  customer_name: string;
  customer_email: string;
  travel_date: string;
  booking_status: string;
  payment_status: string;
  total_amount: number;
  amount_paid: number;
  remaining_amount: number;
  items: any;
  created_at: string;
}

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .order("travel_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookings:", error);
    return (
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin - Bookings</h1>
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  // Collect unique item IDs by type from all bookings
  const tourIds = new Set<string>();
  const transferIds = new Set<string>();
  const packageIds = new Set<string>();

  (bookings || []).forEach((booking) => {
    if (Array.isArray(booking.items)) {
      booking.items.forEach((item: any) => {
        if (item.type === "tour" && item.id) {
          tourIds.add(item.id);
        } else if (item.type === "transfer" && item.id) {
          transferIds.add(item.id);
        } else if (item.type === "package" && item.id) {
          packageIds.add(item.id);
        }
      });
    }
  });

  // Fetch titles in parallel
  const [toursResult, transfersResult, packagesResult] = await Promise.all([
    tourIds.size > 0
      ? supabase
          .from("tours")
          .select("id, title")
          .in("id", Array.from(tourIds))
      : { data: [], error: null },
    transferIds.size > 0
      ? supabase
          .from("transfers")
          .select("id, title, from_area, to_area")
          .in("id", Array.from(transferIds))
      : { data: [], error: null },
    packageIds.size > 0
      ? supabase
          .from("packages")
          .select("id, title")
          .in("id", Array.from(packageIds))
      : { data: [], error: null },
  ]);

  // Create maps for item titles
  const itemTitlesMap: {
    tour: Record<string, string>;
    transfer: Record<string, string>;
    package: Record<string, string>;
  } = {
    tour: {},
    transfer: {},
    package: {},
  };

  // Map tour titles
  (toursResult.data || []).forEach((tour: any) => {
    if (tour.id && tour.title) {
      itemTitlesMap.tour[tour.id] = tour.title;
    }
  });

  // Map transfer titles (with route fallback)
  (transfersResult.data || []).forEach((transfer: any) => {
    if (transfer.id) {
      if (transfer.title) {
        itemTitlesMap.transfer[transfer.id] = transfer.title;
      } else if (transfer.from_area && transfer.to_area) {
        itemTitlesMap.transfer[transfer.id] = `${transfer.from_area} → ${transfer.to_area}`;
      } else if (transfer.from_area || transfer.to_area) {
        itemTitlesMap.transfer[transfer.id] = transfer.from_area || transfer.to_area;
      }
    }
  });

  // Map package titles
  (packagesResult.data || []).forEach((pkg: any) => {
    if (pkg.id && pkg.title) {
      itemTitlesMap.package[pkg.id] = pkg.title;
    }
  });

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Admin - Bookings</h1>
      <BookingsTableClient
        initialBookings={bookings || []}
        itemTitlesMap={itemTitlesMap}
      />
    </div>
  );
}
