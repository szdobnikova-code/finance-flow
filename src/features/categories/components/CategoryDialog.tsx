import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field.tsx";
import { fieldVariants } from "@/components/ui/form-shared.tsx";
import { Input } from "@/components/ui/input.tsx";
import { COLOR_BG } from "@/features/categories/colorMap.ts";
import { ICON_MAP } from "@/features/categories/iconMap.ts";
import { cn } from "@/lib/utils.ts";
import { type Category, CATEGORY_COLORS, CATEGORY_ICONS } from "@/types/finance";

const IconPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="grid grid-cols-8 gap-2">
    {Object.entries(ICON_MAP).map(([name, Icon]) => (
      <button
        key={name}
        type="button"
        onClick={() => onChange(name)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md border transition",
          value === name ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
        )}
      >
        <Icon className="text-primary h-4 w-4" />
      </button>
    ))}
  </div>
);

const ColorPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex gap-2">
    {CATEGORY_COLORS.map((color) => (
      <button
        key={color}
        type="button"
        onClick={() => onChange(color)}
        className={cn(
          "ring-offset-background h-7 w-7 rounded-full ring-offset-2 transition",
          COLOR_BG[color],
          value === color && "ring-ring ring-2",
        )}
      />
    ))}
  </div>
);

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.enum(CATEGORY_COLORS),
  icon: z.enum(CATEGORY_ICONS),
  type: z.enum(["income", "expense"]),
});

type CategoryFormInput = z.input<typeof categorySchema>;
export type CategoryFormValues = z.output<typeof categorySchema>;

type Props = {
  open: boolean;
  onOpenChange: () => void;
  category?: Category | null;
  onSubmit: (values: CategoryFormValues) => void;
  isSubmitting?: boolean;
};

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  isSubmitting = false,
}: Props) {
  const isEdit = Boolean(category);

  const form = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: category?.name ?? "",
      color: category?.color ?? CATEGORY_COLORS[0],
      icon: category?.icon ?? CATEGORY_ICONS[0],
      type: category?.type ?? "expense",
    },
  });

  const {
    formState: { errors, touchedFields },
  } = form;

  useEffect(() => {
    if (!open) return;

    form.reset({
      name: category?.name ?? "",
      color: category?.color ?? CATEGORY_COLORS[0],
      icon: category?.icon ?? CATEGORY_ICONS[0],
      type: category?.type ?? "expense",
    });
  }, [open, category, form]);

  const label = "text-sm font-medium text-zinc-200";

  const show = {
    name: touchedFields.name && errors.name,
    color: touchedFields.color && errors.color,
    icon: touchedFields.icon && errors.icon,
    type: touchedFields.type && errors.type,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-0 sm:max-w-md">
        <div className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="text-sm font-semibold text-zinc-100">
            {isEdit ? "Edit category" : "Add category"}
          </DialogTitle>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-5 py-4">
          <FormField label="Name" error={show.name ? errors.name?.message : undefined}>
            <Input
              {...form.register("name")}
              placeholder="e.g. Food, Transportation, Entertainment"
              className={fieldVariants({ variant: show.name ? "error" : "default" })}
            />
          </FormField>

          <div className="space-y-1.5">
            <label className={label}>Color</label>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
            />
          </div>

          <div className="space-y-1.5">
            <label className={label}>Icon</label>
            <Controller
              control={form.control}
              name="icon"
              render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />}
            />
          </div>

          <FormField label="Type" error={show.type ? errors.type?.message : undefined}>
            <div className="relative">
              <select
                {...form.register("type")}
                className={cn(
                  fieldVariants({ variant: show.type ? "error" : "default" }),
                  "appearance-none pr-8",
                )}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <ChevronDown className="absolute top-2.5 right-2.5 h-4 w-4 text-zinc-500" />
            </div>
          </FormField>

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
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
