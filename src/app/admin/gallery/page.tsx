import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/isAdmin";
import GalleryList from "@/components/admin/GalleryList";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: galleryItems } = await supabase
    .from("customer_gallery")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Gallery</h1>
        <p className="text-gray-600">Manage guest photos and testimonials</p>
      </div>

      <GalleryList initialItems={galleryItems || []} />
    </div>
  );
}
