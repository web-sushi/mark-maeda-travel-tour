import PageHero from "@/components/ui/PageHero";
import TransfersBrowser from "@/components/transfers/TransfersBrowser";
import EmptyState from "@/components/listing/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/storage/publicUrl";
import { getStartingPrice, getCategoryLabel, getCategoryOrder } from "@/lib/transferUtils";

export const dynamic = "force-dynamic";

// Transfer data type for client component
interface TransferData {
  id: string;
  title: string;
  slug: string;
  from_area: string | null;
  to_area: string | null;
  category: string;
  pricing_model: string;
  price: number | null;
  imageUrl: string | null;
}

export default async function TransfersPage() {
  const supabase = await createClient();

  const { data: transfers, error } = await supabase
    .from("transfers")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transfers:", error);
  }

  // Pre-compute all data
  const transfersData: TransferData[] = [];
  const categoryLabels: Record<string, string> = {};
  const categoriesSet = new Set<string>();

  if (transfers) {
    transfers.forEach((transfer) => {
      const startingPrice = getStartingPrice(transfer.vehicle_rates);
      const price = startingPrice || transfer.base_price_jpy;
      const category = transfer.category || "other";
      
      // Image handling - support both cover_image_path and images array
      let imageUrl: string | null = null;
      
      // Priority 1: cover_image_path
      if (transfer.cover_image_path) {
        imageUrl = getPublicImageUrl(transfer.cover_image_path);
      }
      
      // Priority 2: first gallery image path
      if (!imageUrl && Array.isArray(transfer.gallery_image_paths) && transfer.gallery_image_paths.length > 0) {
        imageUrl = getPublicImageUrl(transfer.gallery_image_paths[0]);
      }
      
      // Priority 3: first image in images array
      if (!imageUrl && Array.isArray(transfer.images) && transfer.images.length > 0) {
        imageUrl = transfer.images[0];
      }

      transfersData.push({
        id: transfer.id,
        title: transfer.title,
        slug: transfer.slug,
        from_area: transfer.from_area,
        to_area: transfer.to_area,
        category,
        pricing_model: transfer.pricing_model || "fixed",
        price,
        imageUrl,
      });

      // Collect categories and labels
      categoriesSet.add(category);
      if (!categoryLabels[category]) {
        categoryLabels[category] = getCategoryLabel(category);
      }
    });
  }

  // Sort categories by predefined order
  const sortedCategories = Array.from(categoriesSet).sort(
    (a, b) => getCategoryOrder(a) - getCategoryOrder(b)
  );

  const hasTransfers = transfersData.length > 0;

  return (
    <>
      <PageHero
        title="Comfortable Private Transfers"
        subtitle="Reliable airport and city transfers across Japan."
        imageUrl="/images/transfers-hero.jpg"
      />

      {/* How it Works Section */}
      <div className="bg-white border-b mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold text-base sm:text-lg">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Book Your Transfer</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Choose your route and vehicle type
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold text-base sm:text-lg">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Meet Your Driver</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Driver will be waiting at the pickup point
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold text-base sm:text-lg">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Enjoy Your Ride</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Relax and arrive at your destination
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transfers Browser with Filter */}
      {hasTransfers ? (
        <TransfersBrowser
          transfers={transfersData}
          categoryLabels={categoryLabels}
          sortedCategories={sortedCategories}
        />
      ) : (
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EmptyState
              title="No transfers available"
              description="Check back soon for new transfer services."
            />
          </div>
        </div>
      )}
    </>
  );
}
