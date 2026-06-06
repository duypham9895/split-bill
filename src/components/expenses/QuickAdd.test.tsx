import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Expense, Trip } from "../../domain/types";
import { QuickAdd } from "./QuickAdd";

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: `expense-${Math.random()}`,
    title: "Test expense",
    amountMinor: 100000,
    payers: [{ memberId: "m1", amountMinor: 100000 }],
    participants: [{ memberId: "m1" }, { memberId: "m2" }],
    splitMethod: "equal",
    category: "food",
    date: "2026-06-01",
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
    ...overrides,
  };
}

function makeTrip(expenses: Expense[]): Trip {
  return {
    id: "trip-1",
    name: "Test Trip",
    currency: "VND",
    language: "en",
    members: [
      { id: "m1", name: "Alice", active: true },
      { id: "m2", name: "Bob", active: true },
    ],
    expenses,
    transfers: [],
  };
}

describe("QuickAdd", () => {
  it("renders chips for each expense title", () => {
    const expenses = [
      makeExpense({ id: "e1", title: "Grab", category: "transport" }),
      makeExpense({ id: "e2", title: "Cà phê", category: "drinks" }),
      makeExpense({ id: "e3", title: "Ăn trưa", category: "food" }),
    ];
    const trip = makeTrip(expenses);
    render(<QuickAdd trip={trip} language="en" onPick={vi.fn()} />);

    expect(screen.getByText("Grab")).toBeInTheDocument();
    expect(screen.getByText("Cà phê")).toBeInTheDocument();
    expect(screen.getByText("Ăn trưa")).toBeInTheDocument();
  });

  it("calls onPick with the correct expense when a chip is clicked", () => {
    const expense = makeExpense({ id: "e1", title: "Grab", category: "transport" });
    const trip = makeTrip([expense]);
    const onPick = vi.fn();
    render(<QuickAdd trip={trip} language="en" onPick={onPick} />);

    fireEvent.click(screen.getByText("Grab"));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(expense);
  });

  it("deduplicates expenses with the same title|category — shows only one chip", () => {
    const expenses = [
      makeExpense({ id: "e1", title: "Grab", category: "transport", createdAt: "2026-06-01T08:00:00.000Z" }),
      makeExpense({ id: "e2", title: "Grab", category: "transport", createdAt: "2026-06-02T08:00:00.000Z" }),
      makeExpense({ id: "e3", title: "Grab", category: "transport", createdAt: "2026-06-03T08:00:00.000Z" }),
    ];
    const trip = makeTrip(expenses);
    render(<QuickAdd trip={trip} language="en" onPick={vi.fn()} />);

    // Only one chip for "Grab"
    const chips = screen.getAllByText("Grab");
    expect(chips).toHaveLength(1);
  });

  it("renders nothing when the trip has no expenses", () => {
    const trip = makeTrip([]);
    const { container } = render(<QuickAdd trip={trip} language="en" onPick={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the section label from i18n", () => {
    const trip = makeTrip([makeExpense({ id: "e1", title: "Dinner" })]);
    render(<QuickAdd trip={trip} language="en" onPick={vi.fn()} />);
    expect(screen.getByText("Quick add")).toBeInTheDocument();
  });

  it("shows Vietnamese label when language is vi", () => {
    const trip = makeTrip([makeExpense({ id: "e1", title: "Dinner" })]);
    render(<QuickAdd trip={trip} language="vi" onPick={vi.fn()} />);
    expect(screen.getByText("Thêm nhanh")).toBeInTheDocument();
  });

  it("caps templates at 5 even with many distinct expenses", () => {
    const expenses = Array.from({ length: 8 }, (_, i) =>
      makeExpense({ id: `e${i}`, title: `Expense ${i}`, category: "other" })
    );
    const trip = makeTrip(expenses);
    render(<QuickAdd trip={trip} language="en" onPick={vi.fn()} />);

    // Count rendered chips (buttons with title attribute)
    const chips = document.querySelectorAll(".quickAddChip");
    expect(chips.length).toBeLessThanOrEqual(5);
  });
});
