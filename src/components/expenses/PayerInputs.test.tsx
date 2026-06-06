import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PayerInputs, type PayerRow } from "./PayerInputs";

const members = [
  { id: "a", name: "Alvin", active: true },
  { id: "b", name: "Duy", active: true },
];

describe("PayerInputs running total", () => {
  test("shows mismatch state when payers don't cover the total", () => {
    const rows: PayerRow[] = [{ rowId: "1", memberId: "a", amount: "150000" }];
    render(<PayerInputs members={members} payers={rows} totalMinor={200000} language="en" onChange={() => {}} />);
    expect(screen.getByTestId("payer-total")).toHaveClass("no");
  });
  test("shows ok state when payers exactly cover the total", () => {
    const rows: PayerRow[] = [{ rowId: "1", memberId: "a", amount: "200000" }];
    render(<PayerInputs members={members} payers={rows} totalMinor={200000} language="en" onChange={() => {}} />);
    expect(screen.getByTestId("payer-total")).toHaveClass("ok");
  });
  test("editing an amount calls onChange with updated rows", () => {
    const onChange = vi.fn();
    const rows: PayerRow[] = [{ rowId: "1", memberId: "a", amount: "100000" }];
    render(<PayerInputs members={members} payers={rows} totalMinor={200000} language="en" onChange={onChange} />);
    const input = screen.getByDisplayValue("100000");
    fireEvent.change(input, { target: { value: "120000" } });
    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls[0][0];
    expect(arg[0].amount).toBe("120000");
  });
});
