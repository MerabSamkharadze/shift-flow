import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getManagerSwapsData } from "@/lib/cache";
import { SwapsClient, type SwapRow } from "@/components/manager/swaps-client";

export default async function SwapsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "manager") redirect("/manager");

  const { swaps } = await getManagerSwapsData(profile.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Swap Requests</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Review and approve shift swap requests from your team.
        </p>
      </div>

      <SwapsClient swaps={swaps as SwapRow[]} />
    </div>
  );
}
