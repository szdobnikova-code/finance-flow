// Protects: debounced inputs (e.g. transaction search) must only fire after the
// user stops typing, so we don't hammer the API on every keystroke. A regression
// here would either flood requests or leave the UI stuck on a stale value.

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebounce } from "@/hooks/useDebounce.ts";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value synchronously", () => {
    const { result } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "hello" },
    });

    expect(result.current).toBe("hello");
  });

  it("updates the value after the delay elapses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("b");
  });

  it("emits only the final value when changes happen faster than the delay", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    rerender({ value: "abc" });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("abc");
  });

  it("does not throw if the consumer unmounts before the timer fires", () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    unmount();

    expect(() =>
      act(() => {
        vi.advanceTimersByTime(500);
      }),
    ).not.toThrow();
  });
});
