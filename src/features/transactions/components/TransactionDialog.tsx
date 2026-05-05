import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Category, Transaction } from "@/types/finance";

const transactionSchema = z.object({
  amount: z
    .string()
    .transform((val) => val.replace(",", "."))
    .refine((val) => !isNaN(Number(val)), {
      message: "Invalid number",
    })
    .transform((val) => Number(val))
    .refine((val) => val > 0, {
      message: "Amount must be greater than 0",
    }),
  type: z.enum(["income", "expense"]),
  categoryId: z.coerce.number().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
});

type TransactionFormInput = z.input<typeof transactionSchema>;
export type TransactionFormValues = z.output<typeof transactionSchema>;

type Props = {
  open: boolean;
  onOpenChange: () => void;
  transaction?: Transaction | null;
  categories: Category[];
  onSubmit: (values: TransactionFormValues) => void;
  isSubmitting?: boolean;
};

const today = new Date().toISOString().slice(0, 10);

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  categories,
  onSubmit,
  isSubmitting = false,
}: Props) {
  const isEdit = Boolean(transaction);

  const form = useForm<TransactionFormInput, unknown, TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      amount: transaction?.amount.toString() ?? "0",
      type: transaction?.type ?? "expense",
      categoryId: transaction?.categoryId ?? categories[0]?.id ?? 0,
      date: transaction?.date ?? today,
      description: transaction?.description ?? "",
    },
  });

  const {
    formState: { errors, touchedFields },
  } = form;

  useEffect(() => {
    if (!open) return;

    form.reset({
      amount: transaction?.amount.toString() ?? "0",
      type: transaction?.type ?? "expense",
      categoryId: transaction?.categoryId ?? categories[0]?.id ?? 0,
      date: transaction?.date ?? today,
      description: transaction?.description ?? "",
    });
  }, [open, transaction, categories, form]);

  const baseInput =
    "h-9 w-full rounded-md border px-3 text-sm text-zinc-100 shadow-none outline-none transition-colors placeholder:text-zinc-500 focus:ring-0 focus-visible:ring-0";

  const fieldSurface = "bg-zinc-900/60 hover:bg-zinc-900";

  const normalBorder = "border-zinc-800 focus:border-zinc-600 focus-visible:border-zinc-600";

  const errorBorder =
    "border-red-500/80 bg-red-950/20 focus:border-red-500 focus-visible:border-red-500";

  const label = "text-sm font-medium text-zinc-200";
  const errorText = "text-xs text-red-400";

  const show = {
    description: touchedFields.description && errors.description,
    amount: touchedFields.amount && errors.amount,
    category: touchedFields.categoryId && errors.categoryId,
    date: touchedFields.date && errors.date,
  };

  const dateValue = form.watch("date");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-0 sm:max-w-md">
        <div className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="text-sm font-semibold text-zinc-100">
            {isEdit ? "Edit transaction" : "Add transaction"}
          </DialogTitle>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <label className={label}>Description</label>
            <Input
              {...form.register("description")}
              placeholder="e.g. Coffee, Salary, Rent"
              className={cn(baseInput, fieldSurface, show.description ? errorBorder : normalBorder)}
            />
            {show.description && <p className={errorText}>{errors.description?.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={label}>Amount</label>
            <Input
              type="text"
              inputMode="decimal"
              {...form.register("amount")}
              className={cn(baseInput, fieldSurface, show.amount ? errorBorder : normalBorder)}
            />
            {show.amount && <p className={errorText}>{errors.amount?.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={label}>Type</label>
            <div className="relative">
              <select
                {...form.register("type")}
                className={cn(baseInput, fieldSurface, normalBorder, "appearance-none pr-8")}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <ChevronDown className="absolute top-2.5 right-2.5 h-4 w-4 text-zinc-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={label}>Category</label>
            <div className="relative">
              <select
                {...form.register("categoryId")}
                className={cn(
                  baseInput,
                  fieldSurface,
                  show.category ? errorBorder : normalBorder,
                  "appearance-none pr-8",
                )}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute top-2.5 right-2.5 h-4 w-4 text-zinc-500" />
            </div>
            {show.category && <p className={errorText}>{errors.categoryId?.message}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className={label}>Date</label>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    baseInput,
                    fieldSurface,
                    "justify-start text-left font-normal",
                    show.date ? errorBorder : normalBorder,
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                  {dateValue ? format(parseISO(dateValue), "MMM d, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto border-zinc-800 bg-zinc-950 p-0">
                <Calendar
                  mode="single"
                  selected={dateValue ? parseISO(dateValue) : undefined}
                  onSelect={(date) => {
                    if (!date) return;
                    form.setValue("date", date.toISOString().slice(0, 10), {
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }}
                />
              </PopoverContent>
            </Popover>

            {show.date && <p className={errorText}>{errors.date?.message}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange()}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-zinc-100 text-black hover:bg-white disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
