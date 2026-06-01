import { describe, expect, test } from "vitest";
import { calculateTrip } from "./calculations";
import { calculateExpenseShares } from "./split";
import { formatMoney } from "./money";
import type { Expense, Member, Trip } from "./types";

const members: Member[] = [
  { id: "duy", name: "Duy", active: true },
  { id: "alvin", name: "Alvin", active: true },
  { id: "ha", name: "HA", active: true },
  { id: "anh-ta", name: "Anh TA", active: true },
];

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "expense-1",
    title: "Dinner",
    amountMinor: 300_000,
    payers: [{ memberId: "duy", amountMinor: 300_000 }],
    participants: [
      { memberId: "alvin" },
      { memberId: "ha" },
      { memberId: "anh-ta" },
    ],
    splitMethod: "equal",
    category: "food",
    date: "2026-05-31",
    createdAt: "2026-05-31T00:00:00.000Z",
    updatedAt: "2026-05-31T00:00:00.000Z",
    ...overrides,
  };
}

function trip(expenses: Expense[], transfers: Trip["transfers"] = []): Trip {
  return {
    id: "trip-1",
    name: "Da Nang",
    currency: "VND",
    language: "en",
    members,
    expenses,
    transfers,
  };
}

function balanceById(result: ReturnType<typeof calculateTrip>) {
  return Object.fromEntries(result.balances.map((balance) => [balance.memberId, balance]));
}

describe("money formatting", () => {
  test("formats VND for English and Vietnamese without negative zero", () => {
    expect(formatMoney(300_000, "en")).toBe("300,000 VND");
    expect(formatMoney(300_000, "vi")).toBe("300.000 VND");
    expect(formatMoney(-0, "en")).toBe("0 VND");
  });
});

describe("expense split calculation", () => {
  test("splits equal shares with stable rounding", () => {
    const shares = calculateExpenseShares(
      expense({
        amountMinor: 100,
        payers: [{ memberId: "duy", amountMinor: 100 }],
        participants: [{ memberId: "duy" }, { memberId: "alvin" }, { memberId: "ha" }],
      }),
    );

    expect(Object.fromEntries(shares)).toEqual({ duy: 34, alvin: 33, ha: 33 });
  });

  test("supports exact, percentage, and share split methods", () => {
    expect(
      Object.fromEntries(
        calculateExpenseShares(
          expense({
            amountMinor: 600_000,
            splitMethod: "exact",
            participants: [
              { memberId: "alvin", exactAmountMinor: 100_000 },
              { memberId: "ha", exactAmountMinor: 200_000 },
              { memberId: "anh-ta", exactAmountMinor: 300_000 },
            ],
          }),
        ),
      ),
    ).toEqual({ alvin: 100_000, ha: 200_000, "anh-ta": 300_000 });

    expect(
      Object.fromEntries(
        calculateExpenseShares(
          expense({
            amountMinor: 1_000_000,
            splitMethod: "percentage",
            participants: [
              { memberId: "duy", percentage: 10 },
              { memberId: "alvin", percentage: 20 },
              { memberId: "ha", percentage: 30 },
              { memberId: "anh-ta", percentage: 40 },
            ],
          }),
        ),
      ),
    ).toEqual({ duy: 100_000, alvin: 200_000, ha: 300_000, "anh-ta": 400_000 });

    expect(
      Object.fromEntries(
        calculateExpenseShares(
          expense({
            amountMinor: 400_000,
            splitMethod: "shares",
            participants: [
              { memberId: "duy", shares: 1 },
              { memberId: "alvin", shares: 1 },
              { memberId: "ha", shares: 2 },
            ],
          }),
        ),
      ),
    ).toEqual({ duy: 100_000, alvin: 100_000, ha: 200_000 });
  });
});

describe("trip balances and settlement", () => {
  test("handles payer excluded from shared participants with settlement", () => {
    const result = calculateTrip(trip([expense({})]));
    const balances = balanceById(result);

    expect(balances.duy).toMatchObject({ totalPaid: 300_000, totalOwed: 0, balance: 300_000 });
    expect(balances.alvin.balance).toBe(-100_000);
    expect(balances.ha.balance).toBe(-100_000);
    expect(balances["anh-ta"].balance).toBe(-100_000);
    expect(result.simplifiedSettlement).toEqual([
      { fromMemberId: "alvin", toMemberId: "duy", amountMinor: 100_000 },
      { fromMemberId: "ha", toMemberId: "duy", amountMinor: 100_000 },
      { fromMemberId: "anh-ta", toMemberId: "duy", amountMinor: 100_000 },
    ]);
  });

  test("handles payer included in shared participants", () => {
    const result = calculateTrip(
      trip([
        expense({
          amountMinor: 400_000,
          payers: [{ memberId: "duy", amountMinor: 400_000 }],
          participants: [
            { memberId: "duy" },
            { memberId: "alvin" },
            { memberId: "ha" },
            { memberId: "anh-ta" },
          ],
        }),
      ]),
    );
    const balances = balanceById(result);

    expect(balances.duy.balance).toBe(300_000);
    expect(balances.alvin.balance).toBe(-100_000);
    expect(balances.ha.balance).toBe(-100_000);
    expect(balances["anh-ta"].balance).toBe(-100_000);
  });

  test("handles multiple payers on one expense", () => {
    const result = calculateTrip(
      trip([
        expense({
          amountMinor: 500_000,
          payers: [
            { memberId: "duy", amountMinor: 300_000 },
            { memberId: "alvin", amountMinor: 200_000 },
          ],
          participants: [
            { memberId: "duy" },
            { memberId: "alvin" },
            { memberId: "ha" },
            { memberId: "anh-ta" },
          ],
        }),
      ]),
    );
    const balances = balanceById(result);

    expect(balances.duy.balance).toBe(175_000);
    expect(balances.alvin.balance).toBe(75_000);
    expect(balances.ha.balance).toBe(-125_000);
    expect(balances["anh-ta"].balance).toBe(-125_000);
    expect(result.simplifiedSettlement).toEqual([
      { fromMemberId: "ha", toMemberId: "duy", amountMinor: 125_000 },
      { fromMemberId: "anh-ta", toMemberId: "duy", amountMinor: 50_000 },
      { fromMemberId: "anh-ta", toMemberId: "alvin", amountMinor: 75_000 },
    ]);
    expect(result.directPaybackSettlement).toEqual([
      { fromMemberId: "alvin", toMemberId: "duy", amountMinor: 25_000, expenseId: "expense-1" },
      { fromMemberId: "ha", toMemberId: "duy", amountMinor: 75_000, expenseId: "expense-1" },
      { fromMemberId: "ha", toMemberId: "alvin", amountMinor: 50_000, expenseId: "expense-1" },
      { fromMemberId: "anh-ta", toMemberId: "duy", amountMinor: 75_000, expenseId: "expense-1" },
      { fromMemberId: "anh-ta", toMemberId: "alvin", amountMinor: 50_000, expenseId: "expense-1" },
    ]);
  });

  test("applies transfers to remaining balances", () => {
    const result = calculateTrip(
      trip([expense({})], [
        {
          id: "transfer-1",
          fromMemberId: "alvin",
          toMemberId: "duy",
          amountMinor: 50_000,
          date: "2026-05-31",
          status: "paid",
        },
      ]),
    );
    const balances = balanceById(result);

    expect(balances.duy.balance).toBe(250_000);
    expect(balances.alvin.balance).toBe(-50_000);
    expect(balances.ha.balance).toBe(-100_000);
    expect(balances["anh-ta"].balance).toBe(-100_000);
    expect(result.directPaybackSettlement).toEqual([
      { fromMemberId: "alvin", toMemberId: "duy", amountMinor: 50_000, expenseId: "expense-1" },
      { fromMemberId: "ha", toMemberId: "duy", amountMinor: 100_000, expenseId: "expense-1" },
      { fromMemberId: "anh-ta", toMemberId: "duy", amountMinor: 100_000, expenseId: "expense-1" },
    ]);
  });
});
