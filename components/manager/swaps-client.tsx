"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SimpleDialog } from "@/components/ui/simple-dialog";
import { Button } from "@/components/ui/button";
import { approveSwap, rejectSwap } from "@/app/actions/manager";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SwapRow = {
  id: string;
  type: "direct" | "public";
  status: "pending" | "accepted" | "approved" | "rejected" | "expired";
  createdAt: string;
  managerNote: string | null;
  shiftDate: string;    // "YYYY-MM-DD"
  shiftStart: string;   // "HH:MM:SS"
  shiftEnd: string;     // "HH:MM:SS"
  groupName: string;
  requesterName: string;
  recipientName: string | null; // null = public swap (no specific recipient yet)
};

type Tab = "pending" | "all";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  // Append time to avoid UTC offset shifting the date
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fmtTime(t: string) {
  return t.slice(0, 5); // "09:00:00" → "09:00"
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function TypeBadge({ type }: { type: SwapRow["type"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        type === "direct" &&
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
        type === "public" &&
          "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400",
      )}
    >
      {type === "direct" ? "Direct" : "Public"}
    </Badge>
  );
}

function StatusBadge({ status }: { status: SwapRow["status"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "pending" && "text-muted-foreground",
        status === "accepted" &&
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
        status === "approved" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
        status === "rejected" &&
          "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
        status === "expired" && "text-muted-foreground",
      )}
    >
      {status === "pending" && "Awaiting acceptance"}
      {status === "accepted" && "Pending approval"}
      {status === "approved" && "Approved"}
      {status === "rejected" && "Rejected"}
      {status === "expired" && "Expired"}
    </Badge>
  );
}

function ApproveButton({ swapId }: { swapId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await approveSwap(swapId);
          router.refresh();
        })
      }
      className="text-xs font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 transition-colors disabled:opacity-40"
    >
      {isPending ? "…" : "Approve"}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SwapsClient({ swaps }: { swaps: SwapRow[] }) {
  const [tab, setTab] = useState<Tab>("pending");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [isRejecting, startReject] = useTransition();
  const router = useRouter();

  const displayed =
    tab === "pending" ? swaps.filter((s) => s.status === "accepted") : swaps;

  const pendingCount = swaps.filter((s) => s.status === "accepted").length;

  function handleConfirmReject() {
    if (!rejectId) return;
    startReject(async () => {
      await rejectSwap(rejectId, rejectNote);
      setRejectId(null);
      setRejectNote("");
      router.refresh();
    });
  }

  return (
    <>
      {/* Tab nav */}
      <div className="flex border-b border-border mb-6">
        {(["pending", "all"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "pending" ? "Pending Approval" : "All History"}
            {t === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {tab === "pending"
              ? "No swap requests pending approval."
              : "No swap requests found."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  From
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  To
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  Shift
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  Type
                </th>
                {tab === "all" && (
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">
                    Status
                  </th>
                )}
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  Requested
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayed.map((s, i) => (
                <tr
                  key={s.id}
                  className={
                    i !== displayed.length - 1 ? "border-b border-border" : ""
                  }
                >
                  {/* From */}
                  <td className="px-4 py-3 font-medium">{s.requesterName}</td>

                  {/* To */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.recipientName ?? (
                      <span className="text-violet-600 dark:text-violet-400 font-medium">
                        Public
                      </span>
                    )}
                  </td>

                  {/* Shift date + time + group */}
                  <td className="px-4 py-3">
                    <div className="font-medium whitespace-nowrap">
                      {fmtDate(s.shiftDate)},{" "}
                      {fmtTime(s.shiftStart)}–{fmtTime(s.shiftEnd)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.groupName}
                    </div>
                  </td>

                  {/* Type badge */}
                  <td className="px-4 py-3">
                    <TypeBadge type={s.type} />
                  </td>

                  {/* Status badge — only in "all" tab */}
                  {tab === "all" && (
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                  )}

                  {/* Requested date */}
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(s.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {s.status === "accepted" && (
                      <div className="flex items-center gap-3 justify-end">
                        <ApproveButton swapId={s.id} />
                        <button
                          onClick={() => {
                            setRejectId(s.id);
                            setRejectNote("");
                          }}
                          className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject dialog */}
      <SimpleDialog
        open={rejectId !== null}
        onClose={() => setRejectId(null)}
        title="Reject swap request"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The employees will be notified. You can optionally add a reason.
          </p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Reason{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Insufficient staffing on that day"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectId(null)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={isRejecting}
            >
              {isRejecting ? "Rejecting…" : "Confirm reject"}
            </Button>
          </div>
        </div>
      </SimpleDialog>
    </>
  );
}
