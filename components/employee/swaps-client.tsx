"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
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
  recipientName: string | null;
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

export type MyClaimRow = {
  id: string;
  originalOwnerName: string;
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  groupName: string;
  groupColor: string;
  status: string;
  claimedAt: string;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtTime(t: string) {
  return t.slice(0, 5);
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
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

// ─── Status badge (My Requests) ───────────────────────────────────────────────

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
        "Awaiting manager",
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
      ];
    if (status === "approved")
      return [
        "Approved",
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
      ];
    if (status === "rejected_by_employee")
      return [
        "Declined",
        "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
      ];
    if (status === "rejected_by_manager")
      return [
        "Rejected",
        "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
      ];
    if (status === "cancelled") return ["Cancelled", "text-muted-foreground"];
    return ["Expired", "text-muted-foreground"];
  })();

  return (
    <Badge variant="outline" className={cn("shrink-0", cls)}>
      {label}
    </Badge>
  );
}

// ─── Claim status badge ───────────────────────────────────────────────────────

function ClaimStatusBadge({ status }: { status: string }) {
  if (status === "accepted_by_employee" || status === "pending_manager") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
        <Clock size={11} />
        Waiting for manager
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
        <CheckCircle2 size={11} />
        Approved — shift is yours
      </span>
    );
  }
  if (status === "rejected_by_manager") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
        <XCircle size={11} />
        Rejected by manager
      </span>
    );
  }
  return null;
}

// ─── Action buttons ───────────────────────────────────────────────────────────

function CancelButton({ swapId }: { swapId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await cancelSwap(swapId);
          router.refresh();
        })
      }
      className="min-h-[44px] text-muted-foreground hover:text-destructive"
    >
      {isPending ? "Cancelling…" : "Cancel"}
    </Button>
  );
}

function AcceptButton({ swapId }: { swapId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await acceptSwap(swapId);
          router.refresh();
        })
      }
      className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      {isPending ? "Accepting…" : "Accept"}
    </Button>
  );
}

function RejectButton({ swapId }: { swapId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await rejectSwap(swapId);
          router.refresh();
        })
      }
      className="flex-1 min-h-[44px]"
    >
      {isPending ? "Declining…" : "Decline"}
    </Button>
  );
}

function TakeButton({ swapId }: { swapId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await takePublicShift(swapId);
          if (result?.error) {
            toast.error(result.error);
          } else {
            toast.success("Request sent! Waiting for manager approval.");
            router.refresh();
          }
        })
      }
      className="w-full min-h-[44px]"
    >
      {isPending ? "Claiming…" : "Claim This Shift"}
    </Button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Shift summary strip ──────────────────────────────────────────────────────

function ShiftStrip({
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
    <div className="rounded-xl bg-muted/50 px-3 py-2.5">
      <p className="text-sm font-semibold tabular-nums">
        {fmtTime(start)}–{fmtTime(end)}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <p className="text-xs text-muted-foreground">{fmtDate(date)}</p>
        <span className="text-muted-foreground/40">·</span>
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: groupColor }}
        />
        <span className="text-xs text-muted-foreground">{groupName}</span>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "available" | "claims" | "mine" | "incoming";

// ─── Main component ───────────────────────────────────────────────────────────

export function SwapsClient({
  mySwaps,
  incoming,
  publicBoard,
  myClaims,
}: {
  mySwaps: MySwapRow[];
  incoming: IncomingSwapRow[];
  publicBoard: PublicSwapRow[];
  myClaims: MyClaimRow[];
}) {
  const [tab, setTab] = useState<Tab>("available");

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "available", label: "Available", count: publicBoard.length },
    { id: "claims", label: "My Claims", count: myClaims.filter(c => c.status === "accepted_by_employee" || c.status === "pending_manager").length },
    { id: "mine", label: "Mine", count: mySwaps.length },
    { id: "incoming", label: "Incoming", count: incoming.length },
  ];

  return (
    <>
      {/* Tab nav */}
      <div className="flex border-b border-border mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 py-3 text-xs font-medium border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Available Shifts */}
      {tab === "available" && (
        <>
          {publicBoard.length === 0 ? (
            <Empty message="No open shifts available right now. Check back later." />
          ) : (
            <div className="space-y-3">
              {publicBoard.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">{s.requesterName}</p>
                      <p className="text-xs text-muted-foreground">
                        is giving away a shift
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {fmtDateTime(s.createdAt)}
                    </p>
                  </div>
                  <ShiftStrip
                    date={s.shiftDate}
                    start={s.shiftStart}
                    end={s.shiftEnd}
                    groupName={s.groupName}
                    groupColor={s.groupColor}
                  />
                  <div className="mt-4">
                    <TakeButton swapId={s.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Claims */}
      {tab === "claims" && (
        <>
          {myClaims.length === 0 ? (
            <Empty message="You haven't claimed any shifts yet." />
          ) : (
            <div className="space-y-3">
              {myClaims.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">
                        From {s.originalOwnerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Claimed {fmtDateTime(s.claimedAt)}
                      </p>
                    </div>
                  </div>
                  <ShiftStrip
                    date={s.shiftDate}
                    start={s.shiftStart}
                    end={s.shiftEnd}
                    groupName={s.groupName}
                    groupColor={s.groupColor}
                  />
                  <div className="mt-3">
                    <ClaimStatusBadge status={s.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Mine — my own giveaway requests */}
      {tab === "mine" && (
        <>
          {mySwaps.length === 0 ? (
            <Empty message="You haven't sent any swap requests yet." />
          ) : (
            <div className="space-y-3">
              {mySwaps.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {s.type === "public" ? (
                          <span className="text-violet-600 dark:text-violet-400 font-medium">
                            Public board
                          </span>
                        ) : (
                          <>
                            To:{" "}
                            <span className="font-medium text-foreground">
                              {s.recipientName}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDateTime(s.createdAt)}
                      </p>
                    </div>
                    <MyStatusBadge swap={s} />
                  </div>
                  <ShiftStrip
                    date={s.shiftDate}
                    start={s.shiftStart}
                    end={s.shiftEnd}
                    groupName={s.groupName}
                    groupColor={s.groupColor}
                  />
                  {s.status === "pending_employee" && (
                    <div className="flex justify-end mt-2">
                      <CancelButton swapId={s.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Incoming — direct requests to me */}
      {tab === "incoming" && (
        <>
          {incoming.length === 0 ? (
            <Empty message="No incoming swap requests right now." />
          ) : (
            <div className="space-y-3">
              {incoming.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">{s.requesterName}</p>
                      <p className="text-xs text-muted-foreground">
                        wants to give you a shift
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {fmtDateTime(s.createdAt)}
                    </p>
                  </div>
                  <ShiftStrip
                    date={s.shiftDate}
                    start={s.shiftStart}
                    end={s.shiftEnd}
                    groupName={s.groupName}
                    groupColor={s.groupColor}
                  />
                  <div className="flex gap-2 mt-4">
                    <AcceptButton swapId={s.id} />
                    <RejectButton swapId={s.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
