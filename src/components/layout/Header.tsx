import Link from "next/link";
import Image from "next/image";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createClient } from "@/lib/supabase/server";
import MobileMenu from "./MobileMenu";
import MobileCartButton from "./MobileCartButton";
import DesktopNav from "./DesktopNav";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIsAdmin = await isAdmin();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Brand */}
          <Link 
            href="/" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
          >
            <Image
              src="/images/company-logo.jpg"
              alt="Mark Maeda Travel and Tour"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover flex-shrink-0"
              priority
            />
            <span className="text-sm sm:text-base font-bold text-[#111827] truncate">
              Mark Maeda Travel and Tour
            </span>
          </Link>

          {/* Desktop Navigation */}
          <DesktopNav 
            isLoggedIn={!!user} 
            isAdmin={userIsAdmin} 
          />

          {/* Mobile: Cart + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <MobileCartButton />
            <MobileMenu 
              isLoggedIn={!!user} 
              isAdmin={userIsAdmin} 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
