import Container from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getPublicImageUrl } from "@/lib/storage/publicUrl";
import { getStartingPrice, formatJPY, getCategoryLabel } from "@/lib/transferUtils";
import BookingCard from "@/components/shared/BookingCard";
import RequestQuoteForm from "@/components/transfers/RequestQuoteForm";
import TransferDescription from "@/components/transfers/TransferDescription";
import SafeImage from "@/components/shared/SafeImage";
import RatingSummary from "@/components/reviews/RatingSummary";
import ReviewsList from "@/components/reviews/ReviewsList";

export const dynamic = "force-dynamic";

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: transfer, error } = await supabase
    .from("transfers")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !transfer) {
    notFound();
  }

  // Fetch reviews
  const { data: reviews } = await supabase
    .from("v_reviews_expanded")
    .select("*")
    .eq("item_type", "transfer")
    .eq("item_id", transfer.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  const reviewList = reviews || [];
  const totalReviews = reviewList.length;
  const averageRating =
    totalReviews > 0
      ? reviewList.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const route =
    transfer.from_area && transfer.to_area
      ? `${transfer.from_area} → ${transfer.to_area}`
      : transfer.from_area || transfer.to_area || "";
  const vehicleRates = transfer.vehicle_rates || null;
  const startingPrice = getStartingPrice(vehicleRates);
  const pricingModel = transfer.pricing_model || "fixed";
  const categoryLabel = transfer.category ? getCategoryLabel(transfer.category) : null;
  
  // Debug logging (remove after confirming images work)
  console.log("Transfer image fields:", {
    cover_image_path: transfer.cover_image_path,
    gallery_image_paths: transfer.gallery_image_paths,
    images: transfer.images,
  });
  
  // Handle images - support both cover_image_path and images array
  let coverUrl: string | null = null;
  
  // Priority 1: cover_image_path
  if (transfer.cover_image_path) {
    coverUrl = getPublicImageUrl(transfer.cover_image_path);
    console.log("Using cover_image_path:", coverUrl);
  }
  
  // Priority 2: first gallery image path
  if (!coverUrl && Array.isArray(transfer.gallery_image_paths) && transfer.gallery_image_paths.length > 0) {
    coverUrl = getPublicImageUrl(transfer.gallery_image_paths[0]);
    console.log("Using first gallery_image_path:", coverUrl);
  }
  
  // Priority 3: first image in images array
  if (!coverUrl && Array.isArray(transfer.images) && transfer.images.length > 0) {
    coverUrl = transfer.images[0];
    console.log("Using first images[] item:", coverUrl);
  }
  
  console.log("Final coverUrl:", coverUrl);
  
  // Gallery images - combine all sources
  const galleryUrls: string[] = [];
  
  // Add gallery_image_paths (converted to public URLs)
  if (Array.isArray(transfer.gallery_image_paths)) {
    transfer.gallery_image_paths.forEach((path: string) => {
      const url = getPublicImageUrl(path);
      if (url && url !== coverUrl) {
        galleryUrls.push(url);
      }
    });
  }
  
  // Add images array (skip the one used as cover)
  if (Array.isArray(transfer.images)) {
    transfer.images.forEach((img: string) => {
      if (img && img !== coverUrl && !galleryUrls.includes(img)) {
        galleryUrls.push(img);
      }
    });
  }
  
  console.log("Gallery URLs:", galleryUrls);

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="mb-8">
            {/* Cover Image with SafeImage component */}
            {coverUrl ? (
              <div className="w-full h-[400px] md:h-[500px] relative bg-gray-200 rounded-2xl overflow-hidden shadow-lg mb-6">
                <SafeImage
                  src={coverUrl}
                  alt={transfer.title}
                  className="w-full h-full object-cover"
                  fallbackSrc="/images/transfers-hero.jpg"
                />
              </div>
            ) : (
              <div className="w-full h-[400px] md:h-[500px] relative bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl overflow-hidden shadow-lg mb-6 flex items-center justify-center">
                <svg
                  className="w-24 h-24 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {transfer.title}
            </h1>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-3">
              {route && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {route}
                </span>
              )}
              {transfer.category && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                  {categoryLabel || transfer.category}
                </span>
              )}
              {pricingModel === "fixed" && startingPrice !== null && (
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
                  From {formatJPY(startingPrice)}
                </span>
              )}
              {pricingModel === "quote" && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Request Quote
                </span>
              )}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Content */}
            <div className="lg:col-span-2">
              <TransferDescription
                description={transfer.description || ""}
                notes={transfer.notes}
              />

              {/* Gallery Section */}
              {galleryUrls.length > 0 && (
                <section className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {galleryUrls.map((imageUrl: string, index: number) => (
                      <div
                        key={index}
                        className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden group"
                      >
                        <SafeImage
                          src={imageUrl}
                          alt={`${transfer.title} - Gallery ${index + 1}`}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          fallbackSrc="/images/transfers-hero.jpg"
                        />
                      </div>
                    ))}
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

            {/* Right column - Booking card or Quote form */}
            <div className="lg:col-span-1">
              {pricingModel === "quote" ? (
                <RequestQuoteForm
                  transferId={transfer.id}
                  transferTitle={transfer.title}
                />
              ) : (
                <BookingCard
                  type="transfer"
                  id={transfer.id}
                  slug={transfer.slug}
                  title={transfer.title}
                  vehicleRates={vehicleRates}
                  cardTitle="Book This Transfer"
                />
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
