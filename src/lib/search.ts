import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: "tour" | "transfer" | "package";
  cover_image_path: string | null;
  base_price_jpy: number | null;
  vehicle_rates: any;
  region?: string | null;
  category?: string | null;
  duration_days?: number | null;
  duration_hours?: number | null;
  total_price_jpy?: number | null;
  from_area?: string | null;
  to_area?: string | null;
}

export async function runSearch(
  query: string,
  type: "all" | "tours" | "transfers" | "packages"
): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const supabase = await createClient();
  const results: SearchResult[] = [];
  const searchPattern = `%${query.trim()}%`;

  if (process.env.NODE_ENV === "development") {
    console.log("[Search] Query:", query, "Type:", type);
  }

  try {
    // Search Tours
    if (type === "all" || type === "tours") {
      const { data: tours, error } = await supabase
        .from("tours")
        .select("*")
        .eq("status", "active")
        .or(`title.ilike.${searchPattern},description.ilike.${searchPattern},region.ilike.${searchPattern}`)
        .limit(20);

      if (error) {
        console.error("[Search] Tours error:", error);
      } else if (tours) {
        results.push(
          ...tours.map((tour) => ({
            id: tour.id,
            title: tour.title,
            slug: tour.slug,
            description: tour.description,
            type: "tour" as const,
            cover_image_path: tour.cover_image_path,
            base_price_jpy: tour.base_price_jpy,
            vehicle_rates: tour.vehicle_rates,
            region: tour.region,
            duration_hours: tour.duration_hours,
          }))
        );
      }
    }

    // Search Transfers
    if (type === "all" || type === "transfers") {
      const { data: transfers, error } = await supabase
        .from("transfers")
        .select("*")
        .eq("status", "active")
        .or(`title.ilike.${searchPattern},description.ilike.${searchPattern},from_area.ilike.${searchPattern},to_area.ilike.${searchPattern},category.ilike.${searchPattern}`)
        .limit(20);

      if (error) {
        console.error("[Search] Transfers error:", error);
      } else if (transfers) {
        results.push(
          ...transfers.map((transfer) => ({
            id: transfer.id,
            title: transfer.title,
            slug: transfer.slug,
            description: transfer.description,
            type: "transfer" as const,
            cover_image_path: transfer.cover_image_path,
            base_price_jpy: transfer.base_price_jpy,
            vehicle_rates: transfer.vehicle_rates,
            category: transfer.category,
            from_area: transfer.from_area,
            to_area: transfer.to_area,
          }))
        );
      }
    }

    // Search Packages
    if (type === "all" || type === "packages") {
      const { data: packages, error } = await supabase
        .from("packages")
        .select("*")
        .eq("status", "active")
        .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
        .limit(20);

      if (error) {
        console.error("[Search] Packages error:", error);
      } else if (packages) {
        results.push(
          ...packages.map((pkg) => ({
            id: pkg.id,
            title: pkg.title,
            slug: pkg.slug,
            description: pkg.description,
            type: "package" as const,
            cover_image_path: pkg.cover_image_path,
            base_price_jpy: null,
            vehicle_rates: null,
            duration_days: pkg.duration_days,
            total_price_jpy: pkg.total_price_jpy,
          }))
        );
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[Search] Results found:", results.length);
    }

    return results;
  } catch (error) {
    console.error("[Search] Unexpected error:", error);
    return [];
  }
}
