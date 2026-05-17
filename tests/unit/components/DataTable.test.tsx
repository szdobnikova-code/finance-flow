// Protects: DataTable is the shared tabular primitive for transactions,
// categories, and budgets. If row rendering, sort toggling, or the edit/delete
// callbacks regress, every list view in the app silently breaks at once.

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Column } from "@/components/DataTable.tsx";
import { DataTable } from "@/components/DataTable.tsx";

type Row = { id: string; name: string; amount: number };

const columns: Column<Row>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "amount", header: "Amount", sortable: true },
];

const rows: Row[] = [
  { id: "1", name: "Alpha", amount: 30 },
  { id: "2", name: "Bravo", amount: 10 },
  { id: "3", name: "Charlie", amount: 20 },
];

function renderTable(overrides?: {
  data?: Row[];
  onEdit?: (row: Row) => void;
  onDelete?: (row: Row) => void;
}) {
  const onEdit = overrides?.onEdit ?? vi.fn();
  const onDelete = overrides?.onDelete ?? vi.fn();
  render(
    <DataTable
      data={overrides?.data ?? rows}
      columns={columns}
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  );
  return { onEdit, onDelete };
}

describe("DataTable", () => {
  it("renders one row per item in the data prop", () => {
    renderTable();
    const bodyRows = screen.getAllByRole("row").slice(1);
    expect(bodyRows).toHaveLength(3);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("renders only the header row when data is empty", () => {
    renderTable({ data: [] });
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  it("toggles sort direction when a sortable header is clicked", () => {
    renderTable();
    const amountHeader = screen.getByRole("button", { name: /amount/i });

    fireEvent.click(amountHeader);
    let cells = screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[1].textContent);
    expect(cells).toEqual(["10", "20", "30"]);

    fireEvent.click(amountHeader);
    cells = screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[1].textContent);
    expect(cells).toEqual(["30", "20", "10"]);
  });

  it("calls onEdit with the correct row when the edit button is clicked", () => {
    const { onEdit } = renderTable();
    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    fireEvent.click(editButtons[1]);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(rows[1]);
  });

  it("calls onDelete with the correct row when the delete button is clicked", () => {
    const { onDelete } = renderTable();
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    fireEvent.click(deleteButtons[2]);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(rows[2]);
  });
});
