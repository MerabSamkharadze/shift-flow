"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimpleDialog } from "@/components/ui/simple-dialog";
import {
  deactivateManager,
  reactivateManager,
  reassignManagerGroups,
} from "@/app/actions/owner";
import { cn } from "@/lib/utils";

type Manager = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
};

type Status = "active" | "pending" | "inactive";

function getStatus(m: Manager): Status {
  if (!m.is_active) return "inactive";
  if (m.must_change_password) return "pending";
  return "active";
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
        status === "pending" &&
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
        status === "inactive" && "text-muted-foreground",
      )}
    >
      {status === "active" && "Active"}
      {status === "pending" && "Invite pending"}
      {status === "inactive" && "Inactive"}
    </Badge>
  );
}

function DeactivateButton({
  managerId,
  managerName,
}: {
  managerId: string;
  managerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deactivateManager(managerId);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
      >
        Deactivate
      </button>

      <SimpleDialog
        open={open}
        onClose={() => !isPending && setOpen(false)}
        title="Deactivate manager"
      >
        <p className="text-sm text-muted-foreground mb-2">
          Deactivate{" "}
          <span className="font-medium text-foreground">{managerName}</span>?
          They will be signed out and can no longer log in.
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Their groups, schedules and pending swap requests will be left without
          a manager and cannot be edited or approved until reassigned. This
          cannot be undone from here.
        </p>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Deactivating…" : "Deactivate"}
          </Button>
        </div>
      </SimpleDialog>
    </>
  );
}

function ReactivateButton({ managerId }: { managerId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await reactivateManager(managerId);
          if (!result?.error) router.refresh();
        })
      }
      className="text-xs text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-40"
    >
      {isPending ? "…" : "Reactivate"}
    </button>
  );
}

function ReassignGroupsButton({
  managerId,
  managerName,
  targets,
}: {
  managerId: string;
  managerName: string;
  targets: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [toId, setToId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    if (!toId) {
      setError("Pick a manager to reassign to");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await reassignManagerGroups(managerId, toId);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setToId("");
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setToId("");
          setOpen(true);
        }}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Reassign groups
      </button>

      <SimpleDialog
        open={open}
        onClose={() => !isPending && setOpen(false)}
        title="Reassign groups"
      >
        <p className="text-sm text-muted-foreground mb-4">
          Move all groups and schedules owned by{" "}
          <span className="font-medium text-foreground">{managerName}</span> to
          another manager. Useful when a manager has been deactivated and their
          groups need an active owner.
        </p>
        {targets.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-4">
            There is no other active manager to reassign to. Invite or reactivate
            one first.
          </p>
        ) : (
          <div className="space-y-1.5 mb-4">
            <label
              htmlFor={`reassign-${managerId}`}
              className="text-sm font-medium"
            >
              Reassign to
            </label>
            <select
              id={`reassign-${managerId}`}
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a manager…</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || targets.length === 0}
          >
            {isPending ? "Reassigning…" : "Reassign"}
          </Button>
        </div>
      </SimpleDialog>
    </>
  );
}

export function ManagersTable({ managers }: { managers: Manager[] }) {
  if (managers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No managers yet. Use &ldquo;Add Manager&rdquo; to send an invite.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">
              Name
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">
              Email
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">
              Status
            </th>
            <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">
              Added
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {managers.map((m, i) => {
            const status = getStatus(m);
            return (
              <tr
                key={m.id}
                className={
                  i !== managers.length - 1 ? "border-b border-border" : ""
                }
              >
                <td className="px-4 py-3 font-medium whitespace-nowrap">
                  {m.first_name} {m.last_name}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.email}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(m.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <ReassignGroupsButton
                      managerId={m.id}
                      managerName={`${m.first_name} ${m.last_name}`}
                      targets={managers
                        .filter((x) => x.is_active && x.id !== m.id)
                        .map((x) => ({
                          id: x.id,
                          name: `${x.first_name} ${x.last_name}`,
                        }))}
                    />
                    {m.is_active ? (
                      <DeactivateButton
                        managerId={m.id}
                        managerName={`${m.first_name} ${m.last_name}`}
                      />
                    ) : (
                      <ReactivateButton managerId={m.id} />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
