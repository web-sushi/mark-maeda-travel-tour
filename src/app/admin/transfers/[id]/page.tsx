import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TransferForm from "@/components/admin/TransferForm";
import { Transfer } from "@/types/transfer";

export default async function AdminTransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  let initialData: Transfer | null = null;

  if (!isNew) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("transfers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        initialData = {
          id: data.id,
          slug: data.slug || "",
          title: data.title || "",
          short_description: data.short_description || null,
          description: data.description || null,
          category: data.category || "",
          from_area: data.from_area,
          to_area: data.to_area,
          base_price_jpy: data.base_price_jpy || 0,
          vehicle_rates: data.vehicle_rates || { v8: 0, v10: 0, v14: 0, coaster: 0, bigbus: 0 },
          notes: data.notes,
          status: (data.status as "active" | "off_season" | "archived") || "active",
          cover_image_path: data.cover_image_path || null,
          images: Array.isArray(data.images) ? data.images : [],
          display_order: data.display_order || 0,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        
        // Debug log to verify fields are loaded
        console.log("[Admin Transfer Edit] Fetched transfer data:", {
          id: data.id,
          title: data.title,
          short_description: data.short_description,
          description: data.description,
          cover_image_path: data.cover_image_path,
          hasShortDesc: !!data.short_description,
          hasDescription: !!data.description,
          hasCoverImage: !!data.cover_image_path,
        });
      }
    } catch (error) {
      // Error will be handled by the form component
      console.error("Failed to fetch transfer:", error);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/transfers"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Transfers
        </Link>
        <h1 className="text-4xl font-bold text-gray-900">
          {isNew ? "New Transfer" : "Edit Transfer"}
        </h1>
      </div>

      <TransferForm
        mode={isNew ? "new" : "edit"}
        transferId={isNew ? undefined : id}
        initialData={initialData}
      />
    </div>
  );
}
