import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: () => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-0 shadow-sm sm:max-w-[420px]">
        <div className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="text-sm font-semibold text-zinc-100">{title}</DialogTitle>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="text-sm leading-6 text-zinc-400">{description}</div>

          <div className="flex flex-col-reverse gap-2 border-t border-zinc-800 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange()}
              className="h-8 px-3 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            >
              {cancelLabel}
            </Button>

            <Button
              type="button"
              onClick={onConfirm}
              className={cn(
                "h-8 px-3 text-sm font-medium",
                isDestructive
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-zinc-100 text-zinc-950 hover:bg-white",
              )}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
