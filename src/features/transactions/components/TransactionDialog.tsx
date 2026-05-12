import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field.tsx";
import { fieldVariants } from "@/components/ui/form-shared.tsx";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { cn } from "@/lib/utils.ts";
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

  const show = {
    description: touchedFields.description && errors.description,
    amount: touchedFields.amount && errors.amount,
    category: touchedFields.categoryId && errors.categoryId,
    date: touchedFields.date && errors.date,
  };

  const dateValue = form.watch("date");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background overflow-hidden rounded-xl border p-0 sm:max-w-md">
        <div className="border-border border-b px-5 py-4">
          <DialogTitle className="text-foreground text-sm font-semibold">
            {isEdit ? "Edit transaction" : "Add transaction"}
          </DialogTitle>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-5 py-4">
          <FormField
            label="Description"
            error={show.description ? errors.description?.message : undefined}
          >
            <Input
              {...form.register("description")}
              placeholder="e.g. Coffee, Salary, Rent"
              className={fieldVariants({ variant: show.description ? "error" : "default" })}
            />
          </FormField>

          <FormField label="Amount" error={show.amount ? errors.amount?.message : undefined}>
            <Input
              type="text"
              inputMode="decimal"
              {...form.register("amount")}
              className={fieldVariants({ variant: show.amount ? "error" : "default" })}
            />
          </FormField>

          <FormField label="Type">
            <Select
              value={form.watch("type")}
              onValueChange={(value: "income" | "expense") => {
                form.setValue("type", value, {
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger
                className={cn(fieldVariants({ variant: "default" }), "!h-9 min-h-0 py-0")}
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Category"
            error={show.category ? errors.categoryId?.message : undefined}
          >
            <Select
              value={String(form.watch("categoryId"))}
              onValueChange={(value) => {
                form.setValue("categoryId", Number(value), {
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger
                className={cn(
                  fieldVariants({ variant: show.category ? "error" : "default" }),
                  "!h-9 min-h-0 py-0",
                )}
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>

              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {/* Date */}
          <FormField label="Date" error={show.date ? errors.date?.message : undefined}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={fieldVariants({ variant: show.date ? "error" : "default" })}
                >
                  <CalendarIcon className="text-muted-foreground mr-2 h-4 w-4" />
                  {dateValue ? format(parseISO(dateValue), "MMM d, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="border-border bg-popover text-popover-foreground w-auto p-0">
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
          </FormField>

          <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange()}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting} className="disabled:opacity-50">
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
