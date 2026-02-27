import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/ui/Button";
import TransfersTableClient from "@/components/admin/TransfersTableClient";

export const dynamic = "force-dynamic";

interface Transfer {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  from_area: string | null;
  to_area: string | null;
  base_price_jpy: number | null;
  status: string | null;
  display_order: number | null;
  created_at: string;
}

export default async function AdminTransfersPage() {
  const supabase = await createClient();

  const { data: transfers, error } = await supabase
    .from("transfers")
    .select("*")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin - Transfers</h1>
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Admin - Transfers</h1>
        <Link href="/admin/transfers/new">
          <Button>New Transfer</Button>
        </Link>
      </div>

      <TransfersTableClient initialTransfers={transfers || []} />
    </div>
  );
}
