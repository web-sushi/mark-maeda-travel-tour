"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AdminNav() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    }
    getUser();
  }, []);

  const isActive = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }
    return pathname?.startsWith(path);
  };

  const linkClass = (path: string) =>
    `font-medium transition-colors ${
      isActive(path)
        ? "text-[#E4005A] border-b-2 border-[#E4005A]"
        : "text-gray-700 hover:text-gray-900"
    }`;

  return (
    <nav className="border-b mb-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex gap-6">
            <Link href="/admin" className={linkClass("/admin")}>
              Overview
            </Link>
            <Link href="/admin/tours" className={linkClass("/admin/tours")}>
              Tours
            </Link>
            <Link href="/admin/transfers" className={linkClass("/admin/transfers")}>
              Transfers
            </Link>
            <Link href="/admin/bookings" className={linkClass("/admin/bookings")}>
              Bookings
            </Link>
            <Link href="/admin/reviews" className={linkClass("/admin/reviews")}>
              Reviews
            </Link>
            <Link href="/admin/gallery" className={linkClass("/admin/gallery")}>
              Gallery
            </Link>
            <Link href="/admin/settings" className={linkClass("/admin/settings")}>
              Settings
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-sm text-gray-600">Signed in as {userEmail}</span>
            )}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
