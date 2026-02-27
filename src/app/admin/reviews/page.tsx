import { createClient } from "@/lib/supabase/server";
import ReviewsTableClient from "@/components/admin/ReviewsTableClient";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  // Fetch reviews with joins
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select(`
      *,
      booking_items!inner (
        title,
        item_type,
        item_id,
        slug,
        booking_id
      ),
      bookings!inner (
        reference_code
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin - Reviews</h1>
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin - Reviews</h1>
        <p className="text-gray-600">
          Moderate customer reviews and feature the best ones
        </p>
      </div>

      <ReviewsTableClient initialReviews={reviews || []} />
    </div>
  );
}
