"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTemplateForm } from "@/components/manager/add-template-form";
import { AddMemberSelect } from "@/components/manager/add-member-select";
import { deleteShiftTemplate, removeGroupMember } from "@/app/actions/manager";

// ─── Types ────────────────────────────────────────────────────────────────────

type Template = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string | null;
};

type Member = {
  memberId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type Tab = "templates" | "members";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "09:00:00" → "09:00" */
function fmt(time: string) {
  return time.slice(0, 5);
}

// ─── Small action buttons ─────────────────────────────────────────────────────

function DeleteTemplateBtn({
  templateId,
  groupId,
}: {
  templateId: string;
  groupId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="inline-flex items-center gap-1">
      {error && <span className="text-[10px] text-destructive">{error}</span>}
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await deleteShiftTemplate(templateId, groupId);
            if (result?.error) {
              setError(result.error);
            } else {
              router.refresh();
            }
          })
        }
        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
        title="Delete template"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function RemoveMemberBtn({
  memberId,
  groupId,
}: {
  memberId: string;
  groupId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="inline-flex items-center gap-1">
      {error && <span className="text-[10px] text-destructive">{error}</span>}
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await removeGroupMember(memberId, groupId);
            if (result?.error) {
              setError(result.error);
            } else {
              router.refresh();
            }
          })
        }
        className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
      >
        {isPending ? "…" : "Remove"}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GroupDetailTabs({
  groupId,
  templates,
  members,
  available,
}: {
  groupId: string;
  templates: Template[];
  members: Member[];
  available: Employee[];
}) {
  const [tab, setTab] = useState<Tab>("templates");

  return (
    <div>
      {/* Tab nav */}
      <div className="flex border-b border-border mb-6">
        {(["templates", "members"] as Tab[]).map((t) => (
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
            {t === "templates" ? "Shift Templates" : "Members"}
            <span className="ml-1.5 text-xs text-muted-foreground">
              {t === "templates" ? templates.length : members.length}
            </span>
          </button>
        ))}
      </div>

      {/* Shift Templates tab */}
      {tab === "templates" && (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No shift templates yet.
            </p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Name
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      Start
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                      End
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t, i) => (
                    <tr
                      key={t.id}
                      className={
                        i !== templates.length - 1
                          ? "border-b border-border"
                          : ""
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.color ?? "#3b82f6" }}
                          />
                          <span className="font-medium">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fmt(t.start_time)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fmt(t.end_time)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DeleteTemplateBtn
                          templateId={t.id}
                          groupId={groupId}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AddTemplateForm groupId={groupId} />
        </div>
      )}

      {/* Members tab */}
      {tab === "members" && (
        <div className="space-y-4">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">
                      Name
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">
                      Email
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr
                      key={m.memberId}
                      className={
                        i !== members.length - 1 ? "border-b border-border" : ""
                      }
                    >
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {m.firstName} {m.lastName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {m.email}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RemoveMemberBtn
                          memberId={m.memberId}
                          groupId={groupId}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AddMemberSelect groupId={groupId} available={available} />
        </div>
      )}
    </div>
  );
}
