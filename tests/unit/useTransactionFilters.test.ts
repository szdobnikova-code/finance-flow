// Protects: transaction filters live in the URL so users can share filtered
// views and the browser back button works as expected. If the round-trip
// between hook state and URL search params breaks, deep links silently lose
// state and shared URLs stop reproducing the same filter.

import { act, renderHook } from "@testing-library/react";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it } from "vitest";

import { useTransactionFilters } from "@/features/transactions/hooks/useTransactionFilters.ts";

describe("useTransactionFilters", () => {
  it("returns default values when no search params are set", () => {
    const { result } = renderHook(() => useTransactionFilters(), {
      wrapper: withNuqsTestingAdapter(),
    });

    const [filters] = result.current;
    expect(filters).toEqual({
      search: "",
      categories: [],
      minAmount: null,
      maxAmount: null,
      from: null,
      to: null,
    });
  });

  it("reads initial filter state from the URL", () => {
    const { result } = renderHook(() => useTransactionFilters(), {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?categories=food,rent&minAmount=10",
      }),
    });

    const [filters] = result.current;
    expect(filters.categories).toEqual(["food", "rent"]);
    expect(filters.minAmount).toBe(10);
  });

  it("clears all filters back to defaults when the setter is called with nulls", async () => {
    const { result } = renderHook(() => useTransactionFilters(), {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?search=coffee&categories=food&minAmount=5",
        hasMemory: true,
      }),
    });

    await act(async () => {
      await result.current[1]({
        search: null,
        categories: null,
        minAmount: null,
        maxAmount: null,
        from: null,
        to: null,
      });
    });

    const [filters] = result.current;
    expect(filters).toEqual({
      search: "",
      categories: [],
      minAmount: null,
      maxAmount: null,
      from: null,
      to: null,
    });
  });
});
