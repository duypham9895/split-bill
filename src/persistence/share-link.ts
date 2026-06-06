import type { Trip } from "../domain/types";
import { exportTripJson, importTripJson } from "./import-export";

/**
 * Share links embed the whole trip in the URL, so size is the constraint:
 * uploaded QR photos and receipt photos are base64 data URLs that can each be
 * hundreds of KB — far past what browsers and messenger apps accept in a URL.
 * They are stripped here; the share view regenerates a scannable VietQR from
 * the member's bank code + account number instead. File export (JSON) keeps
 * the full media untouched.
 */
export function stripHeavyMedia(trip: Trip): Trip {
  return {
    ...trip,
    members: trip.members.map((member) => {
      if (!member.payment?.qrImageDataUrl) {
        return member;
      }
      const { qrImageDataUrl: _qr, ...payment } = member.payment;
      return {
        ...member,
        payment: Object.values(payment).some(Boolean) ? payment : undefined,
      };
    }),
    expenses: trip.expenses.map((expense) => {
      if (!expense.receiptImageDataUrl) {
        return expense;
      }
      const { receiptImageDataUrl: _receipt, ...rest } = expense;
      return rest;
    }),
  };
}

export function encodeTripToShareParam(trip: Trip): string {
  const json = exportTripJson(stripHeavyMedia(trip));
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return encodeURIComponent(btoa(binary));
}

export function decodeTripFromShareParam(payload: string): Trip {
  // URLSearchParams.get() already percent-decodes, making this a no-op there
  // (base64 contains no "%"), but it keeps decode symmetric with encode for
  // callers handing in the raw query-string value.
  const base64 = decodeURIComponent(payload);
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  return importTripJson(new TextDecoder().decode(bytes));
}
