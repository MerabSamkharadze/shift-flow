"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        "text-muted-foreground dark:text-[#F0EDE8] hover:bg-accent dark:hover:bg-[#E8604C]/10 dark:hover:text-[#E8604C]",
        loading && "opacity-50 scale-95 cursor-not-allowed",
      )}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <LogOut size={16} strokeWidth={2} />
      )}
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
