import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(t: string) {
  return t.slice(0, 5);
}

/** Shift duration in decimal hours, e.g. "09:00"–"17:30" → 8.5 */
function shiftDurationHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

/** Format hours: 8 → "8h", 8.5 → "8.5h", 0 → "" */
function fmtHours(h: number): string {
  if (h === 0) return "";
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
}

/**
 * "#3b82f6" → "FFCCE3FD"  (lightened 78% toward white)
 * Used for schedule cell fills.
 */
function lightenToArgb(hex: string, factor = 0.78): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return (
    "FF" +
    lr.toString(16).padStart(2, "0").toUpperCase() +
    lg.toString(16).padStart(2, "0").toUpperCase() +
    lb.toString(16).padStart(2, "0").toUpperCase()
  );
}

/**
 * "#3b82f6" → "FF1E4E9A"  (darkened 55% for text on lightened bg)
 */
function darkenToArgb(hex: string, factor = 0.55): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.round(r * factor);
  const dg = Math.round(g * factor);
  const db = Math.round(b * factor);
  return (
    "FF" +
    dr.toString(16).padStart(2, "0").toUpperCase() +
    dg.toString(16).padStart(2, "0").toUpperCase() +
    db.toString(16).padStart(2, "0").toUpperCase()
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = createClient();
  const service = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Params ──────────────────────────────────────────────────────────────────
  const { searchParams } = req.nextUrl;
  const weekStart = searchParams.get("weekStart");
  const groupId = searchParams.get("groupId");

  if (!weekStart || !groupId) {
    return NextResponse.json(
      { error: "Missing weekStart or groupId" },
      { status: 400 },
    );
  }

  // Verify this group belongs to the requesting manager
  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("id", groupId)
    .eq("manager_id", profile.id)
    .single();

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const weekEnd = addDays(weekStart, 6);

  // ── Fetch members ───────────────────────────────────────────────────────────
  const { data: membersRaw } = await service
    .from("group_members")
    .select("user_id, users(id, first_name, last_name)")
    .eq("group_id", groupId);

  type UserDetail = { id: string; first_name: string; last_name: string };

  const members = (membersRaw ?? [])
    .map((m) => {
      const u = m.users as UserDetail | null;
      if (!u) return null;
      return {
        id: u.id,
        name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
      };
    })
    .filter((m): m is { id: string; name: string } => m !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  // ── Fetch schedule + shifts ─────────────────────────────────────────────────
  const { data: schedule } = await supabase
    .from("schedules")
    .select("id")
    .eq("group_id", groupId)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  // Now also fetch shift_template_id and template name for summary columns
  const { data: shiftsRaw } = schedule
    ? await service
        .from("shifts")
        .select(
          "assigned_to, date, start_time, end_time, extra_hours, shift_template_id, shift_templates(color, name)",
        )
        .eq("schedule_id", schedule.id)
        .gte("date", weekStart)
        .lte("date", weekEnd)
    : { data: [] as never[] };

  // ── Build per-shift lookup maps ─────────────────────────────────────────────

  type ShiftTemplateData = { color: string | null; name: string } | null;
  type ShiftRow = {
    assigned_to: string;
    date: string;
    start_time: string;
    end_time: string;
    extra_hours?: number | null;
    shift_template_id?: string | null;
    shift_templates: ShiftTemplateData;
  };

  // Daily cell display: userId::date → { label, color }
  const shiftMap = new Map<string, { label: string; color: string }>();

  // Summary: which templates were used (for column headers)
  const templatesUsed = new Map<string, { name: string; color: string }>();

  // Per employee: hours per template
  const empTemplateHours = new Map<string, Map<string, number>>();

  // Per employee: total extra hours
  const empExtraHours = new Map<string, number>();

  for (const raw of shiftsRaw ?? []) {
    const s = raw as unknown as ShiftRow;
    const td = s.shift_templates;
    const color = td?.color ?? "#3b82f6";
    const templateId = s.shift_template_id ?? "__custom__";
    const templateName = td?.name ?? "Custom";
    const duration = shiftDurationHours(s.start_time, s.end_time);
    const extra = s.extra_hours ?? 0;

    // Daily cell label
    const dayLabel =
      `${fmtTime(s.start_time)}-${fmtTime(s.end_time)}` +
      (extra > 0 ? ` +${extra}h` : "");
    shiftMap.set(`${s.assigned_to}::${s.date}`, { label: dayLabel, color });

    // Register template
    if (!templatesUsed.has(templateId)) {
      templatesUsed.set(templateId, { name: templateName, color });
    }

    // Employee template hours
    const tMap = empTemplateHours.get(s.assigned_to) ?? new Map<string, number>();
    tMap.set(templateId, (tMap.get(templateId) ?? 0) + duration);
    empTemplateHours.set(s.assigned_to, tMap);

    // Employee extra hours
    if (extra > 0) {
      empExtraHours.set(s.assigned_to, (empExtraHours.get(s.assigned_to) ?? 0) + extra);
    }
  }

  // Sort templates alphabetically so columns are consistent
  const sortedTemplates = [...templatesUsed.entries()].sort(([, a], [, b]) =>
    a.name.localeCompare(b.name),
  );

  // ── Column index plan ───────────────────────────────────────────────────────
  // Col 1        : Employee name
  // Cols 2-8     : Mon-Sun (7 day cols)
  // Cols 9..8+N  : One col per template  (N = sortedTemplates.length)
  // Col 9+N      : Extra Hours (OT)
  // Col 10+N     : Total Payable Hours
  const N = sortedTemplates.length;
  const SUMMARY_START = 9;          // first summary col (1-indexed)
  const EXTRA_COL = 9 + N;          // Extra Hours col
  const TOTAL_COL = 10 + N;         // Total Payable Hours col

  // ── Build spreadsheet ───────────────────────────────────────────────────────
  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ShiftFlow";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Schedule", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  // Column widths
  ws.getColumn(1).width = 24;
  for (let i = 2; i <= 8; i++) ws.getColumn(i).width = 15;
  for (let i = SUMMARY_START; i <= TOTAL_COL; i++) ws.getColumn(i).width = 13;
  ws.getColumn(TOTAL_COL).width = 15; // Total is slightly wider

  // ── Row 1: Title ─────────────────────────────────────────────────────────────
  const titleRow = ws.addRow([""]);
  titleRow.height = 24;

  const firstDt = new Date(weekStart + "T00:00:00");
  const lastDt = new Date(weekDates[6] + "T00:00:00");
  const fmtTitle = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  titleRow.getCell(1).value = `${group.name}  ·  Week of ${fmtTitle(firstDt)} – ${fmtTitle(lastDt)}`;
  titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: "FF0F172A" } };
  titleRow.getCell(1).alignment = { vertical: "middle" };

  // ── Row 2: Section header ────────────────────────────────────────────────────
  const sectionRow = ws.addRow([""]);
  sectionRow.height = 20;

  // "Schedule" label spanning employee + day columns
  ws.mergeCells(2, 1, 2, 8);
  const schedCell = sectionRow.getCell(1);
  schedCell.value = "Schedule";
  schedCell.font = { bold: true, size: 9, color: { argb: "FF64748B" } };
  schedCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
  schedCell.alignment = { horizontal: "left", vertical: "middle" };
  schedCell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };

  // "Weekly Totals" merged across all summary columns
  if (TOTAL_COL >= SUMMARY_START) {
    ws.mergeCells(2, SUMMARY_START, 2, TOTAL_COL);
    const totalsCell = sectionRow.getCell(SUMMARY_START);
    totalsCell.value = "Weekly Totals";
    totalsCell.font = { bold: true, size: 9, color: { argb: "FFFFFFFF" } };
    totalsCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
    totalsCell.alignment = { horizontal: "center", vertical: "middle" };
    totalsCell.border = {
      left: { style: "medium", color: { argb: "FF1E293B" } },
      bottom: { style: "thin", color: { argb: "FF475569" } },
    };
  }

  // ── Row 3: Column headers ────────────────────────────────────────────────────
  const headerValues: string[] = [
    "Employee",
    ...weekDates.map((d, i) => {
      const dt = new Date(d + "T00:00:00");
      return `${DAY_NAMES[i]}  ${dt.getDate()}/${dt.getMonth() + 1}`;
    }),
    ...sortedTemplates.map(([, t]) => t.name),
    "Extra Hours",
    "Total Hours",
  ];

  const headerRow = ws.addRow(headerValues);
  headerRow.height = 30;

  headerRow.eachCell((cell, col) => {
    cell.alignment = {
      vertical: "middle",
      horizontal: col === 1 ? "left" : "center",
      wrapText: true,
    };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FFE2E8F0" } },
      left:
        col === SUMMARY_START
          ? { style: "medium", color: { argb: "FF94A3B8" } }
          : undefined,
    };

    if (col <= 8) {
      // Schedule columns: slate-100 bg, slate-700 text
      cell.font = { bold: true, size: 10, color: { argb: "FF334155" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    } else if (col === TOTAL_COL) {
      // Total column: indigo tint
      cell.font = { bold: true, size: 10, color: { argb: "FF1E40AF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
    } else if (col === EXTRA_COL) {
      // Extra hours column: amber tint
      cell.font = { bold: true, size: 10, color: { argb: "FFB45309" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
    } else {
      // Template columns: use lightened template color
      const tmplIndex = col - SUMMARY_START;
      const [, tmpl] = sortedTemplates[tmplIndex] ?? ["", { color: "#94a3b8", name: "" }];
      cell.font = { bold: true, size: 10, color: { argb: darkenToArgb(tmpl.color, 0.65) } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: lightenToArgb(tmpl.color, 0.7) } };
    }
  });

  // ── Rows 4+: Data ─────────────────────────────────────────────────────────────
  for (const member of members) {
    // Per-employee summary calculations
    const tHoursMap = empTemplateHours.get(member.id) ?? new Map<string, number>();
    const extraH = empExtraHours.get(member.id) ?? 0;
    const baseH = [...tHoursMap.values()].reduce((a, b) => a + b, 0);
    const totalH = baseH + extraH;

    const rowValues: (string | number)[] = [
      member.name,
      // Day cells
      ...weekDates.map((d) => shiftMap.get(`${member.id}::${d}`)?.label ?? ""),
      // Template breakdown
      ...sortedTemplates.map(([id]) => {
        const h = tHoursMap.get(id) ?? 0;
        return h > 0 ? h : "";
      }),
      // Extra hours
      extraH > 0 ? extraH : "",
      // Grand total (always shown, even if 0)
      totalH > 0 ? totalH : "—",
    ];

    const row = ws.addRow(rowValues);
    row.height = 28;

    row.eachCell((cell, col) => {
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
        right:
          col < 8
            ? { style: "hair", color: { argb: "FFE2E8F0" } }
            : col === 8
            ? { style: "medium", color: { argb: "FF94A3B8" } } // separator before summaries
            : col < TOTAL_COL
            ? { style: "hair", color: { argb: "FFE2E8F0" } }
            : undefined,
        left:
          col === SUMMARY_START
            ? { style: "medium", color: { argb: "FF94A3B8" } }
            : undefined,
      };

      if (col === 1) {
        // Employee name
        cell.font = { size: 10, color: { argb: "FF0F172A" } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
      } else if (col <= 8) {
        // Day shift cells
        const dayShift = shiftMap.get(`${member.id}::${weekDates[col - 2]}`);
        cell.alignment = { vertical: "middle", horizontal: "center" };
        if (dayShift) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: lightenToArgb(dayShift.color) },
          };
          cell.font = { size: 10, bold: true, color: { argb: darkenToArgb(dayShift.color) } };
        } else {
          cell.font = { size: 10, color: { argb: "FFCBD5E1" } };
        }
      } else if (col === TOTAL_COL) {
        // Grand total: bold, indigo tint
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
        cell.font = {
          size: 10,
          bold: true,
          color: { argb: totalH > 0 ? "FF1E40AF" : "FFCBD5E1" },
        };
      } else if (col === EXTRA_COL) {
        // Extra hours: amber tint when non-zero
        cell.alignment = { vertical: "middle", horizontal: "center" };
        if (extraH > 0) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7ED" } };
          cell.font = { size: 10, bold: true, color: { argb: "FFB45309" } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
          cell.font = { size: 10, color: { argb: "FFCBD5E1" } };
        }
      } else {
        // Template breakdown columns
        const tmplIndex = col - SUMMARY_START;
        const [, tmpl] = sortedTemplates[tmplIndex] ?? ["", { color: "#94a3b8", name: "" }];
        const h = tHoursMap.get(sortedTemplates[tmplIndex]?.[0] ?? "") ?? 0;
        cell.alignment = { vertical: "middle", horizontal: "center" };
        if (h > 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: lightenToArgb(tmpl.color, 0.88) },
          };
          cell.font = { size: 10, bold: true, color: { argb: darkenToArgb(tmpl.color, 0.6) } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
          cell.font = { size: 10, color: { argb: "FFCBD5E1" } };
        }
      }
    });

    // Format summary number cells as numbers so Excel can SUM them
    for (let col = SUMMARY_START; col <= TOTAL_COL; col++) {
      const cell = row.getCell(col);
      if (typeof cell.value === "number") {
        cell.numFmt = '0.##"h"';
      }
    }
  }

  // ── Freeze top 3 rows ─────────────────────────────────────────────────────────
  ws.views = [{ state: "frozen", ySplit: 3 }];

  // ── Respond ──────────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Schedule_Week_${weekStart}_${group.name.replace(/\s+/g, "_")}.xlsx`;

  return new NextResponse(buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
