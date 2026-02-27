"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function getManagerProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "manager") {
    throw new Error("Unauthorized");
  }

  return { supabase, profile };
}

// ─── Schedule lifecycle ───────────────────────────────────────────────────────

export async function createSchedule(groupId: string, weekStart: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    // Verify ownership in same query via inner join
    const { data: group } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("manager_id", profile.id)
      .single();

    if (!group) return { scheduleId: null, error: "Group not found" };

    const weekEndDate = (() => {
      const d = new Date(weekStart + "T00:00:00");
      d.setDate(d.getDate() + 6);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

    // Use service client for insert — ownership already verified above
    const service = createServiceClient();
    const { data, error } = await service
      .from("schedules")
      .insert({
        company_id: profile.company_id,
        group_id: groupId,
        manager_id: profile.id,
        week_start_date: weekStart,
        week_end_date: weekEndDate,
        status: "draft",
      })
      .select("id")
      .single();

    if (error) return { scheduleId: null, error: error.message };

    revalidateTag("manager-schedule");
    revalidateTag("employee-schedule");
    revalidateTag("employee-team");
    revalidateTag("manager-dashboard");
    return { scheduleId: data.id, error: null };
  } catch {
    return { scheduleId: null, error: "Something went wrong" };
  }
}

// Single action: verify ownership + fetch prev shifts + create + copy in 4 queries
export async function copyFromLastWeek(groupId: string, weekStart: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    const prevStart = (() => {
      const d = new Date(weekStart + "T00:00:00");
      d.setDate(d.getDate() - 7);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

    // Query 2: get prev schedule + its shifts + verify group ownership in one roundtrip
    const { data: prevData } = await supabase
      .from("schedules")
      .select(
        "id, groups!inner(manager_id), shifts(assigned_to, shift_template_id, date, start_time, end_time)",
      )
      .eq("group_id", groupId)
      .eq("week_start_date", prevStart)
      .maybeSingle();

    if (!prevData) {
      return { scheduleId: null, error: "No schedule found for previous week" };
    }

    // JS-side ownership guard (inner join already filtered, but belt-and-suspenders)
    const grp = prevData.groups as { manager_id: string } | null;
    if (!grp || grp.manager_id !== profile.id) {
      return { scheduleId: null, error: "Unauthorized" };
    }

    const prevShifts = (prevData.shifts ?? []) as {
      assigned_to: string;
      shift_template_id: string | null;
      date: string;
      start_time: string;
      end_time: string;
    }[];

    // Query 3: create new schedule
    const weekEndDate = (() => {
      const d = new Date(weekStart + "T00:00:00");
      d.setDate(d.getDate() + 6);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

    // Use service client for inserts — ownership already verified above
    const service = createServiceClient();
    const { data: newSchedule, error: scheduleError } = await service
      .from("schedules")
      .insert({
        company_id: profile.company_id,
        group_id: groupId,
        manager_id: profile.id,
        week_start_date: weekStart,
        week_end_date: weekEndDate,
        status: "draft",
      })
      .select("id")
      .single();

    if (scheduleError) {
      return { scheduleId: null, error: scheduleError.message };
    }

    // Query 4: batch insert shifted copies (+7 days)
    if (prevShifts.length > 0) {
      const newShifts = prevShifts.map((s) => {
        const d = new Date(s.date + "T00:00:00");
        d.setDate(d.getDate() + 7);
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return {
          schedule_id: newSchedule.id,
          group_id: groupId,
          assigned_to: s.assigned_to,
          shift_template_id: s.shift_template_id,
          date,
          start_time: s.start_time,
          end_time: s.end_time,
          created_by: profile.id,
        };
      });
      await service.from("shifts").insert(newShifts);
    }

    revalidateTag("manager-schedule");
    revalidateTag("employee-schedule");
    revalidateTag("employee-team");
    revalidateTag("manager-dashboard");
    return { scheduleId: newSchedule.id, error: null };
  } catch {
    return { scheduleId: null, error: "Something went wrong" };
  }
}

export async function publishSchedule(scheduleId: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    // Verify ownership + get status in one query via inner join
    const { data: schedule } = await supabase
      .from("schedules")
      .select("id, status, groups!inner(manager_id)")
      .eq("id", scheduleId)
      .single();

    if (!schedule) return { error: "Schedule not found" };

    const grp = schedule.groups as { manager_id: string } | null;
    if (!grp || grp.manager_id !== profile.id) return { error: "Unauthorized" };
    if (schedule.status !== "draft") return { error: "Only draft schedules can be published" };

    // Use service client for update — ownership already verified above, RLS may block user client
    const service = createServiceClient();
    const { error } = await service
      .from("schedules")
      .update({ status: "published" })
      .eq("id", scheduleId);

    if (error) return { error: error.message };

    revalidateTag("manager-schedule");
    revalidateTag("employee-schedule");
    revalidateTag("employee-team");
    revalidateTag("manager-dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

// ─── Shift mutations ──────────────────────────────────────────────────────────

export async function addShift(
  scheduleId: string,
  userId: string,
  date: string,
  templateId: string,
) {
  const { supabase, profile } = await getManagerProfile();
  try {
    // Query 2: verify schedule ownership + fetch template in parallel
    const [scheduleRes, templateRes] = await Promise.all([
      supabase
        .from("schedules")
        .select("id, group_id, groups!inner(manager_id)")
        .eq("id", scheduleId)
        .single(),
      supabase
        .from("shift_templates")
        .select("start_time, end_time")
        .eq("id", templateId)
        .single(),
    ]);

    const grp = scheduleRes.data?.groups as { manager_id: string } | null;
    if (!scheduleRes.data || !grp || grp.manager_id !== profile.id) {
      return { shiftId: null, error: "Unauthorized" };
    }
    if (!templateRes.data) return { shiftId: null, error: "Template not found" };

    // Use service client for insert — ownership already verified above
    const service = createServiceClient();
    const { data, error } = await service
      .from("shifts")
      .insert({
        schedule_id: scheduleId,
        group_id: scheduleRes.data.group_id,
        assigned_to: userId,
        shift_template_id: templateId,
        date,
        start_time: templateRes.data.start_time,
        end_time: templateRes.data.end_time,
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (error) return { shiftId: null, error: error.message };

    revalidateTag("manager-schedule");
    revalidateTag("employee-schedule");
    revalidateTag("employee-team");
    revalidateTag("manager-dashboard");
    return { shiftId: data.id, error: null };
  } catch {
    return { shiftId: null, error: "Something went wrong" };
  }
}

export async function updateShift(shiftId: string, templateId: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    const { data: template } = await supabase
      .from("shift_templates")
      .select("start_time, end_time")
      .eq("id", templateId)
      .single();

    if (!template) return { error: "Template not found" };

    // Use service client for mutation — ownership verified via getManagerProfile
    const service = createServiceClient();
    const { error } = await service
      .from("shifts")
      .update({
        shift_template_id: templateId,
        start_time: template.start_time,
        end_time: template.end_time,
        is_manually_adjusted: false,
        modified_by: profile.id,
      })
      .eq("id", shiftId);

    if (error) return { error: error.message };

    revalidateTag("manager-schedule");
    revalidateTag("employee-schedule");
    revalidateTag("employee-team");
    revalidateTag("manager-dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function removeShift(shiftId: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    // Use service client for mutation
    const service = createServiceClient();
    // Set modified_by before delete so the DELETE trigger can read OLD.modified_by
    await service
      .from("shifts")
      .update({ modified_by: profile.id })
      .eq("id", shiftId);

    const { error } = await service.from("shifts").delete().eq("id", shiftId);

    if (error) return { error: error.message };

    revalidateTag("manager-schedule");
    revalidateTag("employee-schedule");
    revalidateTag("employee-team");
    revalidateTag("manager-dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function addShiftNote(shiftId: string, note: string) {
  const { profile } = await getManagerProfile();
  try {
    const service = createServiceClient();
    const { error } = await service
      .from("shifts")
      .update({ notes: note.trim() || null, modified_by: profile.id })
      .eq("id", shiftId);

    if (error) return { error: error.message };

    revalidateTag("manager-schedule");
    revalidateTag("employee-schedule");
    revalidateTag("employee-team");
    revalidateTag("manager-dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}

export async function saveExtraHours(
  shiftId: string,
  extraHours: number | null,
  extraHoursNotes: string | null,
) {
  const { profile } = await getManagerProfile();
  try {
    const service = createServiceClient();
    const { error } = await service
      .from("shifts")
      .update({
        extra_hours: extraHours,
        extra_hours_notes: extraHoursNotes,
        modified_by: profile.id,
      })
      .eq("id", shiftId);

    if (error) return { error: error.message };

    revalidateTag("manager-schedule");
    revalidateTag("employee-schedule");
    revalidateTag("employee-team");
    revalidateTag("manager-dashboard");
    return { error: null };
  } catch {
    return { error: "Something went wrong" };
  }
}
