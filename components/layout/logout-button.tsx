"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear the role cookie
    document.cookie = "sf-role=; path=/; max-age=0";
    router.push("/auth/login");
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        loading && "opacity-50 cursor-not-allowed",
      )}
    >
      <LogOut size={16} strokeWidth={2} />
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
