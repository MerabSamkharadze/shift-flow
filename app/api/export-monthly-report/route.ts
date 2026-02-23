import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse "HH:MM:SS" → decimal hours.
 * Uses Math.max(0, …) so invalid/same-time rows don't produce negatives.
 */
function shiftDurationHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

/** Round to at most 2 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
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
    .select("id, role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Params ──────────────────────────────────────────────────────────────────
  // Expects ?month=YYYY-MM  e.g. ?month=2024-03
  const { searchParams } = req.nextUrl;
  const monthParam = searchParams.get("month");

  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json(
      { error: "Invalid month. Expected YYYY-MM" },
      { status: 400 },
    );
  }

  const [yearStr, monthStr] = monthParam.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed (1 = Jan)

  const monthStart = `${yearStr}-${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate(); // day 0 of next month = last day of this month
  const monthEnd = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // ── Query ───────────────────────────────────────────────────────────────────

  // Step 1: Collect schedule IDs belonging to this company that overlap the month.
  //   week_start_date ≤ monthEnd  AND  week_end_date ≥ monthStart
  //   (covers partial overlaps where a week straddles the month boundary)
  const { data: companySchedules } = await service
    .from("schedules")
    .select("id")
    .eq("company_id", profile.company_id)
    .lte("week_start_date", monthEnd)
    .gte("week_end_date", monthStart);

  const scheduleIds = (companySchedules ?? []).map((s) => s.id);

  // Step 2: Fetch every non-cancelled shift within those schedules for the month,
  //   joined with the assigned employee's name.
  type RawShift = {
    assigned_to: string;
    start_time: string;
    end_time: string;
    extra_hours: number | null;
    users: { first_name: string | null; last_name: string | null } | null;
  };

  const { data: rawShifts, error: shiftsError } = scheduleIds.length
    ? await service
        .from("shifts")
        .select(
          "assigned_to, start_time, end_time, extra_hours, users!shifts_assigned_to_fkey(first_name, last_name)",
        )
        .in("schedule_id", scheduleIds)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .neq("status", "cancelled")
    : { data: [] as RawShift[], error: null };

  if (shiftsError) {
    return NextResponse.json({ error: shiftsError.message }, { status: 500 });
  }

  // ── Aggregate by employee ───────────────────────────────────────────────────

  type ReportRow = {
    employeeName: string;
    regularHours: number; // sum of (end_time - start_time) in decimal hours
    extraHours: number;   // sum of extra_hours column
  };

  const aggregated = new Map<string, ReportRow>();

  for (const raw of (rawShifts ?? []) as unknown as RawShift[]) {
    const duration = shiftDurationHours(raw.start_time, raw.end_time);
    const extra = raw.extra_hours ?? 0;
    const u = raw.users;
    const name = u
      ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "Unknown"
      : "Unknown";

    const existing = aggregated.get(raw.assigned_to);
    if (existing) {
      existing.regularHours += duration;
      existing.extraHours += extra;
    } else {
      aggregated.set(raw.assigned_to, {
        employeeName: name,
        regularHours: duration,
        extraHours: extra,
      });
    }
  }

  // Sort alphabetically by name
  const rows = [...aggregated.values()].sort((a, b) =>
    a.employeeName.localeCompare(b.employeeName),
  );

  // Grand totals
  const totalRegular = round2(rows.reduce((s, r) => s + r.regularHours, 0));
  const totalExtra = round2(rows.reduce((s, r) => s + r.extraHours, 0));
  const totalAll = round2(totalRegular + totalExtra);

  // ── Build Excel ─────────────────────────────────────────────────────────────

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ShiftFlow";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Monthly Report", {
    pageSetup: { orientation: "portrait", fitToPage: true, fitToWidth: 1 },
  });

  // Column widths
  ws.getColumn(1).width = 28; // Employee Name
  ws.getColumn(2).width = 18; // Regular Hours
  ws.getColumn(3).width = 16; // Extra Hours
  ws.getColumn(4).width = 16; // Total Hours

  // ── Row 1: Title ──────────────────────────────────────────────────────────────
  ws.mergeCells("A1:D1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `Monthly Hours Report  ·  ${monthLabel}`;
  titleCell.font = { bold: true, size: 14, color: { argb: "FF0F172A" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8FAFC" },
  };
  ws.getRow(1).height = 32;

  // ── Row 2: Column headers ─────────────────────────────────────────────────────
  const headerRow = ws.addRow([
    "Employee Name",
    "Regular Hours",
    "Extra Hours",
    "Total Hours",
  ]);
  headerRow.height = 26;

  headerRow.eachCell((cell, col) => {
    cell.alignment = {
      vertical: "middle",
      horizontal: col === 1 ? "left" : "center",
    };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FFE2E8F0" } },
    };

    if (col === 1 || col === 2) {
      cell.font = { bold: true, size: 10, color: { argb: "FF334155" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
    } else if (col === 3) {
      // Extra hours: amber
      cell.font = { bold: true, size: 10, color: { argb: "FFB45309" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFEF3C7" },
      };
    } else if (col === 4) {
      // Total: indigo
      cell.font = { bold: true, size: 10, color: { argb: "FF1E40AF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDBEAFE" },
      };
    }
  });

  // ── Rows 3+: Data ─────────────────────────────────────────────────────────────
  for (const row of rows) {
    const regular = round2(row.regularHours);
    const extra = round2(row.extraHours);
    const total = round2(regular + extra);

    const dataRow = ws.addRow([
      row.employeeName,
      regular,
      extra > 0 ? extra : "",
      total,
    ]);
    dataRow.height = 22;

    dataRow.eachCell((cell, col) => {
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: col === 1 ? "left" : "center",
      };

      if (col === 1) {
        cell.font = { size: 10, color: { argb: "FF0F172A" } };
      } else if (col === 3 && extra > 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF7ED" },
        };
        cell.font = { size: 10, bold: true, color: { argb: "FFB45309" } };
      } else if (col === 4) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEFF6FF" },
        };
        cell.font = {
          size: 10,
          bold: true,
          color: { argb: total > 0 ? "FF1E40AF" : "FFCBD5E1" },
        };
      } else {
        cell.font = { size: 10, color: { argb: "FF334155" } };
      }
    });

    // Number format: "8h", "8.5h" etc.
    for (const col of [2, 3, 4]) {
      const cell = dataRow.getCell(col);
      if (typeof cell.value === "number") {
        cell.numFmt = '0.##"h"';
      }
    }
  }

  // ── Totals row ────────────────────────────────────────────────────────────────
  ws.addRow([]); // spacer

  const totalsRow = ws.addRow([
    "TOTAL",
    totalRegular > 0 ? totalRegular : "—",
    totalExtra > 0 ? totalExtra : "—",
    totalAll > 0 ? totalAll : "—",
  ]);
  totalsRow.height = 26;

  totalsRow.eachCell((cell, col) => {
    cell.border = { top: { style: "medium", color: { argb: "FFE2E8F0" } } };
    cell.alignment = {
      vertical: "middle",
      horizontal: col === 1 ? "left" : "center",
    };

    if (col === 1) {
      cell.font = { bold: true, size: 10, color: { argb: "FF334155" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
    } else if (col === 3 && totalExtra > 0) {
      cell.font = { bold: true, size: 10, color: { argb: "FFB45309" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFEF3C7" },
      };
    } else if (col === 4) {
      cell.font = { bold: true, size: 10, color: { argb: "FF1E40AF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDBEAFE" },
      };
    } else {
      cell.font = { bold: true, size: 10, color: { argb: "FF334155" } };
    }
  });

  for (const col of [2, 3, 4]) {
    const cell = totalsRow.getCell(col);
    if (typeof cell.value === "number") {
      cell.numFmt = '0.##"h"';
    }
  }

  // ── Freeze header rows ────────────────────────────────────────────────────────
  ws.views = [{ state: "frozen", ySplit: 2 }];

  // ── Respond ───────────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Monthly_Report_${monthParam}.xlsx"`,
    },
  });
}
