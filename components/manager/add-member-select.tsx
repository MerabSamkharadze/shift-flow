"use client";

import { useTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addGroupMember } from "@/app/actions/manager";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export function AddMemberSelect({
  groupId,
  available,
}: {
  groupId: string;
  available: Employee[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const ref = useRef<HTMLSelectElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const userId = e.target.value;
    if (!userId) return;
    setError(null);

    startTransition(async () => {
      const result = await addGroupMember(groupId, userId);
      if (result.error) {
        setError(result.error);
      } else {
        if (ref.current) ref.current.value = "";
        router.refresh();
      }
    });
  }

  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        All active employees are already in this group.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <select
        ref={ref}
        onChange={handleChange}
        disabled={isPending}
        defaultValue=""
        className="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      >
        <option value="" disabled>
          {isPending ? "Adding…" : "Add employee…"}
        </option>
        {available.map((e) => (
          <option key={e.id} value={e.id}>
            {e.first_name} {e.last_name}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
