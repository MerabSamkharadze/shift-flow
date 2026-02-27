import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

// ─── Manager Employees ───────────────────────────────────────────────────────

export const getManagerEmployeesData = unstable_cache(
  async (managerId: string) => {
    const service = createServiceClient();

    const { data: employees } = await service
      .from("users")
      .select(
        "id, first_name, last_name, email, is_active, must_change_password, created_at",
      )
      .eq("created_by", managerId)
      .eq("role", "employee")
      .order("created_at", { ascending: false });

    const employeeIds = (employees ?? []).map((e) => e.id);

    const groupsByEmployee = new Map<
      string,
      { id: string; name: string; color: string }[]
    >();

    if (employeeIds.length > 0) {
      const { data: memberships } = await service
        .from("group_members")
        .select("user_id, groups(id, name, color)")
        .in("user_id", employeeIds);

      for (const m of memberships ?? []) {
        const g = m.groups as { id: string; name: string; color: string } | null;
        if (!g) continue;
        const list = groupsByEmployee.get(m.user_id) ?? [];
        list.push(g);
        groupsByEmployee.set(m.user_id, list);
      }
    }

    const rows = (employees ?? []).map((e) => ({
      id: e.id,
      firstName: e.first_name ?? "",
      lastName: e.last_name ?? "",
      email: e.email,
      isActive: e.is_active,
      mustChangePassword: e.must_change_password,
      createdAt: e.created_at ?? "",
      groups: groupsByEmployee.get(e.id) ?? [],
    }));

    return { rows };
  },
  ["manager-employees"],
  { tags: ["manager-employees"], revalidate: 30 },
);

// ─── Manager Groups List (lightweight) ───────────────────────────────────────

export const getManagerGroupsList = unstable_cache(
  async (managerId: string) => {
    const service = createServiceClient();

    const { data: groups } = await service
      .from("groups")
      .select("id, name, color")
      .eq("manager_id", managerId)
      .order("name");

    return { groups: (groups ?? []).map((g) => ({ id: g.id, name: g.name, color: g.color })) };
  },
  ["manager-groups-list"],
  { tags: ["manager-groups"], revalidate: 30 },
);

// ─── Owner Dashboard ──────────────────────────────────────────────────────────

export const getOwnerDashboardData = unstable_cache(
  async (companyId: string) => {
    const service = createServiceClient();

    // Layer 1: all independent queries
    const [
      { count: managerCount },
      { count: employeeCount },
      { count: groupCount },
      { data: companyGroups },
      { data: managersData },
      { data: activityLogs },
    ] = await Promise.all([
      service
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("role", "manager")
        .eq("is_active", true),
      service
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("role", "employee")
        .eq("is_active", true),
      service
        .from("groups")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true),
      service
        .from("groups")
        .select("id")
        .eq("company_id", companyId),
      service
        .from("users")
        .select(
          "id, first_name, last_name, email, is_active, must_change_password, created_at",
        )
        .eq("company_id", companyId)
        .eq("role", "manager")
        .order("created_at", { ascending: false })
        .limit(6),
      service
        .from("activity_logs")
        .select("id, user_id, action, entity_type, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const managers = (managersData ?? []).map((m) => ({
      ...m,
      first_name: m.first_name ?? "",
      last_name: m.last_name ?? "",
      status: (!m.is_active
        ? "inactive"
        : m.must_change_password
          ? "pending"
          : "active") as "active" | "pending" | "inactive",
    }));

    // Layer 2: swap chain
    const companyGroupIds = (companyGroups ?? []).map((g) => g.id);

    const { data: companySchedules } = companyGroupIds.length
      ? await service
          .from("schedules")
          .select("id")
          .in("group_id", companyGroupIds)
      : { data: [] as { id: string }[] };

    const companyScheduleIds = (companySchedules ?? []).map((s) => s.id);

    const { data: companyShifts } = companyScheduleIds.length
      ? await service
          .from("shifts")
          .select("id")
          .in("schedule_id", companyScheduleIds)
      : { data: [] as { id: string }[] };

    const companyShiftIds = (companyShifts ?? []).map((s) => s.id);

    const { data: pendingSwaps, count: pendingSwapCount } = companyShiftIds.length
      ? await service
          .from("shift_swaps")
          .select(
            "id, shift_id, from_user_id, to_user_id, accepted_by, requested_at",
            { count: "exact" },
          )
          .in("shift_id", companyShiftIds)
          .in("status", ["accepted_by_employee", "pending_manager"])
          .order("requested_at", { ascending: false })
          .limit(5)
      : {
          data: [] as {
            id: string;
            shift_id: string;
            from_user_id: string;
            to_user_id: string | null;
            accepted_by: string | null;
            requested_at: string | null;
          }[],
          count: 0,
        };

    // Layer 3: user names for swaps + activity
    const swapUserIds = [
      ...(pendingSwaps ?? []).map((s) => s.from_user_id),
      ...(pendingSwaps ?? [])
        .map((s) => s.to_user_id)
        .filter((id): id is string => id !== null),
      ...(pendingSwaps ?? [])
        .map((s) => s.accepted_by)
        .filter((id): id is string => id !== null),
    ];
    const actorIds = (activityLogs ?? []).map((l) => l.user_id);
    const allNeededUserIds = [...new Set([...swapUserIds, ...actorIds])];

    const { data: allNeededUsers } = allNeededUserIds.length
      ? await service
          .from("users")
          .select("id, first_name, last_name")
          .in("id", allNeededUserIds)
      : {
          data: [] as {
            id: string;
            first_name: string | null;
            last_name: string | null;
          }[],
        };

    const userNameMap = Object.fromEntries(
      (allNeededUsers ?? []).map((u) => [
        u.id,
        `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
      ]),
    );

    return {
      managerCount: managerCount ?? 0,
      employeeCount: employeeCount ?? 0,
      groupCount: groupCount ?? 0,
      managers,
      pendingSwaps: pendingSwaps ?? [],
      pendingSwapCount: pendingSwapCount ?? 0,
      activityLogs: activityLogs ?? [],
      userNameMap,
    };
  },
  ["owner-dashboard"],
  { tags: ["owner-dashboard"], revalidate: 30 },
);

// ─── Owner Managers ───────────────────────────────────────────────────────────

export const getOwnerManagersData = unstable_cache(
  async (companyId: string) => {
    const service = createServiceClient();

    const { data: managersData } = await service
      .from("users")
      .select(
        "id, first_name, last_name, email, is_active, must_change_password, created_at",
      )
      .eq("company_id", companyId)
      .eq("role", "manager")
      .order("created_at", { ascending: false });

    const managers = (managersData ?? []).map((m) => ({
      ...m,
      first_name: m.first_name ?? "",
      last_name: m.last_name ?? "",
    }));

    return { managers };
  },
  ["owner-managers"],
  { tags: ["owner-managers"], revalidate: 30 },
);

// ─── Manager Dashboard ────────────────────────────────────────────────────────

export const getManagerDashboardData = unstable_cache(
  async (managerId: string) => {
    const service = createServiceClient();

    // 1. Groups + employee count
    const [{ data: groups }, { count: employeeCount }] = await Promise.all([
      service
        .from("groups")
        .select("id, name, color")
        .eq("manager_id", managerId),
      service
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("created_by", managerId)
        .eq("role", "employee")
        .eq("is_active", true),
    ]);

    const groupIds = (groups ?? []).map((g) => g.id);

    // 2. Schedules
    const { data: schedules } = groupIds.length
      ? await service
          .from("schedules")
          .select("id, group_id, status")
          .in("group_id", groupIds)
      : { data: [] as { id: string; group_id: string; status: string }[] };

    const scheduleIds = (schedules ?? []).map((s) => s.id);
    const publishedCount = (schedules ?? []).filter(
      (s) => s.status === "published",
    ).length;

    // 3. All shifts
    const { data: allShifts } = scheduleIds.length
      ? await service
          .from("shifts")
          .select("id, schedule_id, date, start_time, end_time, assigned_to")
          .in("schedule_id", scheduleIds)
      : { data: [] as { id: string; schedule_id: string; date: string; start_time: string; end_time: string; assigned_to: string | null }[] };

    const allShiftIds = (allShifts ?? []).map((s) => s.id);

    // 4. Pending swaps
    const { data: pendingSwaps, count: pendingCount } = allShiftIds.length
      ? await service
          .from("shift_swaps")
          .select("id, shift_id, from_user_id, to_user_id, accepted_by, requested_at", {
            count: "exact",
          })
          .in("shift_id", allShiftIds)
          .in("status", ["accepted_by_employee", "pending_manager"])
          .order("requested_at", { ascending: false })
          .limit(3)
      : { data: [], count: 0 };

    // Lookup maps
    const scheduleGroupMap = Object.fromEntries(
      (schedules ?? []).map((s) => [s.id, s.group_id]),
    );
    const groupNameMap = Object.fromEntries(
      (groups ?? []).map((g) => [g.id, g.name]),
    );
    const groupColorMap = Object.fromEntries(
      (groups ?? []).map((g) => [g.id, g.color]),
    );
    const shiftDateMap = Object.fromEntries(
      (allShifts ?? []).map((s) => [s.id, s.date]),
    );

    // Today's shifts
    const _d = new Date();
    const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, "0")}-${String(_d.getDate()).padStart(2, "0")}`;
    const todayShifts = (allShifts ?? [])
      .filter((s) => s.date === today)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    // 5. User names
    const todayUserIds = todayShifts.map((s) => s.assigned_to).filter(Boolean) as string[];
    const swapUserIds = [
      ...(pendingSwaps ?? []).map((s) => s.from_user_id),
      ...(pendingSwaps ?? []).map((s) => s.to_user_id).filter((id): id is string => id !== null),
      ...(pendingSwaps ?? []).map((s) => s.accepted_by).filter((id): id is string => id !== null),
    ];
    const allNeededUserIds = [...new Set([...todayUserIds, ...swapUserIds])];

    const { data: allNeededUsers } = allNeededUserIds.length
      ? await service
          .from("users")
          .select("id, first_name, last_name")
          .in("id", allNeededUserIds)
      : { data: [] as { id: string; first_name: string; last_name: string }[] };

    const userNameMap = Object.fromEntries(
      (allNeededUsers ?? []).map((u) => [u.id, `${u.first_name} ${u.last_name}`]),
    );

    return {
      groups: groups ?? [],
      employeeCount: employeeCount ?? 0,
      publishedCount,
      pendingSwaps: pendingSwaps ?? [],
      pendingCount: pendingCount ?? 0,
      scheduleGroupMap,
      groupNameMap,
      groupColorMap,
      shiftDateMap,
      todayShifts,
      userNameMap,
      today,
    };
  },
  ["manager-dashboard"],
  { tags: ["manager-dashboard"], revalidate: 30 },
);

// ─── Manager Groups ───────────────────────────────────────────────────────────

export const getManagerGroupsData = unstable_cache(
  async (managerId: string) => {
    const service = createServiceClient();

    const { data: groups } = await service
      .from("groups")
      .select("id, name, color, shift_templates(id), group_members(id)")
      .eq("manager_id", managerId)
      .order("created_at", { ascending: false });

    return { groups: groups ?? [] };
  },
  ["manager-groups"],
  { tags: ["manager-groups"], revalidate: 30 },
);

// ─── Group Detail ─────────────────────────────────────────────────────────────

export const getGroupDetailData = unstable_cache(
  async (groupId: string, companyId: string, managerId: string) => {
    const service = createServiceClient();

    // Fetch group
    const { data: group } = await service
      .from("groups")
      .select("id, name, color")
      .eq("id", groupId)
      .eq("manager_id", managerId)
      .single();

    if (!group) return null;

    // Templates + members + available employees (parallel)
    const [{ data: templates }, { data: membersRaw }, { data: allEmployees }] =
      await Promise.all([
        service
          .from("shift_templates")
          .select("id, name, start_time, end_time, color")
          .eq("group_id", group.id)
          .order("start_time", { ascending: true }),
        service
          .from("group_members")
          .select("id, user_id, users(id, first_name, last_name, email)")
          .eq("group_id", group.id),
        service
          .from("users")
          .select("id, first_name, last_name, email")
          .eq("company_id", companyId)
          .eq("role", "employee")
          .eq("is_active", true)
          .order("first_name"),
      ]);

    type UserDetail = {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };

    const members = (membersRaw ?? []).map((m) => {
      const u = m.users as UserDetail | null;
      return {
        memberId: m.id,
        userId: m.user_id,
        firstName: u?.first_name ?? "",
        lastName: u?.last_name ?? "",
        email: u?.email ?? "",
      };
    });

    const memberUserIds = new Set(members.map((m) => m.userId));

    const available = (allEmployees ?? [])
      .filter((e) => !memberUserIds.has(e.id))
      .map((e) => ({
        ...e,
        first_name: e.first_name ?? "",
        last_name: e.last_name ?? "",
      }));

    return {
      group,
      templates: templates ?? [],
      members,
      available,
    };
  },
  ["group-detail"],
  { tags: ["group-detail"], revalidate: 30 },
);

// ─── Manager Schedule ─────────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return localDateStr(d);
}

export const getScheduleData = unstable_cache(
  async (managerId: string, selectedGroupId: string, weekStart: string) => {
    const service = createServiceClient();

    // Groups
    const { data: groupsRaw } = await service
      .from("groups")
      .select("id, name, color")
      .eq("manager_id", managerId)
      .order("name");

    const groups = (groupsRaw ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      color: g.color,
    }));

    if (groups.length === 0) {
      return { groups: [], members: [], templates: [], schedule: null, shifts: [], prevScheduleExists: false };
    }

    // Templates + members + schedule (parallel)
    const [{ data: templatesRaw }, { data: membersRaw }, { data: scheduleRaw }] =
      await Promise.all([
        service
          .from("shift_templates")
          .select("id, name, start_time, end_time, color")
          .eq("group_id", selectedGroupId)
          .order("start_time"),
        service
          .from("group_members")
          .select("user_id, users(id, first_name, last_name)")
          .eq("group_id", selectedGroupId),
        service
          .from("schedules")
          .select("id, status")
          .eq("group_id", selectedGroupId)
          .eq("week_start_date", weekStart)
          .maybeSingle(),
      ]);

    const templates = (templatesRaw ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      startTime: t.start_time,
      endTime: t.end_time,
      color: t.color ?? "#3b82f6",
    }));

    type UserDetail = { id: string; first_name: string; last_name: string };

    const members = (membersRaw ?? [])
      .map((m) => {
        const u = m.users as UserDetail | null;
        if (!u) return null;
        return { id: u.id, firstName: u.first_name, lastName: u.last_name };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    const schedule = scheduleRaw
      ? { id: scheduleRaw.id, status: scheduleRaw.status }
      : null;

    // Shifts + previous schedule check (parallel)
    const prevWeekStart = addDays(weekStart, -7);
    const [{ data: shiftsRaw }, { data: prevSchedule }] = await Promise.all([
      schedule
        ? service
            .from("shifts")
            .select("id, assigned_to, date, start_time, end_time, shift_template_id, notes, extra_hours, extra_hours_notes")
            .eq("schedule_id", schedule.id)
        : Promise.resolve({ data: [] as {
            id: string;
            assigned_to: string;
            date: string;
            start_time: string;
            end_time: string;
            shift_template_id: string | null;
            notes: string | null;
            extra_hours: number | null;
            extra_hours_notes: string | null;
          }[] }),
      service
        .from("schedules")
        .select("id")
        .eq("group_id", selectedGroupId)
        .eq("week_start_date", prevWeekStart)
        .maybeSingle(),
    ]);

    const shifts = (shiftsRaw ?? []).map((s) => ({
      id: s.id,
      userId: s.assigned_to,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      templateId: s.shift_template_id,
      notes: s.notes,
      extraHours: s.extra_hours,
      extraHoursNotes: s.extra_hours_notes,
    }));

    return {
      groups,
      members,
      templates,
      schedule,
      shifts,
      prevScheduleExists: !!prevSchedule,
    };
  },
  ["manager-schedule"],
  { tags: ["manager-schedule"], revalidate: 30 },
);

// ─── Manager Swaps ────────────────────────────────────────────────────────────

export const getManagerSwapsData = unstable_cache(
  async (managerId: string) => {
    const service = createServiceClient();

    // Step 1: Groups
    const { data: groups } = await service
      .from("groups")
      .select("id, name")
      .eq("manager_id", managerId);

    const groupIds = (groups ?? []).map((g) => g.id);

    if (groupIds.length === 0) return { swaps: [] };

    // Step 2: Schedules
    const { data: schedules } = await service
      .from("schedules")
      .select("id, group_id")
      .in("group_id", groupIds);

    const scheduleIds = (schedules ?? []).map((s) => s.id);
    if (scheduleIds.length === 0) return { swaps: [] };

    // Step 3: Shifts
    const { data: shifts } = await service
      .from("shifts")
      .select("id, schedule_id, date, start_time, end_time")
      .in("schedule_id", scheduleIds);

    const shiftIds = (shifts ?? []).map((s) => s.id);
    if (shiftIds.length === 0) return { swaps: [] };

    // Step 4: Swap requests
    const { data: swaps } = await service
      .from("shift_swaps")
      .select(
        "id, shift_id, from_user_id, to_user_id, accepted_by, type, status, manager_notes, requested_at",
      )
      .in("shift_id", shiftIds)
      .order("requested_at", { ascending: false });

    if (!swaps || swaps.length === 0) return { swaps: [] };

    // Step 5: User names
    const userIds = [
      ...new Set([
        ...swaps.map((s) => s.from_user_id),
        ...swaps.map((s) => s.to_user_id).filter((id): id is string => id !== null),
        ...swaps.map((s) => s.accepted_by).filter((id): id is string => id !== null),
      ]),
    ];

    const { data: users } = await service
      .from("users")
      .select("id, first_name, last_name")
      .in("id", userIds);

    const userMap = new Map(
      (users ?? []).map((u) => [u.id, `${u.first_name} ${u.last_name}`]),
    );

    const shiftMap = new Map(
      (shifts ?? []).map((s) => ({
        ...s,
        groupId: (schedules ?? []).find((sc) => sc.id === s.schedule_id)?.group_id,
      })).map((s) => [s.id, s]),
    );

    const groupMap = new Map((groups ?? []).map((g) => [g.id, g.name]));

    const rows = swaps.map((s) => {
      const shift = shiftMap.get(s.shift_id)!;
      const groupId = shift?.groupId ?? "";
      return {
        id: s.id,
        type: s.type,
        status: s.status,
        createdAt: s.requested_at ?? "",
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

    return { swaps: rows };
  },
  ["manager-swaps"],
  { tags: ["manager-swaps"], revalidate: 30 },
);

// ─── Employee Schedule ────────────────────────────────────────────────────────

export const getEmployeeScheduleData = unstable_cache(
  async (userId: string, weekStart: string) => {
    const service = createServiceClient();
    const weekEnd = addDays(weekStart, 6);

    // 1. Shifts + group memberships (parallel)
    const [{ data: shifts }, { data: myMemberships }] = await Promise.all([
      service
        .from("shifts")
        .select("id, schedule_id, date, start_time, end_time, shift_template_id, shift_templates(color), extra_hours, extra_hours_notes")
        .eq("assigned_to", userId)
        .gte("date", weekStart)
        .lte("date", weekEnd)
        .order("start_time"),
      service
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId),
    ]);

    const scheduleIds = [...new Set((shifts ?? []).map((s) => s.schedule_id))];
    const shiftIds = (shifts ?? []).map((s) => s.id);
    const myGroupIds = (myMemberships ?? []).map((m) => m.group_id);

    // 2. Schedules + active swaps + colleague members (parallel)
    const [{ data: schedules }, { data: activeSwaps }, { data: allMemberRows }] =
      await Promise.all([
        scheduleIds.length
          ? service
              .from("schedules")
              .select("id, group_id")
              .in("id", scheduleIds)
          : Promise.resolve({ data: [] as { id: string; group_id: string }[] }),
        shiftIds.length
          ? service
              .from("shift_swaps")
              .select("id, shift_id, status, type")
              .eq("from_user_id", userId)
              .in("shift_id", shiftIds)
              .in("status", ["pending_employee", "accepted_by_employee", "pending_manager"])
          : Promise.resolve({ data: [] as { id: string; shift_id: string; status: string; type: string }[] }),
        myGroupIds.length
          ? service
              .from("group_members")
              .select("user_id, group_id")
              .in("group_id", myGroupIds)
              .neq("user_id", userId)
          : Promise.resolve({ data: [] as { user_id: string; group_id: string }[] }),
      ]);

    const groupIds = [...new Set((schedules ?? []).map((s) => s.group_id))];
    const colleagueIds = [
      ...new Set((allMemberRows ?? []).map((m) => m.user_id)),
    ];

    // 3. Groups + colleague users (parallel)
    const [{ data: groups }, { data: colleagueUsers }] = await Promise.all([
      groupIds.length
        ? service
            .from("groups")
            .select("id, name, color")
            .in("id", groupIds)
        : Promise.resolve({ data: [] as { id: string; name: string; color: string }[] }),
      colleagueIds.length
        ? service
            .from("users")
            .select("id, first_name, last_name")
            .in("id", colleagueIds)
            .eq("is_active", true)
            .order("first_name")
        : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string }[] }),
    ]);

    // Build lookup maps
    const scheduleGroupMap = new Map(
      (schedules ?? []).map((s) => [s.id, s.group_id]),
    );
    const groupMap = new Map(
      (groups ?? []).map((g) => [g.id, { name: g.name, color: g.color }]),
    );
    const swapMap = new Map(
      (activeSwaps ?? []).map((s) => [s.shift_id, s]),
    );

    const colleagueGroupsMap = new Map<string, string[]>();
    for (const m of allMemberRows ?? []) {
      const list = colleagueGroupsMap.get(m.user_id) ?? [];
      list.push(m.group_id);
      colleagueGroupsMap.set(m.user_id, list);
    }

    // Assemble props
    const shiftRows = (shifts ?? []).map((s) => {
      const groupId = scheduleGroupMap.get(s.schedule_id) ?? "";
      const group = groupMap.get(groupId) ?? { name: "", color: "#6366f1" };
      const swap = swapMap.get(s.id);
      const templateData = (s as unknown as { shift_templates: { color: string | null } | null }).shift_templates;
      const templateColor = templateData?.color ?? "#3b82f6";
      return {
        id: s.id,
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
        groupId,
        groupName: group.name,
        groupColor: group.color,
        templateColor,
        extraHours: s.extra_hours ?? null,
        extraHoursNotes: s.extra_hours_notes ?? null,
        swapId: swap?.id ?? null,
        swapStatus: swap?.status ?? null,
        swapType: (swap?.type as "direct" | "public") ?? null,
      };
    });

    const colleagues = (colleagueUsers ?? []).map((u) => ({
      id: u.id,
      firstName: u.first_name ?? "",
      lastName: u.last_name ?? "",
      groupIds: colleagueGroupsMap.get(u.id) ?? [],
    }));

    return { shifts: shiftRows, colleagues };
  },
  ["employee-schedule"],
  { tags: ["employee-schedule"], revalidate: 30 },
);

// ─── Employee Swaps ───────────────────────────────────────────────────────────

export const getEmployeeSwapsData = unstable_cache(
  async (userId: string) => {
    const service = createServiceClient();

    // 1-5. Memberships + all swap queries (parallel)
    const [
      { data: myMemberships },
      { data: mySwapRows },
      { data: incomingRows },
      { data: publicSwapRows },
      { data: myClaimRows },
    ] = await Promise.all([
      service
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId),
      service
        .from("shift_swaps")
        .select("id, shift_id, to_user_id, accepted_by, type, status, requested_at, manager_notes")
        .eq("from_user_id", userId)
        .order("requested_at", { ascending: false }),
      service
        .from("shift_swaps")
        .select("id, shift_id, from_user_id, requested_at")
        .eq("to_user_id", userId)
        .eq("type", "direct")
        .eq("status", "pending_employee")
        .order("requested_at", { ascending: false }),
      service
        .from("shift_swaps")
        .select("id, shift_id, from_user_id, requested_at")
        .eq("type", "public")
        .eq("status", "pending_employee")
        .neq("from_user_id", userId)
        .order("requested_at", { ascending: false }),
      service
        .from("shift_swaps")
        .select("id, shift_id, from_user_id, status, requested_at, manager_notes")
        .eq("accepted_by", userId)
        .eq("type", "public")
        .in("status", ["accepted_by_employee", "pending_manager", "approved", "rejected_by_manager"])
        .order("requested_at", { ascending: false }),
    ]);

    const myGroupIds = (myMemberships ?? []).map((m) => m.group_id);

    // 6. Collect all shift IDs
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

    // 7. Schedule → group lookup
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

    // 8. User names
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

    // Assemble props
    const emptyShift = { date: "", startTime: "", endTime: "", groupName: "", groupColor: "#6366f1" };

    const mySwaps = (mySwapRows ?? []).map((s) => {
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
        managerNotes: s.manager_notes ?? null,
      };
    });

    const incoming = (incomingRows ?? []).map((s) => {
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

    const publicBoard = filteredPublicSwaps.map((s) => {
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

    const myClaims = (myClaimRows ?? []).map((s) => {
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
        managerNotes: s.manager_notes ?? null,
      };
    });

    return { mySwaps, incoming, publicBoard, myClaims };
  },
  ["employee-swaps"],
  { tags: ["employee-swaps"], revalidate: 30 },
);

// ─── Team Schedule ────────────────────────────────────────────────────────────

export const getTeamScheduleData = unstable_cache(
  async (userId: string, weekStart: string) => {
    const service = createServiceClient();
    const weekEnd = addDays(weekStart, 6);

    // 1. My group memberships
    const { data: myMemberships } = await service
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    const myGroupIds = (myMemberships ?? []).map((m) => m.group_id);

    if (myGroupIds.length === 0) {
      return { members: [], shifts: [] };
    }

    // 2. Members + schedules + groups (parallel)
    const [{ data: allMemberRows }, { data: schedules }, { data: groups }] =
      await Promise.all([
        service
          .from("group_members")
          .select("user_id, group_id")
          .in("group_id", myGroupIds),
        service
          .from("schedules")
          .select("id, group_id")
          .in("group_id", myGroupIds)
          .in("status", ["published", "locked"]),
        service
          .from("groups")
          .select("id, name, color")
          .in("id", myGroupIds),
      ]);

    const memberUserIds = [
      ...new Set((allMemberRows ?? []).map((m) => m.user_id)),
    ];
    const scheduleIds = (schedules ?? []).map((s) => s.id);
    const scheduleGroupMap = new Map(
      (schedules ?? []).map((s) => [s.id, s.group_id]),
    );

    // 3. Member users + shifts (parallel)
    const [{ data: memberUsers }, { data: shiftsData }] = await Promise.all([
      memberUserIds.length
        ? service
            .from("users")
            .select("id, first_name, last_name")
            .in("id", memberUserIds)
            .eq("is_active", true)
            .order("first_name")
        : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string }[] }),
      scheduleIds.length
        ? service
            .from("shifts")
            .select("id, schedule_id, assigned_to, date, start_time, end_time, shift_template_id, shift_templates(color)")
            .in("schedule_id", scheduleIds)
            .gte("date", weekStart)
            .lte("date", weekEnd)
            .order("start_time")
        : Promise.resolve({
            data: [] as {
              id: string;
              schedule_id: string;
              assigned_to: string;
              date: string;
              start_time: string;
              end_time: string;
              shift_template_id: string | null;
              shift_templates: { color: string | null } | null;
            }[],
          }),
    ]);

    const groupMap = new Map(
      (groups ?? []).map((g) => [g.id, { name: g.name, color: g.color }]),
    );

    // Assemble props
    const members = (memberUsers ?? []).map((u) => ({
      id: u.id,
      firstName: u.first_name ?? "",
      lastName: u.last_name ?? "",
    }));

    const teamShifts = (shiftsData ?? []).map((s) => {
      const groupId = scheduleGroupMap.get(s.schedule_id) ?? "";
      const group = groupMap.get(groupId) ?? { name: "", color: "#6366f1" };
      const templateData = (s as unknown as { shift_templates: { color: string | null } | null }).shift_templates;
      const templateColor = templateData?.color ?? "#3b82f6";
      return {
        id: s.id,
        userId: s.assigned_to,
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
        groupName: group.name,
        groupColor: group.color,
        templateColor,
      };
    });

    return { members, shifts: teamShifts };
  },
  ["employee-team"],
  { tags: ["employee-team"], revalidate: 30 },
);
