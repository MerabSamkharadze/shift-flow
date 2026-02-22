import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  SwapsClient,
  type MySwapRow,
  type IncomingSwapRow,
  type PublicSwapRow,
  type MyClaimRow,
} from "@/components/employee/swaps-client";

export const dynamic = "force-dynamic";

export default async function EmployeeSwapsPage() {
  const supabase = createClient();
  const service = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/signout");
  if (profile.role !== "employee") redirect(`/${profile.role}`);

  // ── 1. My group memberships ────────────────────────────────────────────────
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", profile.id);

  const myGroupIds = (myMemberships ?? []).map((m) => m.group_id);

  // ── 2. My swap requests (giveaways I initiated) ───────────────────────────
  const { data: mySwapRows } = await service
    .from("shift_swaps")
    .select("id, shift_id, to_user_id, accepted_by, type, status, requested_at")
    .eq("from_user_id", profile.id)
    .order("requested_at", { ascending: false });

  // ── 3. Incoming direct swap requests (pending, I am recipient) ────────────
  const { data: incomingRows } = await service
    .from("shift_swaps")
    .select("id, shift_id, from_user_id, requested_at")
    .eq("to_user_id", profile.id)
    .eq("type", "direct")
    .eq("status", "pending_employee")
    .order("requested_at", { ascending: false });

  // ── 4. Public board — open public swaps in my groups (not mine) ───────────
  const { data: publicSwapRows } = myGroupIds.length
    ? await service
        .from("shift_swaps")
        .select("id, shift_id, from_user_id, requested_at")
        .eq("type", "public")
        .eq("status", "pending_employee")
        .neq("from_user_id", profile.id)
        .order("requested_at", { ascending: false })
    : { data: [] as { id: string; shift_id: string; from_user_id: string; requested_at: string }[] };

  // ── 5. My claims — public swaps I already claimed (accepted_by = me) ──────
  const { data: myClaimRows } = await service
    .from("shift_swaps")
    .select("id, shift_id, from_user_id, status, requested_at")
    .eq("accepted_by", profile.id)
    .eq("type", "public")
    .in("status", ["accepted_by_employee", "pending_manager", "approved", "rejected_by_manager"])
    .order("requested_at", { ascending: false });

  // ── 6. Collect all shift IDs ──────────────────────────────────────────────
  const allShiftIds = [
    ...new Set([
      ...(mySwapRows ?? []).map((s) => s.shift_id),
      ...(incomingRows ?? []).map((s) => s.shift_id),
      ...(publicSwapRows ?? []).map((s) => s.shift_id),
      ...(myClaimRows ?? []).map((s) => s.shift_id),
    ]),
  ];

  const { data: shifts } = allShiftIds.length
    ? await service
        .from("shifts")
        .select("id, schedule_id, date, start_time, end_time")
        .in("id", allShiftIds)
    : { data: [] as { id: string; schedule_id: string; date: string; start_time: string; end_time: string }[] };

  // ── 7. Schedule → group lookup ────────────────────────────────────────────
  const scheduleIds = [...new Set((shifts ?? []).map((s) => s.schedule_id))];

  const { data: schedules } = scheduleIds.length
    ? await service
        .from("schedules")
        .select("id, group_id")
        .in("id", scheduleIds)
    : { data: [] as { id: string; group_id: string }[] };

  const scheduleGroupMap = new Map(
    (schedules ?? []).map((s) => [s.id, s.group_id]),
  );

  const groupIds = [...new Set((schedules ?? []).map((s) => s.group_id))];

  const { data: groups } = groupIds.length
    ? await service
        .from("groups")
        .select("id, name, color")
        .in("id", groupIds)
    : { data: [] as { id: string; name: string; color: string }[] };

  const groupMap = new Map(
    (groups ?? []).map((g) => [g.id, { name: g.name, color: g.color }]),
  );

  // Build shift info map
  const shiftMap = new Map(
    (shifts ?? []).map((s) => {
      const groupId = scheduleGroupMap.get(s.schedule_id) ?? "";
      const group = groupMap.get(groupId) ?? { name: "", color: "#6366f1" };
      return [
        s.id,
        {
          date: s.date,
          startTime: s.start_time,
          endTime: s.end_time,
          groupName: group.name,
          groupColor: group.color,
        },
      ];
    }),
  );

  // Filter public swaps to only those in my groups
  const filteredPublicSwaps = (publicSwapRows ?? []).filter((swap) => {
    const shift = shifts?.find((s) => s.id === swap.shift_id);
    if (!shift) return false;
    const groupId = scheduleGroupMap.get(shift.schedule_id);
    return groupId ? myGroupIds.includes(groupId) : false;
  });

  // ── 8. Collect all user IDs we need names for ─────────────────────────────
  const allUserIds = [
    ...new Set([
      ...(mySwapRows ?? [])
        .map((s) => s.to_user_id)
        .filter((id): id is string => id !== null),
      ...(mySwapRows ?? [])
        .map((s) => s.accepted_by)
        .filter((id): id is string => id !== null),
      ...(incomingRows ?? []).map((s) => s.from_user_id),
      ...filteredPublicSwaps.map((s) => s.from_user_id),
      ...(myClaimRows ?? []).map((s) => s.from_user_id),
    ]),
  ];

  const { data: userRows } = allUserIds.length
    ? await service
        .from("users")
        .select("id, first_name, last_name")
        .in("id", allUserIds)
    : { data: [] as { id: string; first_name: string; last_name: string }[] };

  const userMap = new Map(
    (userRows ?? []).map((u) => [
      u.id,
      `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
    ]),
  );

  // ── Assemble props ────────────────────────────────────────────────────────
  const emptyShift = { date: "", startTime: "", endTime: "", groupName: "", groupColor: "#6366f1" };

  const mySwaps: MySwapRow[] = (mySwapRows ?? []).map((s) => {
    const shift = shiftMap.get(s.shift_id) ?? emptyShift;
    return {
      id: s.id,
      type: s.type as "direct" | "public",
      status: s.status,
      createdAt: s.requested_at ?? "",
      shiftDate: shift.date,
      shiftStart: shift.startTime,
      shiftEnd: shift.endTime,
      groupName: shift.groupName,
      groupColor: shift.groupColor,
      recipientName: (s.to_user_id ?? s.accepted_by)
        ? (userMap.get(s.to_user_id ?? s.accepted_by ?? "") ?? null)
        : null,
    };
  });

  const incoming: IncomingSwapRow[] = (incomingRows ?? []).map((s) => {
    const shift = shiftMap.get(s.shift_id) ?? emptyShift;
    return {
      id: s.id,
      requesterName: userMap.get(s.from_user_id) ?? "Unknown",
      shiftDate: shift.date,
      shiftStart: shift.startTime,
      shiftEnd: shift.endTime,
      groupName: shift.groupName,
      groupColor: shift.groupColor,
      createdAt: s.requested_at ?? "",
    };
  });

  const publicBoard: PublicSwapRow[] = filteredPublicSwaps.map((s) => {
    const shift = shiftMap.get(s.shift_id) ?? emptyShift;
    return {
      id: s.id,
      requesterName: userMap.get(s.from_user_id) ?? "Unknown",
      shiftDate: shift.date,
      shiftStart: shift.startTime,
      shiftEnd: shift.endTime,
      groupName: shift.groupName,
      groupColor: shift.groupColor,
      createdAt: s.requested_at ?? "",
    };
  });

  const myClaims: MyClaimRow[] = (myClaimRows ?? []).map((s) => {
    const shift = shiftMap.get(s.shift_id) ?? emptyShift;
    return {
      id: s.id,
      originalOwnerName: userMap.get(s.from_user_id) ?? "Unknown",
      shiftDate: shift.date,
      shiftStart: shift.startTime,
      shiftEnd: shift.endTime,
      groupName: shift.groupName,
      groupColor: shift.groupColor,
      status: s.status,
      claimedAt: s.requested_at ?? "",
    };
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Swap Requests</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Pick up open shifts or manage your swap requests.
        </p>
      </div>

      <SwapsClient
        mySwaps={mySwaps}
        incoming={incoming}
        publicBoard={publicBoard}
        myClaims={myClaims}
      />
    </div>
  );
}
