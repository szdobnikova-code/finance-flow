import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field.tsx";
import { fieldVariants } from "@/components/ui/form-shared.tsx";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils.ts";
import type { Budget, Category } from "@/types/finance";

const budgetSchema = z.object({
  limit: z
    .string()
    .transform((val) => val.replace(",", "."))
    .refine((val) => !isNaN(Number(val)), {
      message: "Invalid number",
    })
    .transform((val) => Number(val))
    .refine((val) => val > 0, {
      message: "Limit must be greater than 0",
    }),
  spent: z
    .string()
    .transform((val) => val.replace(",", "."))
    .refine((val) => !isNaN(Number(val)), {
      message: "Invalid number",
    })
    .transform((val) => Number(val)),
  categoryId: z.coerce.number().min(1, "Category is required"),
  period: z.enum(["monthly"]),
});

type BudgetFormInput = z.input<typeof budgetSchema>;
export type BudgetFormValues = z.output<typeof budgetSchema>;

type Props = {
  open: boolean;
  onOpenChange: () => void;
  budget?: Budget | null;
  categories: Category[];
  onSubmit: (values: BudgetFormValues) => void;
  isSubmitting?: boolean;
};

export function BudgetDialog({
  open,
  onOpenChange,
  budget,
  categories,
  onSubmit,
  isSubmitting = false,
}: Props) {
  const isEdit = Boolean(budget);

  const form = useForm<BudgetFormInput, unknown, BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      limit: budget?.limit.toString() ?? "0",
      spent: budget?.spent.toString() ?? "0",
      period: budget?.period ?? "monthly",
      categoryId: budget?.categoryId ?? categories[0]?.id ?? 0,
    },
  });

  const {
    formState: { errors, touchedFields },
  } = form;

  useEffect(() => {
    if (!open) return;

    form.reset({
      limit: budget?.limit.toString() ?? "0",
      spent: budget?.spent.toString() ?? "0",
      period: budget?.period ?? "monthly",
      categoryId: budget?.categoryId ?? categories[0]?.id ?? 0,
    });
  }, [open, budget, categories, form]);

  const show = {
    limit: touchedFields.limit && errors.limit,
    spent: touchedFields.spent && errors.spent,
    category: touchedFields.categoryId && errors.categoryId,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-0 sm:max-w-md">
        <div className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="text-sm font-semibold text-zinc-100">
            {isEdit ? "Edit budget" : "Add budget"}
          </DialogTitle>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-5 py-4">
          <FormField
            label="Category"
            error={show.category ? errors.categoryId?.message : undefined}
          >
            <div className="relative">
              <select
                {...form.register("categoryId")}
                className={cn(
                  fieldVariants({ variant: show.category ? "error" : "default" }),
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
          </FormField>

          <FormField label="Limit" error={show.limit ? errors.limit?.message : undefined}>
            <Input
              type="text"
              inputMode="decimal"
              {...form.register("limit")}
              className={fieldVariants({ variant: show.limit ? "error" : "default" })}
            />
          </FormField>

          <FormField label="Spent" error={show.spent ? errors.spent?.message : undefined}>
            <Input
              type="text"
              inputMode="decimal"
              {...form.register("spent")}
              className={fieldVariants({ variant: show.spent ? "error" : "default" })}
            />
          </FormField>

          <div className="flex flex-col-reverse gap-2 border-t border-zinc-800 pt-4 sm:flex-row sm:justify-end">
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
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
