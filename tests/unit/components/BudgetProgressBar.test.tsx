// Protects: the budget progress bar's visual signal (green / amber / red) and
// fill width are what users rely on to see "am I about to overspend?". A
// regression that swaps the threshold colors or lets the bar render >100% width
// silently misleads users about their financial state.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BudgetProgressBar } from "@/features/budgets/BudgetProgressBar.tsx";

describe("BudgetProgressBar", () => {
  it("renders width matching the spent/limit percentage", () => {
    render(<BudgetProgressBar spent={50} limit={100} />);
    const fill = screen.getByRole("progressbar").firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("50%");
  });

  it("uses the success color under 70%", () => {
    render(<BudgetProgressBar spent={60} limit={100} />);
    const fill = screen.getByRole("progressbar").firstElementChild as HTMLElement;
    expect(fill).toHaveClass("bg-emerald-500");
  });

  it("uses the warning color between 70 and 89%", () => {
    render(<BudgetProgressBar spent={80} limit={100} />);
    const fill = screen.getByRole("progressbar").firstElementChild as HTMLElement;
    expect(fill).toHaveClass("bg-amber-500");
  });

  it("uses the danger color at or above 90%", () => {
    render(<BudgetProgressBar spent={95} limit={100} />);
    const fill = screen.getByRole("progressbar").firstElementChild as HTMLElement;
    expect(fill).toHaveClass("bg-red-500");
  });

  it("clamps the bar width to 100% when spent exceeds the limit", () => {
    render(<BudgetProgressBar spent={150} limit={100} />);
    const fill = screen.getByRole("progressbar").firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("100%");
    expect(fill).toHaveClass("bg-red-500");
  });

  it("renders 0% (not NaN) when the limit is 0", () => {
    render(<BudgetProgressBar spent={20} limit={0} />);
    const fill = screen.getByRole("progressbar").firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("0%");
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
