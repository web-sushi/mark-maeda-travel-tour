import PageHero from "@/components/ui/PageHero";
import ToursListClient from "@/components/listing/ToursListClient";
import EmptyState from "@/components/listing/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getLowestVehicleRate } from "@/types/vehicle";
import { getPublicImageUrl } from "@/lib/storage/publicUrl";

export const dynamic = "force-dynamic";

// Enhanced tour type with computed values
interface TourWithComputedData {
  id: string;
  title: string;
  slug: string;
  region: string | null;
  duration_hours: number | null;
  price: number | null;
  imageUrl: string | null;
  is_featured?: boolean;
  is_popular?: boolean;
  created_at?: string;
}

export default async function ToursPage() {
  const supabase = await createClient();
  
  // Fetch with safe column selection
  const { data: tours, error } = await supabase
    .from("tours")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  // Enhanced error logging
  if (error) {
    console.error("❌ Error fetching tours:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: error,
    });
  }

  // Pre-compute all data on the server
  const toursWithComputedData: TourWithComputedData[] = tours
    ? tours.map((tour) => {
        const lowestRate = getLowestVehicleRate(tour.vehicle_rates);
        const price = lowestRate || tour.base_price_jpy;
        const imageUrl = getPublicImageUrl(tour.cover_image_path);

        return {
          id: tour.id,
          title: tour.title,
          slug: tour.slug,
          region: tour.region,
          duration_hours: tour.duration_hours,
          price,
          imageUrl,
          is_featured: tour.is_featured || false,
          is_popular: tour.is_popular || false,
          created_at: tour.created_at,
        };
      })
    : [];

  console.log(`✅ Fetched ${toursWithComputedData.length} tours`);

  return (
    <>
      <PageHero
        title="Explore Private Japan Tours"
        subtitle="Handcrafted experiences led by local experts."
        imageUrl="/images/tours-hero.jpg"
      />

      {toursWithComputedData.length > 0 ? (
        <ToursListClient tours={toursWithComputedData} />
      ) : (
        <div className="py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EmptyState
              title="No tours available"
              description="Check back soon for new tours and experiences."
            />
          </div>
        </div>
      )}
    </>
  );
}
