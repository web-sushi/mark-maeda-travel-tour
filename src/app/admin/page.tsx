import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface RecentItem {
  id: string;
  title: string;
  status: string | null;
  created_at: string;
}

export default async function AdminPage() {
  const supabase = await createClient();

  // Fetch counts in parallel
  const [
    activeToursResult,
    totalToursResult,
    activeTransfersResult,
    totalTransfersResult,
    activePackagesResult,
    totalPackagesResult,
    recentToursResult,
    recentTransfersResult,
    recentPackagesResult,
  ] = await Promise.all([
    supabase.from("tours").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tours").select("id", { count: "exact", head: true }),
    supabase
      .from("transfers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("transfers").select("id", { count: "exact", head: true }),
    supabase
      .from("packages")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("packages").select("id", { count: "exact", head: true }),
    supabase
      .from("tours")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("transfers")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("packages")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const activeToursCount = activeToursResult.count || 0;
  const totalToursCount = totalToursResult.count || 0;
  const activeTransfersCount = activeTransfersResult.count || 0;
  const totalTransfersCount = totalTransfersResult.count || 0;
  const activePackagesCount = activePackagesResult.count || 0;
  const totalPackagesCount = totalPackagesResult.count || 0;

  const recentTours = (recentToursResult.data || []) as RecentItem[];
  const recentTransfers = (recentTransfersResult.data || []) as RecentItem[];
  const recentPackages = (recentPackagesResult.data || []) as RecentItem[];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/admin/tours/new">
            <Button size="sm">New Tour</Button>
          </Link>
          <Link href="/admin/transfers/new">
            <Button size="sm">New Transfer</Button>
          </Link>
          <Link href="/admin/packages/new">
            <Button size="sm">New Package</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Tours</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{activeToursCount}</span>
            <span className="text-sm text-gray-500">active</span>
          </div>
          {totalToursCount > activeToursCount && (
            <p className="text-xs text-gray-500 mt-1">Total: {totalToursCount}</p>
          )}
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Transfers</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{activeTransfersCount}</span>
            <span className="text-sm text-gray-500">active</span>
          </div>
          {totalTransfersCount > activeTransfersCount && (
            <p className="text-xs text-gray-500 mt-1">Total: {totalTransfersCount}</p>
          )}
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Packages</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{activePackagesCount}</span>
            <span className="text-sm text-gray-500">active</span>
          </div>
          {totalPackagesCount > activePackagesCount && (
            <p className="text-xs text-gray-500 mt-1">Total: {totalPackagesCount}</p>
          )}
        </div>
      </div>

      {/* Recent Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Tours */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tours</h2>
            <Link href="/admin/tours" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
          {recentTours.length > 0 ? (
            <ul className="space-y-3">
              {recentTours.map((tour) => (
                <li key={tour.id}>
                  <Link
                    href={`/admin/tours/${tour.id}`}
                    className="block p-3 rounded border hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{tour.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          tour.status === "active"
                            ? "bg-green-100 text-green-800"
                            : tour.status === "off_season"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {tour.status || "N/A"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(tour.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No tours yet</p>
          )}
        </div>

        {/* Recent Transfers */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transfers</h2>
            <Link href="/admin/transfers" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
          {recentTransfers.length > 0 ? (
            <ul className="space-y-3">
              {recentTransfers.map((transfer) => (
                <li key={transfer.id}>
                  <Link
                    href={`/admin/transfers/${transfer.id}`}
                    className="block p-3 rounded border hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transfer.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          transfer.status === "active"
                            ? "bg-green-100 text-green-800"
                            : transfer.status === "off_season"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {transfer.status || "N/A"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(transfer.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No transfers yet</p>
          )}
        </div>

        {/* Recent Packages */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Packages</h2>
            <Link href="/admin/packages" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
          {recentPackages.length > 0 ? (
            <ul className="space-y-3">
              {recentPackages.map((pkg) => (
                <li key={pkg.id}>
                  <Link
                    href={`/admin/packages/${pkg.id}`}
                    className="block p-3 rounded border hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{pkg.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          pkg.status === "active"
                            ? "bg-green-100 text-green-800"
                            : pkg.status === "off_season"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {pkg.status || "N/A"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(pkg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No packages yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
