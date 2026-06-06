import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SplitMethodPicker } from "./SplitMethodPicker";

describe("SplitMethodPicker", () => {
  test("shows the summary for the active method", () => {
    render(<SplitMethodPicker method="shares" language="en" onChange={() => {}} />);
    expect(screen.getByText(/more shares means a bigger portion/i)).toBeInTheDocument();
  });
  test("shows the formula for the active method", () => {
    render(<SplitMethodPicker method="equal" language="en" onChange={() => {}} />);
    expect(screen.getByText(/each = total ÷ number of people/i)).toBeInTheDocument();
  });
  test("calls onChange when a different method is tapped", () => {
    const onChange = vi.fn();
    render(<SplitMethodPicker method="equal" language="en" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /exact/i }));
    expect(onChange).toHaveBeenCalledWith("exact");
  });
  test("renders Vietnamese summary when language is vi", () => {
    render(<SplitMethodPicker method="equal" language="vi" onChange={() => {}} />);
    expect(screen.getByText(/Mọi người được chọn trả/i)).toBeInTheDocument();
  });
});
