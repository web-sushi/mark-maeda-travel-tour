"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface CustomerLogoutButtonProps {
  variant?: "link" | "button";
  className?: string;
}

export default function CustomerLogoutButton({
  variant = "link",
  className,
}: CustomerLogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    
    try {
      await supabase.auth.signOut();
      router.refresh();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false);
    }
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className={
          className ||
          "px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        }
      >
        {loading ? "Logging out..." : "Logout"}
      </button>
    );
  }

  // Link variant (for navbar)
  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={
        className ||
        "px-3 py-2 text-sm font-medium text-[#111827] hover:text-[#E4005A] hover:bg-[#F8F9FC] rounded-lg transition-all disabled:opacity-50"
      }
    >
      {loading ? "..." : "Logout"}
    </button>
  );
}
