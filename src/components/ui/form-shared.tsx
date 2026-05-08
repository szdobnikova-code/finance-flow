import { cva } from "class-variance-authority";

export const formClasses = {
  label: "text-sm font-medium text-zinc-200",
  errorText: "text-xs text-red-400",
  fieldWrapper: "space-y-1.5",
};

export const fieldVariants = cva(
  "h-9 w-full rounded-md border px-3 text-sm text-zinc-100 shadow-none outline-none transition-colors placeholder:text-zinc-500 focus:ring-0 focus-visible:ring-0 bg-zinc-900/60 hover:bg-zinc-900",
  {
    variants: {
      variant: {
        default: "border-zinc-800 focus:border-zinc-600 focus-visible:border-zinc-600",
        error: "border-red-500/80 bg-red-950/20 focus:border-red-500 focus-visible:border-red-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
