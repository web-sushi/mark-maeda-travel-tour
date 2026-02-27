import { requireAdmin } from "@/lib/auth/requireAdmin";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

// TODO: Supabase Auth Settings Checklist:
// 1. In Supabase Dashboard → Authentication → URL Configuration:
//    - Add Redirect URL: http://localhost:3000/auth/callback
//    - Set Site URL: http://localhost:3000
// 2. For production, add your production domain URLs as well

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth guard: require admin or redirect to home
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
