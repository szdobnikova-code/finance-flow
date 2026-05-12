import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field.tsx";
import { fieldVariants, formClasses } from "@/components/ui/form-shared.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { COLOR_BG } from "@/features/categories/colorMap.ts";
import { ICON_MAP } from "@/features/categories/iconMap.ts";
import { cn } from "@/lib/utils.ts";
import { type Category, CATEGORY_COLORS, CATEGORY_ICONS } from "@/types/finance";

const IconPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
    {Object.entries(ICON_MAP).map(([name, Icon]) => (
      <button
        key={name}
        type="button"
        onClick={() => onChange(name)}
        aria-label={`Icon: ${name}`}
        aria-pressed={value === name}
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
  <div className="flex flex-wrap gap-2">
    {CATEGORY_COLORS.map((color) => (
      <button
        key={color}
        type="button"
        onClick={() => onChange(color)}
        aria-label={`Color: ${color}`}
        aria-pressed={value === color}
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

  const show = {
    name: touchedFields.name && errors.name,
    color: touchedFields.color && errors.color,
    icon: touchedFields.icon && errors.icon,
    type: touchedFields.type && errors.type,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background overflow-hidden rounded-xl border p-0 sm:max-w-md">
        <div className="border-border border-b px-5 py-4">
          <DialogTitle className="text-foreground text-sm font-semibold">
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

          <div className={formClasses.fieldWrapper}>
            <label className={formClasses.label}>Color</label>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
            />
          </div>

          <div className={formClasses.fieldWrapper}>
            <label className={formClasses.label}>Icon</label>
            <Controller
              control={form.control}
              name="icon"
              render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />}
            />
          </div>

          <FormField label="Type" error={show.type ? errors.type?.message : undefined}>
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
                className={fieldVariants({ variant: show.type ? "error" : "default" })}
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
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
              {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
