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

/**
 * "#3b82f6" → "FFCCE3FD"  (lightened by mixing with white at `factor`)
 * Used for cell background fills.
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
 * "#3b82f6" → "FF1E4E9A"  (darkened for text on the lightened background)
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

  const { data: shiftsRaw } = schedule
    ? await service
        .from("shifts")
        .select(
          "assigned_to, date, start_time, end_time, extra_hours, shift_templates(color)",
        )
        .eq("schedule_id", schedule.id)
        .gte("date", weekStart)
        .lte("date", weekEnd)
    : { data: [] as never[] };

  // Build shift lookup: "userId::date" → { label, color }
  const shiftMap = new Map<string, { label: string; color: string }>();
  for (const s of shiftsRaw ?? []) {
    const templateData = (
      s as unknown as { shift_templates: { color: string | null } | null }
    ).shift_templates;
    const color = templateData?.color ?? "#3b82f6";
    const extra = (s as { extra_hours?: number | null }).extra_hours;
    const label =
      `${fmtTime(s.start_time)}-${fmtTime(s.end_time)}` +
      (extra && extra > 0 ? ` +${extra}h` : "");
    shiftMap.set(`${s.assigned_to}::${s.date}`, { label, color });
  }

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
  for (let i = 2; i <= 8; i++) {
    ws.getColumn(i).width = 15;
  }

  // ── Header row ──────────────────────────────────────────────────────────────
  const headerLabels = [
    "Employee",
    ...weekDates.map((d, i) => {
      const dt = new Date(d + "T00:00:00");
      return `${DAY_NAMES[i]}  ${dt.getDate()}/${dt.getMonth() + 1}`;
    }),
  ];

  const headerRow = ws.addRow(headerLabels);
  headerRow.height = 30;

  headerRow.eachCell((cell, col) => {
    cell.font = { bold: true, size: 10, color: { argb: "FF334155" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: col === 1 ? "left" : "center",
    };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FFE2E8F0" } },
    };
  });

  // ── Group + week title above the header (row 0) ─────────────────────────────
  ws.spliceRows(1, 0, []); // insert a blank row at the top

  const titleRow = ws.getRow(1);
  titleRow.height = 22;
  const firstDt = new Date(weekStart + "T00:00:00");
  const lastDt = new Date(weekDates[6] + "T00:00:00");
  const fmtTitle = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  titleRow.getCell(1).value = `${group.name}  ·  Week of ${fmtTitle(firstDt)} – ${fmtTitle(lastDt)}`;
  titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: "FF0F172A" } };
  titleRow.getCell(1).alignment = { vertical: "middle" };

  // ── Data rows ────────────────────────────────────────────────────────────────
  for (const member of members) {
    const rowValues: string[] = [member.name];
    const rowColors: (string | null)[] = [null];

    for (const date of weekDates) {
      const cell = shiftMap.get(`${member.id}::${date}`);
      rowValues.push(cell?.label ?? "");
      rowColors.push(cell?.color ?? null);
    }

    const row = ws.addRow(rowValues);
    row.height = 28;

    row.eachCell((cell, colNumber) => {
      const color = rowColors[colNumber - 1];

      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber === 1 ? "left" : "center",
      };
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
        right:
          colNumber < 8
            ? { style: "hair", color: { argb: "FFE2E8F0" } }
            : undefined,
      };

      if (color && colNumber > 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: lightenToArgb(color) },
        };
        cell.font = {
          size: 10,
          bold: true,
          color: { argb: darkenToArgb(color) },
        };
      } else {
        cell.font = { size: 10, color: { argb: "FF64748B" } };
      }
    });

    // Employee name cell: always dark
    row.getCell(1).font = { size: 10, bold: false, color: { argb: "FF0F172A" } };
  }

  // Freeze the header row (row 2 after splice)
  ws.views = [{ state: "frozen", ySplit: 2 }];

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
