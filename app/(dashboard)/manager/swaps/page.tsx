import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  // Step 1: Groups owned by this manager
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name")
    .eq("manager_id", profile.id);

  const groupIds = (groups ?? []).map((g) => g.id);

  if (groupIds.length === 0) {
    return <SwapsClient swaps={[]} />;
  }

  // Step 2: Schedules for those groups
  const { data: schedules } = await supabase
    .from("schedules")
    .select("id, group_id")
    .in("group_id", groupIds);

  const scheduleIds = (schedules ?? []).map((s) => s.id);

  if (scheduleIds.length === 0) {
    return <SwapsClient swaps={[]} />;
  }

  // Step 3: Shifts in those schedules
  const { data: shifts } = await supabase
    .from("shifts")
    .select("id, schedule_id, date, start_time, end_time")
    .in("schedule_id", scheduleIds);

  const shiftIds = (shifts ?? []).map((s) => s.id);

  if (shiftIds.length === 0) {
    return <SwapsClient swaps={[]} />;
  }

  // Step 4: Swap requests for those shifts
  const { data: swaps } = await supabase
    .from("shift_swaps")
    .select(
      "id, shift_id, from_user_id, to_user_id, accepted_by, type, status, manager_notes, requested_at",
    )
    .in("shift_id", shiftIds)
    .order("requested_at", { ascending: false });

  if (!swaps || swaps.length === 0) {
    return <SwapsClient swaps={[]} />;
  }

  // Step 5: Fetch all involved users
  const userIds = [
    ...new Set([
      ...swaps.map((s) => s.from_user_id),
      ...swaps.map((s) => s.to_user_id).filter((id): id is string => id !== null),
      ...swaps.map((s) => s.accepted_by).filter((id): id is string => id !== null),
    ]),
  ];

  const { data: users } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .in("id", userIds);

  // Build lookup maps
  const userMap = new Map(
    (users ?? []).map((u) => [u.id, `${u.first_name} ${u.last_name}`]),
  );

  const shiftMap = new Map(
    (shifts ?? []).map((s) => ({
      ...s,
      groupId: (schedules ?? []).find((sc) => sc.id === s.schedule_id)
        ?.group_id,
    })).map((s) => [s.id, s]),
  );

  const groupMap = new Map((groups ?? []).map((g) => [g.id, g.name]));

  // Merge into SwapRow[]
  const rows: SwapRow[] = swaps.map((s) => {
    const shift = shiftMap.get(s.shift_id)!;
    const groupId = shift?.groupId ?? "";

    return {
      id: s.id,
      type: s.type as SwapRow["type"],
      status: s.status as SwapRow["status"],
      createdAt: s.requested_at??'',
      managerNote: s.manager_notes,
      shiftDate: shift?.date ?? "",
      shiftStart: shift?.start_time ?? "",
      shiftEnd: shift?.end_time ?? "",
      groupName: groupMap.get(groupId) ?? "",
      requesterName: userMap.get(s.from_user_id) ?? "Unknown",
      recipientName: (s.to_user_id ?? s.accepted_by)
        ? (userMap.get(s.to_user_id ?? s.accepted_by ?? "") ?? "Unknown")
        : null,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Swap Requests</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Review and approve shift swap requests from your team.
        </p>
      </div>

      <SwapsClient swaps={rows} />
    </div>
  );
}
