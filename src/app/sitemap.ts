import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://markmaedatravelandtour.com";

const STATIC_ROUTES = [
  "",
  "tours",
  "transfers",
  "reviews",
  "booking/track",
  "privacy",
  "terms",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: path ? `${BASE_URL}/${path}` : BASE_URL,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));

  const dynamicEntries: MetadataRoute.Sitemap = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const [toursRes, transfersRes] = await Promise.all([
      supabase
        .from("tours")
        .select("slug, updated_at")
        .eq("status", "active"),
      supabase
        .from("transfers")
        .select("slug, updated_at")
        .eq("status", "active"),
    ]);

    if (toursRes.data) {
      for (const row of toursRes.data) {
        const slug = row.slug;
        if (slug) {
          dynamicEntries.push({
            url: `${BASE_URL}/tours/${slug}`,
            lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    }

    if (transfersRes.data) {
      for (const row of transfersRes.data) {
        const slug = row.slug;
        if (slug) {
          dynamicEntries.push({
            url: `${BASE_URL}/transfers/${slug}`,
            lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    }
  }

  return [...staticEntries, ...dynamicEntries];
}
