"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createShiftTemplate } from "@/app/actions/manager";

export function AddTemplateForm({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await createShiftTemplate(groupId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setOpen(false);
        router.refresh();
      }
    });
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} className="mr-1.5" />
        Add template
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tpl-name" className="text-xs">
            Name
          </Label>
          <Input
            id="tpl-name"
            name="name"
            placeholder="e.g. Morning"
            className="h-8 text-sm"
            autoFocus
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tpl-start" className="text-xs">
            Start
          </Label>
          <Input
            id="tpl-start"
            name="start_time"
            type="time"
            className="h-8 text-sm"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tpl-end" className="text-xs">
            End
          </Label>
          <Input
            id="tpl-end"
            name="end_time"
            type="time"
            className="h-8 text-sm"
            required
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
