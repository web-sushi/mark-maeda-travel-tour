import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface SuggestionItem {
  id: string;
  type: "tour" | "transfer" | "package";
  title: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  region?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    // Validation
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const supabase = await createClient();
    const searchPattern = `%${query.trim()}%`;
    const suggestions: SuggestionItem[] = [];

    // Search Tours (limit 5)
    const { data: tours } = await supabase
      .from("tours")
      .select("id, title, slug, description, region")
      .eq("status", "active")
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .limit(5);

    if (tours) {
      suggestions.push(
        ...tours.map((tour) => ({
          id: tour.id,
          type: "tour" as const,
          title: tour.title,
          slug: tour.slug,
          description: tour.description,
          region: tour.region,
        }))
      );
    }

    // Search Transfers (limit 5)
    const { data: transfers } = await supabase
      .from("transfers")
      .select("id, title, slug, description, category")
      .eq("status", "active")
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .limit(5);

    if (transfers) {
      suggestions.push(
        ...transfers.map((transfer) => ({
          id: transfer.id,
          type: "transfer" as const,
          title: transfer.title,
          slug: transfer.slug,
          description: transfer.description,
          category: transfer.category,
        }))
      );
    }

    // Search Packages (limit 5)
    const { data: packages } = await supabase
      .from("packages")
      .select("id, title, slug, description")
      .eq("status", "active")
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .limit(5);

    if (packages) {
      suggestions.push(
        ...packages.map((pkg) => ({
          id: pkg.id,
          type: "package" as const,
          title: pkg.title,
          slug: pkg.slug,
          description: pkg.description,
        }))
      );
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[Search Suggest] Error:", error);
    return NextResponse.json({ suggestions: [], error: "Search failed" }, { status: 500 });
  }
}
