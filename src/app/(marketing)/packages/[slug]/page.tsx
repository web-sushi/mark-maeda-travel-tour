import Container from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getLowestVehicleRate } from "@/types/vehicle";
import { getPublicImageUrl } from "@/lib/storage/publicUrl";
import BookingCard from "@/components/shared/BookingCard";
import DetailContent from "@/components/shared/DetailContent";
import IncludedItemCard from "@/components/packages/IncludedItemCard";
import RatingSummary from "@/components/reviews/RatingSummary";
import ReviewsList from "@/components/reviews/ReviewsList";

export const dynamic = "force-dynamic";

interface PackageItem {
  type: "tour" | "transfer";
  id: string;
  [key: string]: any;
}

interface Tour {
  id: string;
  slug: string;
  title: string;
  region: string | null;
  duration_hours: number | null;
  cover_image_path: string | null;
  images: string[] | null;
}

interface Transfer {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  from_area: string | null;
  to_area: string | null;
  cover_image_path: string | null;
  images: string[] | null;
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pkg, error } = await supabase
    .from("packages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !pkg) {
    notFound();
  }

  // Fetch reviews
  const { data: reviews } = await supabase
    .from("v_reviews_expanded")
    .select("*")
    .eq("item_type", "package")
    .eq("item_id", pkg.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  const reviewList = reviews || [];
  const totalReviews = reviewList.length;
  const averageRating =
    totalReviews > 0
      ? reviewList.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const items = Array.isArray(pkg.items) ? (pkg.items as PackageItem[]) : [];
  const vehicleRates = pkg.vehicle_rates || null;
  const lowestRate = getLowestVehicleRate(vehicleRates);
  const coverUrl = getPublicImageUrl(pkg.cover_image_path);
  const galleryPaths = Array.isArray(pkg.gallery_image_paths)
    ? pkg.gallery_image_paths
    : [];

  // Extract tour and transfer IDs
  const tourIds = items.filter((item) => item.type === "tour").map((item) => item.id);
  const transferIds = items
    .filter((item) => item.type === "transfer")
    .map((item) => item.id);

  // Fetch tours and transfers in parallel
  const [toursResult, transfersResult] = await Promise.all([
    tourIds.length > 0
      ? supabase
          .from("tours")
          .select("id, slug, title, region, duration_hours, cover_image_path, images")
          .in("id", tourIds)
          .eq("status", "active")
      : { data: [], error: null },
    transferIds.length > 0
      ? supabase
          .from("transfers")
          .select(
            "id, slug, title, category, from_area, to_area, cover_image_path, images"
          )
          .in("id", transferIds)
          .eq("status", "active")
      : { data: [], error: null },
  ]);

  const tours = (toursResult.data || []) as Tour[];
  const transfers = (transfersResult.data || []) as Transfer[];

  // Create maps for quick lookup
  const toursMap = new Map(tours.map((tour) => [tour.id, tour]));
  const transfersMap = new Map(transfers.map((transfer) => [transfer.id, transfer]));

  // Count included items
  const tourCount = items.filter((item) => item.type === "tour").length;
  const transferCount = items.filter((item) => item.type === "transfer").length;

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
                  alt={pkg.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {pkg.title}
            </h1>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              {pkg.region && (
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
                  {pkg.region}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                {items.length} items
              </span>
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

            {/* Package Summary */}
            {(tourCount > 0 || transferCount > 0) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  What's Included
                </h2>
                <div className="flex flex-wrap gap-4">
                  {tourCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tourCount} {tourCount === 1 ? "Tour" : "Tours"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Guided experiences
                        </p>
                      </div>
                    </div>
                  )}
                  {transferCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transferCount}{" "}
                          {transferCount === 1 ? "Transfer" : "Transfers"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Private transportation
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {pkg.description && (
                <DetailContent description={pkg.description} />
              )}

              {/* Included Items Section */}
              {items.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Included Experiences
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item: PackageItem, index: number) => {
                      if (item.type === "tour") {
                        const tour = toursMap.get(item.id);
                        if (!tour) return null;

                        const legacyImage =
                          Array.isArray(tour.images) && tour.images.length > 0
                            ? tour.images[0]
                            : null;

                        return (
                          <IncludedItemCard
                            key={index}
                            type="tour"
                            slug={tour.slug}
                            title={tour.title}
                            coverImagePath={tour.cover_image_path}
                            legacyImage={legacyImage}
                            region={tour.region}
                            duration_hours={tour.duration_hours}
                          />
                        );
                      } else if (item.type === "transfer") {
                        const transfer = transfersMap.get(item.id);
                        if (!transfer) return null;

                        const legacyImage =
                          Array.isArray(transfer.images) &&
                          transfer.images.length > 0
                            ? transfer.images[0]
                            : null;

                        return (
                          <IncludedItemCard
                            key={index}
                            type="transfer"
                            slug={transfer.slug}
                            title={transfer.title}
                            coverImagePath={transfer.cover_image_path}
                            legacyImage={legacyImage}
                            from_area={transfer.from_area}
                            to_area={transfer.to_area}
                            category={transfer.category}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                </section>
              )}

              {/* Gallery Section */}
              {galleryPaths.length > 0 && (
                <section>
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
                            alt={`${pkg.title} - Gallery ${index + 1}`}
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          />
                        </div>
                      ) : null;
                    })}
                  </div>
                </section>
              )}

              {/* Reviews Section */}
              <section className="mt-12">
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
                type="package"
                id={pkg.id}
                slug={pkg.slug}
                title={pkg.title}
                vehicleRates={vehicleRates}
                cardTitle="Book This Package"
              />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
