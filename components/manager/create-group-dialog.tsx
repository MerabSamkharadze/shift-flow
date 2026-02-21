"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SimpleDialog } from "@/components/ui/simple-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGroup } from "@/app/actions/manager";

const COLORS = [
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f97316", // orange
  "#f43f5e", // rose
  "#a855f7", // purple
];

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setColor(COLORS[0]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("color", color);
    setError(null);

    startTransition(async () => {
      const result = await createGroup(formData);
      if (result.error) {
        setError(result.error);
      } else {
        handleClose();
        router.push(`/manager/groups/${result.groupId}`);
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus size={15} className="mr-1.5" />
        New Group
      </Button>

      <SimpleDialog open={open} onClose={handleClose} title="Create group">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Waiters"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-6 h-6 rounded-full transition-transform",
                    color === c && "scale-110",
                  )}
                  style={{
                    backgroundColor: c,
                    boxShadow:
                      color === c
                        ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${c}`
                        : "none",
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </SimpleDialog>
    </>
  );
}
