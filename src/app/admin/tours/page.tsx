import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/ui/Button";
import ToursTableClient from "@/components/admin/ToursTableClient";

export const dynamic = "force-dynamic";

interface Tour {
  id: string;
  title: string;
  slug: string;
  region: string | null;
  duration_hours: number | null;
  base_price_jpy: number | null;
  status: string | null;
  display_order: number | null;
  created_at: string;
  is_featured: boolean | null;
  featured_rank: number | null;
}

export default async function AdminToursPage() {
  const supabase = await createClient();

  const { data: tours, error } = await supabase
    .from("tours")
    .select("*")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin - Tours</h1>
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Admin - Tours</h1>
        <Link href="/admin/tours/new">
          <Button>New Tour</Button>
        </Link>
      </div>

      <ToursTableClient initialTours={tours || []} />
    </div>
  );
}
