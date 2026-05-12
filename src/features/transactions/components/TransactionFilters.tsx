import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { type ChangeEvent, type ReactNode, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/finance";

import { useTransactionFilters } from "../hooks/useTransactionFilters";

const inputClassName =
  "border-input bg-background placeholder:text-muted-foreground focus-visible:border-input focus-visible:ring-ring h-10 border text-sm font-normal focus-visible:ring-2 focus-visible:ring-offset-0";

function SearchInput({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative w-full">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        placeholder="Search by description..."
        className={cn(inputClassName, "pl-9", value && "pr-9")}
        value={value}
        onChange={onChange}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 transition focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function TransactionFilters({ categories }: { categories: Category[] }) {
  const [filters, setFilters] = useTransactionFilters();
  const [searchValue, setSearchValue] = useState<string>(filters.search ?? "");
  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    setFilters({ search: debouncedSearch || null });
  }, [debouncedSearch, setFilters]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchValue(e.target.value);
  };

  const handleSearchClear = (): void => {
    setSearchValue("");
  };

  const handleCategoryChange = (val: string[]): void => {
    setFilters({ categories: val.length ? val : null });
  };

  const handleAmountChange =
    (key: "minAmount" | "maxAmount") =>
    (e: ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value ? Number(e.target.value) : null;
      setFilters({ [key]: value });
    };

  const handleReset = useCallback((): void => {
    setSearchValue("");
    setFilters({
      search: null,
      categories: null,
      minAmount: null,
      maxAmount: null,
      from: null,
      to: null,
    });
  }, [setFilters]);

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id.toString() }));

  const hasCategories = !!filters.categories && filters.categories.length > 0;
  const hasDateRange = !!filters.from || !!filters.to;
  const hasAmounts = filters.minAmount !== null || filters.maxAmount !== null;
  const hasFilters = !!filters.search || hasCategories || hasDateRange || hasAmounts;

  const advancedFilterCount =
    (hasCategories ? 1 : 0) + (hasDateRange ? 1 : 0) + (hasAmounts ? 1 : 0);

  const advancedControls: ReactNode = (
    <>
      <MultiSelect
        placeholder="All categories"
        options={categoryOptions}
        selected={filters.categories ?? []}
        onChange={handleCategoryChange}
      />

      <DateRangePicker
        from={filters.from ?? undefined}
        to={filters.to ?? undefined}
        onRangeChange={setFilters}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          placeholder="Min"
          className={inputClassName}
          value={filters.minAmount ?? ""}
          onChange={handleAmountChange("minAmount")}
        />
        <Input
          type="number"
          placeholder="Max"
          className={inputClassName}
          value={filters.maxAmount ?? ""}
          onChange={handleAmountChange("maxAmount")}
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        disabled={!hasFilters}
        className="text-text-primary hover:text-text-primary h-10 w-full justify-center hover:bg-[var(--item-hover)]"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </>
  );

  return (
    <>
      {/* Mobile / tablet — search inline, advanced filters in a Popover */}
      <div className="flex items-center gap-2 lg:hidden">
        <SearchInput
          value={searchValue}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 shrink-0 gap-2"
              aria-label={
                advancedFilterCount > 0
                  ? `Filters (${advancedFilterCount} active)`
                  : "Filters"
              }
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {advancedFilterCount > 0 && (
                <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1.5 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {advancedFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[calc(100vw-2rem)] max-w-sm gap-3 p-3"
          >
            {advancedControls}
          </PopoverContent>
        </Popover>
      </div>

      {/* Desktop — original inline layout */}
      <div className="hidden flex-wrap items-center gap-3 lg:flex">
        <div className="relative min-w-[240px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by description..."
            className={cn(inputClassName, "pl-9", searchValue && "pr-9")}
            value={searchValue}
            onChange={handleSearchChange}
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleSearchClear}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 transition focus-visible:ring-2 focus-visible:outline-none"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="w-[200px]">
          <MultiSelect
            placeholder="All categories"
            options={categoryOptions}
            selected={filters.categories ?? []}
            onChange={handleCategoryChange}
          />
        </div>

        <DateRangePicker
          from={filters.from ?? undefined}
          to={filters.to ?? undefined}
          onRangeChange={setFilters}
        />

        <Input
          type="number"
          placeholder="Min"
          className={cn(inputClassName, "w-[100px]")}
          value={filters.minAmount ?? ""}
          onChange={handleAmountChange("minAmount")}
        />

        <Input
          type="number"
          placeholder="Max"
          className={cn(inputClassName, "w-[100px]")}
          value={filters.maxAmount ?? ""}
          onChange={handleAmountChange("maxAmount")}
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={!hasFilters}
          className="text-text-primary hover:text-text-primary h-10 hover:bg-[var(--item-hover)]"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </>
  );
}
