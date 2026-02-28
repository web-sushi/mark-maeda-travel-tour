import Container from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getLowestVehicleRate } from "@/types/vehicle";
import { getPublicImageUrl } from "@/lib/storage/publicUrl";
import BookingCard from "@/components/shared/BookingCard";
import TourDescription from "@/components/tours/TourDescription";
import RatingSummary from "@/components/reviews/RatingSummary";
import ReviewsList from "@/components/reviews/ReviewsList";

export const dynamic = "force-dynamic";

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: tour, error } = await supabase
    .from("tours")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !tour) {
    notFound();
  }

  // Fetch reviews from v_reviews_expanded
  const { data: reviews } = await supabase
    .from("v_reviews_expanded")
    .select("*")
    .eq("item_type", "tour")
    .eq("item_id", tour.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  // Calculate rating statistics
  const reviewList = reviews || [];
  const totalReviews = reviewList.length;
  const averageRating =
    totalReviews > 0
      ? reviewList.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const highlights = Array.isArray(tour.highlights) ? tour.highlights : [];
  const vehicleRates = tour.vehicle_rates || null;
  const lowestRate = getLowestVehicleRate(vehicleRates);
  const coverUrl = getPublicImageUrl(tour.cover_image_path);
  const galleryPaths = Array.isArray(tour.gallery_image_paths)
    ? tour.gallery_image_paths
    : [];

  return (
    <div className="min-h-[100svh] bg-gray-50">
      <Container className="py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="mb-8">
            {coverUrl && (
              <div className="w-full h-[400px] md:h-[500px] relative bg-gray-200 rounded-2xl overflow-hidden shadow-lg mb-6">
                <img
                  src={coverUrl}
                  alt={tour.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {tour.title}
            </h1>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-3">
              {tour.region && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {tour.region}
                </span>
              )}
              {tour.duration_hours && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {tour.duration_hours} hours
                </span>
              )}
              {lowestRate !== null && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  From ¥{lowestRate.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Content */}
            <div className="lg:col-span-2">
              {/* Tour Description with all sections */}
              <TourDescription
                description={tour.description || ""}
                importantNotes={tour.important_notes}
              />

              {/* Gallery Section */}
              {galleryPaths.length > 0 && (
                <section className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {galleryPaths.map((path: string, index: number) => {
                      const galleryUrl = getPublicImageUrl(path);
                      return galleryUrl ? (
                        <div
                          key={index}
                          className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden group"
                        >
                          <img
                            src={galleryUrl}
                            alt={`${tour.title} - Gallery ${index + 1}`}
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          />
                        </div>
                      ) : null;
                    })}
                  </div>
                </section>
              )}

              {/* Reviews Section */}
              <section className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Customer Reviews
                </h2>

                {totalReviews > 0 && (
                  <div className="mb-8">
                    <RatingSummary
                      averageRating={averageRating}
                      totalReviews={totalReviews}
                    />
                  </div>
                )}

                <ReviewsList reviews={reviewList} />
              </section>
            </div>

            {/* Right column - Booking card (sticky on desktop) */}
            <div className="lg:col-span-1">
              <BookingCard
                type="tour"
                id={tour.id}
                slug={tour.slug}
                title={tour.title}
                vehicleRates={vehicleRates}
                cardTitle="Book This Tour"
              />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
