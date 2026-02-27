import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/ui/Button";
import PackagesTableClient from "@/components/admin/PackagesTableClient";

export const dynamic = "force-dynamic";

interface Package {
  id: string;
  title: string;
  slug: string;
  region: string | null;
  items: any;
  base_price_jpy: number | null;
  status: string | null;
  display_order: number | null;
  created_at: string;
}

export default async function AdminPackagesPage() {
  const supabase = await createClient();

  const { data: packages, error } = await supabase
    .from("packages")
    .select("*")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin - Packages</h1>
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Admin - Packages</h1>
        <Link href="/admin/packages/new">
          <Button>New Package</Button>
        </Link>
      </div>

      <PackagesTableClient initialPackages={packages || []} />
    </div>
  );
}
