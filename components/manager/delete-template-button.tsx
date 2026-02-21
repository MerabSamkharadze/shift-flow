"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteShiftTemplate } from "@/app/actions/manager";

type Props = { templateId: string; groupId: string };

export function DeleteTemplateButton({ templateId, groupId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteShiftTemplate(templateId, groupId);
          router.refresh();
        })
      }
      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
      title="Delete template"
    >
      <Trash2 size={14} />
    </button>
  );
}
