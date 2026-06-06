import { describe, expect, test } from "vitest";
import type { Trip } from "../domain/types";
import {
  decodeTripFromShareParam,
  encodeTripToShareParam,
  stripHeavyMedia,
} from "./share-link";

const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

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
        qrImageDataUrl: tinyPng,
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
      receiptImageDataUrl: tinyPng,
      createdAt: "2026-05-31T00:00:00.000Z",
      updatedAt: "2026-05-31T00:00:00.000Z",
    },
  ],
  transfers: [],
};

describe("share link encoding", () => {
  test("strips uploaded QR images and receipt photos but keeps bank details", () => {
    const stripped = stripHeavyMedia(trip);

    expect(stripped.members[0].payment?.qrImageDataUrl).toBeUndefined();
    expect(stripped.members[0].payment?.accountNumber).toBe("102345678910");
    expect(stripped.expenses[0].receiptImageDataUrl).toBeUndefined();
    // Original trip is untouched (file export still carries full media).
    expect(trip.members[0].payment?.qrImageDataUrl).toBe(tinyPng);
    expect(trip.expenses[0].receiptImageDataUrl).toBe(tinyPng);
  });

  test("drops payment object entirely when QR image was its only field", () => {
    const qrOnly: Trip = {
      ...trip,
      members: [{ id: "x", name: "X", active: true, payment: { qrImageDataUrl: tinyPng } }],
      expenses: [],
    };

    expect(stripHeavyMedia(qrOnly).members[0].payment).toBeUndefined();
  });

  test("round-trips a trip through encode/decode (without heavy media)", () => {
    const decoded = decodeTripFromShareParam(encodeTripToShareParam(trip));

    expect(decoded).toEqual(stripHeavyMedia(trip));
  });

  test("handles unicode trip names", () => {
    const unicodeTrip: Trip = { ...trip, name: "Chuyến đi Đà Nẵng 🏖️" };
    const decoded = decodeTripFromShareParam(encodeTripToShareParam(unicodeTrip));

    expect(decoded.name).toBe("Chuyến đi Đà Nẵng 🏖️");
  });
});
