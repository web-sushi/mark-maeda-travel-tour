import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/storage/publicUrl";

export interface ProductData {
  id: string;
  title: string;
  imageUrl: string | null;
  slug: string;
}

export interface EnrichedProductData {
  tours: Record<string, ProductData>;
  transfers: Record<string, ProductData>;
  packages: Record<string, ProductData>;
}

/**
 * Fetch product data (title, image) for cart items from the database
 * This ensures cart always shows the latest product information
 * 
 * @param tourIds Array of tour IDs to fetch
 * @param transferIds Array of transfer IDs to fetch
 * @param packageIds Array of package IDs to fetch
 * @returns Object with product data keyed by type and ID
 */
export async function fetchCartProductData(
  tourIds: string[],
  transferIds: string[],
  packageIds: string[]
): Promise<EnrichedProductData> {
  const supabase = await createClient();
  const result: EnrichedProductData = {
    tours: {},
    transfers: {},
    packages: {},
  };

  // Fetch tours
  if (tourIds.length > 0) {
    const { data: tours } = await supabase
      .from("tours")
      .select("id, title, slug, cover_image_path")
      .in("id", tourIds);

    if (tours) {
      tours.forEach((tour) => {
        result.tours[tour.id] = {
          id: tour.id,
          title: tour.title,
          slug: tour.slug,
          imageUrl: getPublicImageUrl(tour.cover_image_path),
        };
      });
    }
  }

  // Fetch transfers
  if (transferIds.length > 0) {
    const { data: transfers } = await supabase
      .from("transfers")
      .select("id, title, slug, cover_image_path")
      .in("id", transferIds);

    console.log('[Cart] Transfer data fetched:', transfers);

    if (transfers) {
      transfers.forEach((transfer) => {
        const imageUrl = getPublicImageUrl(transfer.cover_image_path);
        console.log(`[Cart] Transfer ${transfer.id} - cover_image_path: ${transfer.cover_image_path}, imageUrl: ${imageUrl}`);
        
        result.transfers[transfer.id] = {
          id: transfer.id,
          title: transfer.title,
          slug: transfer.slug,
          imageUrl,
        };
      });
    }
  }

  // Fetch packages
  if (packageIds.length > 0) {
    const { data: packages } = await supabase
      .from("packages")
      .select("id, title, slug, cover_image_path")
      .in("id", packageIds);

    if (packages) {
      packages.forEach((pkg) => {
        result.packages[pkg.id] = {
          id: pkg.id,
          title: pkg.title,
          slug: pkg.slug,
          imageUrl: getPublicImageUrl(pkg.cover_image_path),
        };
      });
    }
  }

  console.log('[Cart] Final result:', JSON.stringify(result, null, 2));

  return result;
}
