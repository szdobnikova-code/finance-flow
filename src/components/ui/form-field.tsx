import { cn } from "@/lib/utils";

import { formClasses } from "./form-shared";
import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, error, children, className }: FormFieldProps) {
  return (
    <div className={cn(formClasses.fieldWrapper, className)}>
      <label className={formClasses.label}>{label}</label>
      {children}
      {error && <p className={formClasses.errorText}>{error}</p>}
    </div>
  );
}
