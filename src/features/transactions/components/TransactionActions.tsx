import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import type { Transaction } from "@/types/finance.ts";

export function TransactionActions({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        onClick={() => onEdit(transaction)}
        aria-label="Edit transaction"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        onClick={() => onDelete(transaction)}
        aria-label="Delete transaction"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
