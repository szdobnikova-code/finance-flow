import { cva } from "class-variance-authority";

export const formClasses = {
  label: "text-sm font-medium text-foreground",
  errorText: "text-xs text-destructive",
  fieldWrapper: "space-y-1.5",
};

export const fieldVariants = cva(
  "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input hover:bg-accent/40 focus:border-ring focus-visible:border-ring",
        error:
          "border-destructive bg-destructive/5 focus:border-destructive focus-visible:border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
