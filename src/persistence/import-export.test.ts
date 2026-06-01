import { describe, expect, test } from "vitest";
import { calculateTrip } from "../domain/calculations";
import type { Trip } from "../domain/types";
import { exportCsvBundle, exportTripJson, importTripJson } from "./import-export";

const trip: Trip = {
  id: "trip-1",
  name: "Da Nang",
  currency: "VND",
  language: "en",
  members: [
    {
      id: "duy",
      name: "Duy",
      active: true,
      payment: {
        bankName: "Vietcombank",
        bankCode: "970436",
        accountNumber: "102345678910",
        accountHolder: "DUY NGUYEN",
      },
    },
    { id: "alvin", name: "Alvin", active: true },
  ],
  expenses: [
    {
      id: "expense-1",
      title: "Taxi",
      amountMinor: 200_000,
      payers: [{ memberId: "duy", amountMinor: 200_000 }],
      participants: [{ memberId: "duy" }, { memberId: "alvin" }],
      splitMethod: "equal",
      category: "transport",
      date: "2026-05-31",
      createdAt: "2026-05-31T00:00:00.000Z",
      updatedAt: "2026-05-31T00:00:00.000Z",
    },
  ],
  transfers: [],
};

describe("trip import and export", () => {
  test("round-trips editable JSON and preserves calculation results", () => {
    const exported = exportTripJson(trip);
    const imported = importTripJson(exported);

    expect(imported).toEqual(trip);
    expect(calculateTrip(imported)).toEqual(calculateTrip(trip));
  });

  test("rejects invalid JSON and invalid schema versions", () => {
    expect(() => importTripJson("{")).toThrow("Invalid JSON");
    expect(() => importTripJson(JSON.stringify({ version: 999, trip }))).toThrow(
      "Unsupported trip export version",
    );
  });

  test("rejects imported trips that reference missing members", () => {
    const invalidTrip: Trip = {
      ...trip,
      expenses: [
        {
          ...trip.expenses[0],
          payers: [{ memberId: "missing-member", amountMinor: 200_000 }],
        },
      ],
    };

    expect(() => importTripJson(JSON.stringify({ version: 1, trip: invalidTrip }))).toThrow(
      "Unknown payer: missing-member",
    );
  });

  test("exports CSVs for expenses, balances, and settlement", () => {
    const csv = exportCsvBundle(trip);

    expect(csv.expensesCsv).toContain("Title,Amount,Payers,Participants,Split Method");
    expect(csv.expensesCsv).toContain("Taxi,200000,Duy: 200000,Duy; Alvin,equal");
    expect(csv.balancesCsv).toContain("Member,Total Paid,Total Owed,Transfer Paid,Transfer Received,Balance");
    expect(csv.balancesCsv).toContain("Duy,200000,100000,0,0,100000");
    expect(csv.settlementCsv).toContain("From,To,Amount");
    expect(csv.settlementCsv).toContain("Alvin,Duy,100000");
  });
});
