import { RotateCcw, Search } from "lucide-react";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { useDebounce } from "@/hooks/useDebounce";
import type { Category } from "@/types/finance";

import { useTransactionFilters } from "../hooks/useTransactionFilters";

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
  const hasFilters =
    !!filters.search ||
    (filters.categories && filters.categories.length > 0) ||
    filters.minAmount !== null ||
    filters.maxAmount !== null ||
    !!filters.from ||
    !!filters.to;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[240px] flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search by description..."
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-input focus-visible:ring-ring h-10 border pl-9 text-sm font-normal focus-visible:ring-2 focus-visible:ring-offset-0"
          value={searchValue}
          onChange={handleSearchChange}
        />
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

      <div className="border-input bg-background focus-within:ring-ring flex h-10 items-center rounded-md border px-3 focus-within:ring-2 focus-within:ring-offset-0">
        <Input
          type="number"
          placeholder="Min"
          className="placeholder:text-muted-foreground h-full w-20 appearance-none border-none p-0 text-sm font-normal shadow-none focus-visible:border-transparent focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={filters.minAmount ?? ""}
          onChange={handleAmountChange("minAmount")}
        />
        <div className="bg-border mx-2 h-4 w-[1px]" />
        <Input
          type="number"
          placeholder="Max"
          className="placeholder:text-muted-foreground h-full w-20 appearance-none border-none p-0 text-sm font-normal shadow-none focus-visible:border-transparent focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={filters.maxAmount ?? ""}
          onChange={handleAmountChange("maxAmount")}
        />
      </div>

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
  );
}
