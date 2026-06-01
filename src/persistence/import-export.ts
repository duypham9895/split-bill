import type { Trip } from "../domain/types";
import { calculateTrip } from "../domain/calculations";

const EXPORT_VERSION = 1;

export function exportTripJson(trip: Trip): string {
  return JSON.stringify(
    {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      trip,
    },
    null,
    2,
  );
}

export function importTripJson(json: string): Trip {
  let payload: unknown;

  try {
    payload = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON");
  }

  if (!isRecord(payload) || payload.version !== EXPORT_VERSION) {
    throw new Error("Unsupported trip export version");
  }

  if (!isRecord(payload.trip)) {
    throw new Error("Invalid trip export payload");
  }

  const trip = payload.trip as Trip;
  assertTripShape(trip);
  calculateTrip(trip);
  return trip;
}

export function exportCsvBundle(trip: Trip): {
  expensesCsv: string;
  balancesCsv: string;
  settlementCsv: string;
} {
  const memberNameById = new Map(trip.members.map((member) => [member.id, member.name]));
  const calculation = calculateTrip(trip);

  const expensesRows = [
    ["Title", "Amount", "Payers", "Participants", "Split Method"],
    ...trip.expenses.map((expense) => [
      expense.title,
      String(expense.amountMinor),
      expense.payers
        .map((payer) => `${memberNameById.get(payer.memberId) ?? payer.memberId}: ${payer.amountMinor}`)
        .join("; "),
      expense.participants
        .map((participant) => memberNameById.get(participant.memberId) ?? participant.memberId)
        .join("; "),
      expense.splitMethod,
    ]),
  ];

  const balancesRows = [
    ["Member", "Total Paid", "Total Owed", "Transfer Paid", "Transfer Received", "Balance"],
    ...calculation.balances.map((balance) => [
      balance.name,
      String(balance.totalPaid),
      String(balance.totalOwed),
      String(balance.transferPaid),
      String(balance.transferReceived),
      String(balance.balance),
    ]),
  ];

  const settlementRows = [
    ["From", "To", "Amount"],
    ...calculation.simplifiedSettlement.map((payment) => [
      memberNameById.get(payment.fromMemberId) ?? payment.fromMemberId,
      memberNameById.get(payment.toMemberId) ?? payment.toMemberId,
      String(payment.amountMinor),
    ]),
  ];

  return {
    expensesCsv: toCsv(expensesRows),
    balancesCsv: toCsv(balancesRows),
    settlementCsv: toCsv(settlementRows),
  };
}

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function escapeCsvCell(value: string) {
  if (!/[",\n]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

function assertTripShape(trip: Trip) {
  if (!trip.id || !trip.name || !Array.isArray(trip.members) || !Array.isArray(trip.expenses)) {
    throw new Error("Invalid trip export payload");
  }

  if (!Array.isArray(trip.transfers)) {
    throw new Error("Invalid trip export payload");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
