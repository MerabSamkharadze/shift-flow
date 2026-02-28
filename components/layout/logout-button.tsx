"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "sf-role=; path=/; max-age=0";
    router.push("/auth/login");
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-[#F0EDE8] hover:bg-[#E8604C]/10 hover:text-[#E8604C] transition-all duration-150 ${
        loading ? "opacity-50 scale-95 cursor-not-allowed" : ""
      }`}
      style={{ fontFamily: "DM Sans, sans-serif" }}
      aria-label="Logout"
    >
      <i className={`ri-logout-box-line text-lg ${loading ? "animate-spin" : ""}`} />
      <span>{loading ? "Logging out..." : "Logout"}</span>
    </button>
  );
}
