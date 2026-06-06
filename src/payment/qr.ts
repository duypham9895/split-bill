import QRCode from "qrcode";
import type { Member, SettlementPayment } from "../domain/types";
import { generateVietQrDataUrl } from "./vietqr";
import { resolveBankBin } from "./bank-bins";

/**
 * Build the transfer content string for manual QR generation (fallback).
 * Used when bank details are insufficient for VietQR generation.
 */
export function buildTransferContent(receiver: Member, payment: SettlementPayment) {
  const paymentInfo = receiver.payment;
  const note =
    paymentInfo?.transferNoteTemplate?.trim() ||
    `Trip Split Bill - ${payment.fromMemberId} to ${payment.toMemberId}`;

  return [
    "TRIP_SPLIT_BILL",
    `BANK=${paymentInfo?.bankName ?? ""}`,
    `BANK_CODE=${paymentInfo?.bankCode ?? ""}`,
    `ACCOUNT=${paymentInfo?.accountNumber ?? ""}`,
    `NAME=${paymentInfo?.accountHolder ?? receiver.name}`,
    `AMOUNT=${payment.amountMinor}`,
    `NOTE=${note}`,
  ].join("|");
}

/**
 * Generate a payment QR code for a settlement payment.
 *
 * Strategy:
 * 1. If receiver has a resolvable bankCode + accountNumber → build a real,
 *    scannable VietQR EMVCo payload entirely offline (no network required).
 * 2. Otherwise → generate a custom QR with human-readable transfer details.
 */
export async function generatePaymentQr(receiver: Member, payment: SettlementPayment): Promise<string> {
  const paymentInfo = receiver.payment;
  const bankBin = resolveBankBin(paymentInfo?.bankCode);

  // Preferred: build a real, scannable VietQR EMVCo payload entirely offline.
  if (bankBin && paymentInfo?.accountNumber) {
    const note =
      paymentInfo.transferNoteTemplate?.trim() ||
      `${payment.fromMemberId}-${payment.toMemberId}`;
    return generateVietQrDataUrl({
      bankBin,
      accountNumber: paymentInfo.accountNumber,
      amount: payment.amountMinor,
      description: note,
    });
  }

  // Fallback: encode human-readable transfer details (when bank is unknown).
  return QRCode.toDataURL(buildTransferContent(receiver, payment), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
  });
}
