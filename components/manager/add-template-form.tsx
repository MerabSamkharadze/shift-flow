"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createShiftTemplate } from "@/app/actions/manager";

const COLORS = [
  { hex: "#10b981", label: "Emerald" },
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#f59e0b", label: "Amber" },
  { hex: "#6366f1", label: "Indigo" },
  { hex: "#ef4444", label: "Red" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#06b6d4", label: "Cyan" },
  { hex: "#64748b", label: "Slate" },
];

const DEFAULT_COLOR = "#3b82f6";

export function AddTemplateForm({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("color", color);
    setError(null);

    startTransition(async () => {
      const result = await createShiftTemplate(groupId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setColor(DEFAULT_COLOR);
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

      <div className="space-y-1.5">
        <Label className="text-xs">Color</Label>
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.label}
              onClick={() => setColor(c.hex)}
              className={cn(
                "w-5 h-5 rounded-full transition-transform shrink-0",
                color === c.hex && "scale-125",
              )}
              style={{
                backgroundColor: c.hex,
                boxShadow:
                  color === c.hex
                    ? `0 0 0 2px hsl(var(--background)), 0 0 0 3.5px ${c.hex}`
                    : "none",
              }}
            />
          ))}
          <span
            className="ml-2 text-xs text-muted-foreground tabular-nums"
            style={{ color }}
          >
            {COLORS.find((c) => c.hex === color)?.label ?? color}
          </span>
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
            setColor(DEFAULT_COLOR);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
