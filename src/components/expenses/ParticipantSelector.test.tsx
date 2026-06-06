import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParticipantSelector } from "./ParticipantSelector";

const members = [
  { id: "a", name: "Alvin", active: true },
  { id: "b", name: "Duy", active: true },
];

describe("ParticipantSelector", () => {
  test("All selects everyone when none selected", () => {
    const onChange = vi.fn();
    render(<ParticipantSelector members={members} selected={[]} language="en" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /all/i }));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  });
  test("All clears everyone when all selected", () => {
    const onChange = vi.fn();
    render(<ParticipantSelector members={members} selected={["a", "b"]} language="en" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /all/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
  test("toggling one member adds it", () => {
    const onChange = vi.fn();
    render(<ParticipantSelector members={members} selected={["a"]} language="en" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Duy" }));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  });
  test("toggling a selected member removes it", () => {
    const onChange = vi.fn();
    render(<ParticipantSelector members={members} selected={["a", "b"]} language="en" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Alvin" }));
    expect(onChange).toHaveBeenCalledWith(["b"]);
  });
});
