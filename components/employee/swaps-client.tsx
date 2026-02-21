"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  acceptSwap,
  rejectSwap,
  cancelSwap,
  takePublicShift,
} from "@/app/actions/employee";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MySwapRow = {
  id: string;
  type: "direct" | "public";
  status: string;
  createdAt: string;
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  groupName: string;
  groupColor: string;
  recipientName: string | null; // null = public swap
};

export type IncomingSwapRow = {
  id: string;
  requesterName: string;
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  groupName: string;
  groupColor: string;
  createdAt: string;
};

export type PublicSwapRow = {
  id: string;
  requesterName: string;
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  groupName: string;
  groupColor: string;
  createdAt: string;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtTime(t: string) {
  return t.slice(0, 5);
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function MyStatusBadge({ swap }: { swap: MySwapRow }) {
  const { status, type } = swap;

  const [label, cls] = (() => {
    if (status === "pending_employee" && type === "direct")
      return [
        "Awaiting response",
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
      ];
    if (status === "pending_employee" && type === "public")
      return [
        "On public board",
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400",
      ];
    if (status === "accepted_by_employee" || status === "pending_manager")
      return [
        "Awaiting manager approval",
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
      ];
    if (status === "approved")
      return [
        "Approved",
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
      ];
    if (status === "rejected_by_employee")
      return ["Declined", "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"];
    if (status === "rejected_by_manager")
      return ["Rejected by manager", "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"];
    if (status === "cancelled")
      return ["Cancelled", "text-muted-foreground"];
    return ["Expired", "text-muted-foreground"];
  })();

  return (
    <Badge variant="outline" className={cls}>
      {label}
    </Badge>
  );
}

// ─── Action buttons ───────────────────────────────────────────────────────────

function CancelButton({ swapId }: { swapId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await cancelSwap(swapId);
          router.refresh();
        })
      }
      className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
    >
      {isPending ? "…" : "Cancel"}
    </button>
  );
}

function AcceptButton({ swapId }: { swapId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await acceptSwap(swapId);
          router.refresh();
        })
      }
      className="text-xs font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 transition-colors disabled:opacity-40"
    >
      {isPending ? "…" : "Accept"}
    </button>
  );
}

function RejectButton({ swapId }: { swapId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await rejectSwap(swapId);
          router.refresh();
        })
      }
      className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
    >
      {isPending ? "…" : "Reject"}
    </button>
  );
}

function TakeButton({ swapId }: { swapId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await takePublicShift(swapId);
          router.refresh();
        })
      }
    >
      {isPending ? "Claiming…" : "Take This Shift"}
    </Button>
  );
}

// ─── Shared empty state ───────────────────────────────────────────────────────

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Shift cell ───────────────────────────────────────────────────────────────

function ShiftInfo({
  date,
  start,
  end,
  groupName,
  groupColor,
}: {
  date: string;
  start: string;
  end: string;
  groupName: string;
  groupColor: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium">
        {fmtDate(date)} · {fmtTime(start)}–{fmtTime(end)}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: groupColor }}
        />
        <span className="text-xs text-muted-foreground">{groupName}</span>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "mine" | "incoming" | "public";

// ─── Main component ───────────────────────────────────────────────────────────

export function SwapsClient({
  mySwaps,
  incoming,
  publicBoard,
}: {
  mySwaps: MySwapRow[];
  incoming: IncomingSwapRow[];
  publicBoard: PublicSwapRow[];
}) {
  const [tab, setTab] = useState<Tab>("mine");

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "mine", label: "My Requests", count: mySwaps.length },
    { id: "incoming", label: "Incoming", count: incoming.length },
    { id: "public", label: "Public Board", count: publicBoard.length },
  ];

  return (
    <>
      {/* Tab nav */}
      <div className="flex border-b border-border mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* My Requests */}
      {tab === "mine" && (
        <>
          {mySwaps.length === 0 ? (
            <Empty message="You haven't sent any swap requests yet." />
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Shift
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      To
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Status
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Requested
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {mySwaps.map((s, i) => (
                    <tr
                      key={s.id}
                      className={
                        i !== mySwaps.length - 1 ? "border-b border-border" : ""
                      }
                    >
                      <td className="px-4 py-3">
                        <ShiftInfo
                          date={s.shiftDate}
                          start={s.shiftStart}
                          end={s.shiftEnd}
                          groupName={s.groupName}
                          groupColor={s.groupColor}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.recipientName ?? (
                          <span className="text-violet-600 dark:text-violet-400 font-medium">
                            Public
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <MyStatusBadge swap={s} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {fmtDateTime(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.status === "pending_employee" && (
                          <CancelButton swapId={s.id} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Incoming */}
      {tab === "incoming" && (
        <>
          {incoming.length === 0 ? (
            <Empty message="No incoming swap requests right now." />
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      From
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Shift
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Requested
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {incoming.map((s, i) => (
                    <tr
                      key={s.id}
                      className={
                        i !== incoming.length - 1
                          ? "border-b border-border"
                          : ""
                      }
                    >
                      <td className="px-4 py-3 font-medium">
                        {s.requesterName}
                      </td>
                      <td className="px-4 py-3">
                        <ShiftInfo
                          date={s.shiftDate}
                          start={s.shiftStart}
                          end={s.shiftEnd}
                          groupName={s.groupName}
                          groupColor={s.groupColor}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {fmtDateTime(s.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 justify-end">
                          <AcceptButton swapId={s.id} />
                          <RejectButton swapId={s.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Public Board */}
      {tab === "public" && (
        <>
          {publicBoard.length === 0 ? (
            <Empty message="No open shifts on the public board right now." />
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Employee
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Shift
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Posted
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {publicBoard.map((s, i) => (
                    <tr
                      key={s.id}
                      className={
                        i !== publicBoard.length - 1
                          ? "border-b border-border"
                          : ""
                      }
                    >
                      <td className="px-4 py-3 font-medium">
                        {s.requesterName}
                      </td>
                      <td className="px-4 py-3">
                        <ShiftInfo
                          date={s.shiftDate}
                          start={s.shiftStart}
                          end={s.shiftEnd}
                          groupName={s.groupName}
                          groupColor={s.groupColor}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {fmtDateTime(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <TakeButton swapId={s.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
