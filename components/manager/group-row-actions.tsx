"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SimpleDialog } from "@/components/ui/simple-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteGroup, updateGroup } from "@/app/actions/manager";

type Props = {
  groupId: string;
  groupName: string;
};

export function GroupRowActions({ groupId, groupName }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(groupName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleEditClose() {
    setEditOpen(false);
    setError(null);
    setName(groupName);
  }

  function handleDeleteClose() {
    setDeleteOpen(false);
    setError(null);
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateGroup(groupId, name);
      if (result.error) {
        setError(result.error);
      } else {
        setEditOpen(false);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteGroup(groupId);
      if (result.error) {
        setError(result.error);
      } else {
        setDeleteOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <MoreVertical size={15} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setName(groupName);
              setEditOpen(true);
            }}
          >
            <Pencil size={13} className="mr-2" />
            Edit Group
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash size={13} className="mr-2" />
            Delete Group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SimpleDialog open={editOpen} onClose={handleEditClose} title="Rename group">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-group-name">Name</Label>
            <Input
              id="edit-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleEditClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </SimpleDialog>

      <SimpleDialog open={deleteOpen} onClose={handleDeleteClose} title="Delete group">
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">{groupName}</span>? All
          shifts and members will be permanently removed.
        </p>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDeleteClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </SimpleDialog>
    </>
  );
}
