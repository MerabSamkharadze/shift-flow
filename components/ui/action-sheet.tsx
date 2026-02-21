"use client";

import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { SimpleDialog } from "./simple-dialog";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function ActionSheet({ open, onClose, title, children }: Props) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <SimpleDialog open={open} onClose={onClose} title={title}>
        {children}
      </SimpleDialog>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-border bg-background outline-none">
          {/* Handle */}
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20" />
          {/* Title */}
          <div className="px-6 pt-4 pb-2">
            <Drawer.Title className="text-base font-semibold">
              {title}
            </Drawer.Title>
          </div>
          {/* Content — scrollable if tall */}
          <div className="overflow-y-auto px-6 pb-10">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
