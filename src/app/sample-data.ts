import type { Trip } from "../domain/types";

export function createSampleTrip(): Trip {
  const now = new Date().toISOString();

  return {
    id: "trip-da-nang",
    name: "Da Nang 3N2D",
    currency: "VND",
    language: "en",
    isSample: true,
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
          transferNoteTemplate: "Da Nang 3N2D",
        },
      },
      {
        id: "alvin",
        name: "Alvin",
        active: true,
        payment: {
          bankName: "Techcombank",
          bankCode: "970407",
          accountNumber: "1903666888",
          accountHolder: "ALVIN TRAN",
        },
      },
      {
        id: "ha",
        name: "HA",
        active: true,
        payment: {
          bankName: "ACB",
          bankCode: "970416",
          accountNumber: "8811223344",
          accountHolder: "HA NGUYEN",
        },
      },
      { id: "anh-ta", name: "Anh TA", active: true },
    ],
    expenses: [
      {
        id: "expense-seafood",
        title: "Seafood dinner",
        amountMinor: 1_520_000,
        payers: [{ memberId: "ha", amountMinor: 1_520_000 }],
        participants: [
          { memberId: "duy", percentage: 25 },
          { memberId: "alvin", percentage: 25 },
          { memberId: "ha", percentage: 30 },
          { memberId: "anh-ta", percentage: 20 },
        ],
        splitMethod: "percentage",
        category: "Food",
        date: "2026-05-31",
        note: "Be Man seafood",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "expense-taxi",
        title: "Airport taxi",
        amountMinor: 300_000,
        payers: [{ memberId: "duy", amountMinor: 300_000 }],
        participants: [{ memberId: "alvin" }, { memberId: "ha" }, { memberId: "anh-ta" }],
        splitMethod: "equal",
        category: "Transport",
        date: "2026-05-31",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "expense-hotel",
        title: "Hotel deposit",
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
        splitMethod: "equal",
        category: "Hotel",
        date: "2026-05-31",
        createdAt: now,
        updatedAt: now,
      },
    ],
    transfers: [],
  };
}

