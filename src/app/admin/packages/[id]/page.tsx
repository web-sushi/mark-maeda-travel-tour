import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PackageForm from "@/components/admin/PackageForm";
import { Package } from "@/types/package";

export default async function AdminPackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  let initialData: Package | null = null;

  if (!isNew) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("packages")
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
          description: data.description,
          region: data.region,
          items: Array.isArray(data.items) ? data.items : [],
          base_price_jpy: data.base_price_jpy || 0,
          vehicle_rates: data.vehicle_rates || { v8: 0, v10: 0, v14: 0, coaster: 0, bigbus: 0 },
          status: (data.status as "active" | "off_season" | "archived") || "active",
          images: Array.isArray(data.images) ? data.images : [],
          display_order: data.display_order || 0,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    } catch (error) {
      // Error will be handled by the form component
      console.error("Failed to fetch package:", error);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/packages"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Packages
        </Link>
        <h1 className="text-4xl font-bold text-gray-900">
          {isNew ? "New Package" : "Edit Package"}
        </h1>
      </div>

      <PackageForm
        mode={isNew ? "new" : "edit"}
        packageId={isNew ? undefined : id}
        initialData={initialData}
      />
    </div>
  );
}
