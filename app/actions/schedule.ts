"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { safeError } from "@/lib/errors";
import { isDate, clampExtraHours, cleanText, MAX_NOTE } from "@/lib/validation";
import { findOverlappingShift } from "@/lib/shifts.server";

// LOGIC-003: shifts on a terminal schedule (locked/archived) are read-only, in
// line with the manager UI's own `isReadOnly` guard. Draft and published stay
// editable — a manager must be able to fix a live (published) roster, e.g. a
// same-day sick call. Re-notifying employees of published edits is tracked
// separately with the notification system (LOGIC-004).
const READONLY_SCHEDULE_STATUSES = new Set(["locked", "archived"]);

function revalidateScheduleSurfaces() {
  revalidateTag("manager-schedule");
  revalidateTag("employee-schedule");
  revalidateTag("employee-team");
  revalidateTag("manager-dashboard");
}

async function getManagerProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, company_id, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "manager") {
    throw new Error("Unauthorized");
  }
  // SEC-003: reject deactivated users and clear their session.
  if (profile.is_active === false) {
    await supabase.auth.signOut();
    redirect("/auth/login");
  }

  return { supabase, profile };
}

// ─── Schedule lifecycle ───────────────────────────────────────────────────────

export async function createSchedule(groupId: string, weekStart: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    if (!isDate(weekStart)) {
      return { scheduleId: null, error: "Invalid week start date" };
    }
    // Verify ownership in same query via inner join
    const { data: group } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("manager_id", profile.id)
      .single();

    if (!group) return { scheduleId: null, error: "Group not found" };

    // LOGIC-017: one schedule per (group, week). Reject a duplicate rather than
    // silently forking a week's roster across two schedule rows.
    const { data: existingSchedule } = await supabase
      .from("schedules")
      .select("id")
      .eq("group_id", groupId)
      .eq("week_start_date", weekStart)
      .maybeSingle();

    if (existingSchedule) {
      return { scheduleId: null, error: "A schedule already exists for this week" };
    }

    const weekEndDate = (() => {
      const d = new Date(weekStart + "T00:00:00");
      d.setDate(d.getDate() + 6);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

    const { data, error } = await supabase
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

    if (error) return { scheduleId: null, error: safeError(error) };

    revalidateScheduleSurfaces();
    return { scheduleId: data.id, error: null };
  } catch (err) {
    return { scheduleId: null, error: safeError(err) };
  }
}

// Single action: verify ownership + fetch prev shifts + create + copy in 4 queries
export async function copyFromLastWeek(groupId: string, weekStart: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    if (!isDate(weekStart)) {
      return { scheduleId: null, error: "Invalid week start date" };
    }
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

    // LOGIC-017: don't copy into a week that already has a schedule.
    const { data: targetExists } = await supabase
      .from("schedules")
      .select("id")
      .eq("group_id", groupId)
      .eq("week_start_date", weekStart)
      .maybeSingle();

    if (targetExists) {
      return { scheduleId: null, error: "A schedule already exists for this week" };
    }

    const prevShifts = (prevData.shifts ?? []) as {
      assigned_to: string;
      shift_template_id: string | null;
      date: string;
      start_time: string;
      end_time: string;
    }[];

    // LOGIC-011 / LOGIC-006: only copy shifts for employees who are STILL active
    // members of the group. Assignees who have since left or been deactivated are
    // dropped rather than silently re-scheduled onto a ghost roster.
    const service = createServiceClient();
    const { data: memberRows } = await service
      .from("group_members")
      .select("user_id, users!inner(is_active)")
      .eq("group_id", groupId);

    const activeMemberIds = new Set(
      (memberRows ?? [])
        .filter((m) => (m.users as { is_active: boolean } | null)?.is_active !== false)
        .map((m) => m.user_id),
    );

    const memberFiltered = prevShifts.filter((s) => activeMemberIds.has(s.assigned_to));
    let skipped = prevShifts.length - memberFiltered.length;

    // Compute each copy's +7-day target date up front so overlaps can be checked
    // before insertion.
    const candidates = memberFiltered.map((s) => {
      const d = new Date(s.date + "T00:00:00");
      d.setDate(d.getDate() + 7);
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return { ...s, date };
    });

    // LOGIC-002: enforce the same company-wide double-booking guard the other
    // write paths use. A copied shift can collide with a shift the employee
    // already has in the TARGET week from another group, so drop any that would
    // overlap (added to the skipped count) rather than silently double-booking.
    const overlapFlags = await Promise.all(
      candidates.map((c) =>
        findOverlappingShift(c.assigned_to, c.date, c.start_time, c.end_time),
      ),
    );
    const copyable = candidates.filter((_, i) => !overlapFlags[i]);
    skipped += candidates.length - copyable.length;

    // Query 3: create new schedule
    const weekEndDate = (() => {
      const d = new Date(weekStart + "T00:00:00");
      d.setDate(d.getDate() + 6);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();

    const { data: newSchedule, error: scheduleError } = await supabase
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
      return { scheduleId: null, error: safeError(scheduleError) };
    }

    // Query 4: batch insert the conflict-free copies. LOGIC-011: check the insert
    // result instead of ignoring it, so a failed copy is reported rather than
    // presented as a successful-but-empty week.
    if (copyable.length > 0) {
      const newShifts = copyable.map((s) => ({
        schedule_id: newSchedule.id,
        group_id: groupId,
        assigned_to: s.assigned_to,
        shift_template_id: s.shift_template_id,
        date: s.date,
        start_time: s.start_time,
        end_time: s.end_time,
        created_by: profile.id,
      }));
      const { error: insertError } = await supabase.from("shifts").insert(newShifts);
      if (insertError) {
        return { scheduleId: newSchedule.id, error: safeError(insertError) };
      }
    }

    revalidateScheduleSurfaces();
    return {
      scheduleId: newSchedule.id,
      error: null,
      skipped: skipped > 0 ? skipped : undefined,
    };
  } catch (err) {
    return { scheduleId: null, error: safeError(err) };
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

    const { error } = await supabase
      .from("schedules")
      .update({ status: "published" })
      .eq("id", scheduleId);

    if (error) return { error: safeError(error) };

    revalidateScheduleSurfaces();
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
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
    if (!isDate(date)) return { shiftId: null, error: "Invalid date" };
    // Query 2: verify schedule ownership + fetch template in parallel
    const [scheduleRes, templateRes] = await Promise.all([
      supabase
        .from("schedules")
        .select("id, group_id, status, groups!inner(manager_id)")
        .eq("id", scheduleId)
        .single(),
      supabase
        .from("shift_templates")
        .select("start_time, end_time, group_id")
        .eq("id", templateId)
        .single(),
    ]);

    const grp = scheduleRes.data?.groups as { manager_id: string } | null;
    if (!scheduleRes.data || !grp || grp.manager_id !== profile.id) {
      return { shiftId: null, error: "Unauthorized" };
    }
    // LOGIC-003: no edits to a locked/archived schedule.
    if (READONLY_SCHEDULE_STATUSES.has(scheduleRes.data.status)) {
      return { shiftId: null, error: "This schedule is locked and cannot be edited" };
    }
    if (!templateRes.data) return { shiftId: null, error: "Template not found" };

    // SEC-009: the template must belong to the schedule's group, and the
    // assignee must be a member of that group — userId/templateId are otherwise
    // unvalidated and written straight into the shift.
    if (templateRes.data.group_id !== scheduleRes.data.group_id) {
      return { shiftId: null, error: "Template does not belong to this group" };
    }

    // LOGIC-006: the assignee must be a member of the group AND still active.
    const { data: membership } = await supabase
      .from("group_members")
      .select("id, users!inner(is_active)")
      .eq("group_id", scheduleRes.data.group_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership) {
      return { shiftId: null, error: "Employee is not a member of this group" };
    }
    if ((membership.users as { is_active: boolean } | null)?.is_active === false) {
      return { shiftId: null, error: "This employee is deactivated" };
    }

    // LOGIC-002: reject a shift that would double-book the employee (in this or
    // any other group they belong to) against an overlapping time.
    const conflict = await findOverlappingShift(
      userId,
      date,
      templateRes.data.start_time,
      templateRes.data.end_time,
    );
    if (conflict) {
      return {
        shiftId: null,
        error: "This employee already has an overlapping shift that day",
      };
    }

    // Query 3: insert
    const { data, error } = await supabase
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

    if (error) return { shiftId: null, error: safeError(error) };

    revalidateScheduleSurfaces();
    return { shiftId: data.id, error: null };
  } catch (err) {
    return { shiftId: null, error: safeError(err) };
  }
}

export async function updateShift(shiftId: string, templateId: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    // SEC-004: verify the shift belongs to a group this manager manages.
    const { data: owned } = await supabase
      .from("shifts")
      .select("id, group_id, assigned_to, date, schedules!inner(status), groups!inner(manager_id)")
      .eq("id", shiftId)
      .single();

    const ownedGrp = owned?.groups as { manager_id: string } | null;
    if (!owned || !ownedGrp || ownedGrp.manager_id !== profile.id) {
      return { error: "Unauthorized" };
    }
    // LOGIC-003: no edits to a locked/archived schedule.
    const ownedSched = owned.schedules as { status: string } | null;
    if (ownedSched && READONLY_SCHEDULE_STATUSES.has(ownedSched.status)) {
      return { error: "This schedule is locked and cannot be edited" };
    }

    const { data: template } = await supabase
      .from("shift_templates")
      .select("start_time, end_time, group_id")
      .eq("id", templateId)
      .single();

    if (!template) return { error: "Template not found" };
    // The template must belong to the same group as the shift.
    if (template.group_id !== owned.group_id) {
      return { error: "Template does not belong to this group" };
    }

    // LOGIC-002: the new times must not overlap another shift for this employee
    // (ignoring the shift being edited itself).
    const conflict = await findOverlappingShift(
      owned.assigned_to,
      owned.date,
      template.start_time,
      template.end_time,
      shiftId,
    );
    if (conflict) {
      return { error: "This change would overlap another shift for this employee" };
    }

    const { error } = await supabase
      .from("shifts")
      .update({
        shift_template_id: templateId,
        start_time: template.start_time,
        end_time: template.end_time,
        is_manually_adjusted: false,
        modified_by: profile.id,
      })
      .eq("id", shiftId);

    if (error) return { error: safeError(error) };

    revalidateScheduleSurfaces();
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}

export async function removeShift(shiftId: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    // SEC-004: verify the shift belongs to a group this manager manages before
    // mutating or deleting it.
    const { data: owned } = await supabase
      .from("shifts")
      .select("id, schedules!inner(status), groups!inner(manager_id)")
      .eq("id", shiftId)
      .single();

    const ownedGrp = owned?.groups as { manager_id: string } | null;
    if (!owned || !ownedGrp || ownedGrp.manager_id !== profile.id) {
      return { error: "Unauthorized" };
    }
    // LOGIC-003: no deletions on a locked/archived schedule.
    const ownedSched = owned.schedules as { status: string } | null;
    if (ownedSched && READONLY_SCHEDULE_STATUSES.has(ownedSched.status)) {
      return { error: "This schedule is locked and cannot be edited" };
    }

    // Set modified_by before delete so the DELETE trigger can read OLD.modified_by.
    // LOGIC-016: check this write instead of firing and forgetting.
    const { error: auditError } = await supabase
      .from("shifts")
      .update({ modified_by: profile.id })
      .eq("id", shiftId);

    if (auditError) return { error: safeError(auditError) };

    const { error } = await supabase.from("shifts").delete().eq("id", shiftId);

    if (error) return { error: safeError(error) };

    // LOGIC-016: only AFTER the shift is actually gone, clean up its swap
    // requests so none are left dangling (rendered as blank rows in the swap
    // queues). Doing this after the delete means a failed delete can't destroy
    // swaps while the shift survives.
    const service = createServiceClient();
    await service.from("shift_swaps").delete().eq("shift_id", shiftId);

    revalidateScheduleSurfaces();
    revalidateTag("manager-swaps");
    revalidateTag("employee-swaps");
    revalidateTag("owner-dashboard");
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}

export async function addShiftNote(shiftId: string, note: string) {
  const { supabase, profile } = await getManagerProfile();
  try {
    // SEC-004: verify the shift belongs to a group this manager manages.
    const { data: owned } = await supabase
      .from("shifts")
      .select("id, schedules!inner(status), groups!inner(manager_id)")
      .eq("id", shiftId)
      .single();

    const ownedGrp = owned?.groups as { manager_id: string } | null;
    if (!owned || !ownedGrp || ownedGrp.manager_id !== profile.id) {
      return { error: "Unauthorized" };
    }
    // LOGIC-003: no edits to a locked/archived schedule.
    const ownedSched = owned.schedules as { status: string } | null;
    if (ownedSched && READONLY_SCHEDULE_STATUSES.has(ownedSched.status)) {
      return { error: "This schedule is locked and cannot be edited" };
    }

    const { error } = await supabase
      .from("shifts")
      .update({ notes: cleanText(note, MAX_NOTE), modified_by: profile.id })
      .eq("id", shiftId);

    if (error) return { error: safeError(error) };

    revalidateScheduleSurfaces();
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}

export async function saveExtraHours(
  shiftId: string,
  extraHours: number | null,
  extraHoursNotes: string | null,
) {
  const { supabase, profile } = await getManagerProfile();
  try {
    // SEC-004: verify the shift belongs to a group this manager manages before
    // writing payroll-affecting extra hours.
    const { data: owned } = await supabase
      .from("shifts")
      .select("id, schedules!inner(status), groups!inner(manager_id)")
      .eq("id", shiftId)
      .single();

    const ownedGrp = owned?.groups as { manager_id: string } | null;
    if (!owned || !ownedGrp || ownedGrp.manager_id !== profile.id) {
      return { error: "Unauthorized" };
    }
    // LOGIC-003: no payroll edits on a locked/archived schedule.
    const ownedSched = owned.schedules as { status: string } | null;
    if (ownedSched && READONLY_SCHEDULE_STATUSES.has(ownedSched.status)) {
      return { error: "This schedule is locked and cannot be edited" };
    }

    const { error } = await supabase
      .from("shifts")
      .update({
        // SEC-010: clamp to a non-negative payroll range; cap the note length.
        extra_hours: clampExtraHours(extraHours),
        extra_hours_notes: cleanText(extraHoursNotes, MAX_NOTE),
        modified_by: profile.id,
      })
      .eq("id", shiftId);

    if (error) return { error: safeError(error) };

    revalidateScheduleSurfaces();
    return { error: null };
  } catch (err) {
    return { error: safeError(err) };
  }
}
