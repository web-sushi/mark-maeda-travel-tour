import PageHero from "@/components/ui/PageHero";
import PackagesListClient from "@/components/listing/PackagesListClient";
import EmptyState from "@/components/listing/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getLowestVehicleRate } from "@/types/vehicle";
import { getPublicImageUrl } from "@/lib/storage/publicUrl";

export const dynamic = "force-dynamic";

// Enhanced package type with computed values
interface PackageWithComputedData {
  id: string;
  title: string;
  slug: string;
  region: string | null;
  items: any;
  price: number | null; // Pre-computed
  imageUrl: string | null; // Pre-computed
}

export default async function PackagesPage() {
  const supabase = await createClient();

  const { data: packages, error } = await supabase
    .from("packages")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching packages:", error);
  }

  // Pre-compute all data on the server
  const packagesWithComputedData: PackageWithComputedData[] = packages
    ? packages.map((pkg) => {
        const lowestRate = getLowestVehicleRate(pkg.vehicle_rates);
        const imageUrl = getPublicImageUrl(pkg.cover_image_path);

        return {
          id: pkg.id,
          title: pkg.title,
          slug: pkg.slug,
          region: pkg.region,
          items: pkg.items,
          price: lowestRate,
          imageUrl,
        };
      })
    : [];

  return (
    <>
      <PageHero
        title="All-In-One Travel Packages"
        subtitle="Multi-day journeys designed for unforgettable memories."
        imageUrl="/images/packages-hero.jpg"
      />

      {packagesWithComputedData.length > 0 ? (
        <PackagesListClient packages={packagesWithComputedData} />
      ) : (
        <div className="py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EmptyState
              title="No packages available"
              description="Check back soon for new package deals."
            />
          </div>
        </div>
      )}
    </>
  );
}
