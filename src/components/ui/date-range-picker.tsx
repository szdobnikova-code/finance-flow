import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  from?: string;
  to?: string;
  onRangeChange: (range: { from: string | null; to: string | null }) => void;
}

export function DateRangePicker({ from, to, onRangeChange }: DateRangePickerProps) {
  const dateRange = React.useMemo<DateRange | undefined>(() => {
    if (!from && !to) return undefined;
    return {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };
  }, [from, to]);

  const handleSelect = (range: DateRange | undefined) => {
    onRangeChange({
      from: range?.from?.toISOString() || null,
      to: range?.to?.toISOString() || null,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "border-input bg-background hover:bg-background h-10 w-[280px] justify-start border text-left font-normal",
            !dateRange?.from && "text-text-secondary",
          )}
        >
          <CalendarIcon className="text-text-secondary mr-2 h-4 w-4" />
          <span className="truncate">
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd MMM yyyy")} – {format(dateRange.to, "dd MMM yyyy")}
                </>
              ) : (
                format(dateRange.from, "dd MMM yyyy")
              )
            ) : (
              "Pick a date range"
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleSelect}
          numberOfMonths={2}
          defaultMonth={dateRange?.from}
          showOutsideDays={false}
        />
      </PopoverContent>
    </Popover>
  );
}
