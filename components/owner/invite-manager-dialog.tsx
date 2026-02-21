"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { SimpleDialog } from "@/components/ui/simple-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteManager } from "@/app/actions/owner";

export function InviteManagerDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setSent(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await inviteManager(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus size={15} className="mr-1.5" />
        Add Manager
      </Button>

      <SimpleDialog open={open} onClose={handleClose} title="Invite manager">
        {sent ? (
          <div className="py-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Invite sent! The manager will receive an email to set up their
              account.
            </p>
            <Button size="sm" variant="outline" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  placeholder="Jane"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jane@company.com"
                required
              />
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
                {isPending ? "Sending…" : "Send invite"}
              </Button>
            </div>
          </form>
        )}
      </SimpleDialog>
    </>
  );
}
