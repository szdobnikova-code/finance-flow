import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected?: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  options,
  selected = [],
  onChange,
  placeholder = "Select categories...",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const allSelected = selected.length === options.length && options.length > 0;
  const noneSelected = selected.length === 0;

  const label = noneSelected
    ? placeholder
    : allSelected
      ? "All categories"
      : options
          .filter((option) => selected.includes(option.value))
          .map((option) => option.label)
          .join(", ");

  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 w-full justify-between font-normal">
          <span className={cn("truncate", noneSelected && "text-text-secondary")}>{label}</span>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search categories..." />

          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>

            <CommandGroup>
              {options.map((option) => {
                const checked = selected.includes(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4 shrink-0", checked ? "opacity-100" : "opacity-0")}
                    />

                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
