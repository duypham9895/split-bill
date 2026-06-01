import QRCode from "qrcode";
import type { Member, SettlementPayment } from "../domain/types";

/**
 * Build a standard VietQR URL using the vietqr.io image API.
 * This generates a QR code that any Vietnamese banking app can scan as a payment.
 *
 * URL pattern: https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.jpg
 *
 * The QR encodes an EMVCo-based payload with bank account info, amount, and transfer note.
 * When scanned by a banking app (Techcombank, Vietcombank, Momo, ZaloPay, etc.),
 * it opens a pre-filled transfer form with all details ready.
 */
export function buildVietQrUrl(
  bankCode: string,
  accountNumber: string,
  amount?: number,
  addInfo?: string,
  accountName?: string,
): string {
  const base = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.jpg`;
  const params = new URLSearchParams();

  if (amount && amount > 0) {
    params.set("amount", String(amount));
  }
  if (addInfo) {
    params.set("addInfo", addInfo);
  }
  if (accountName) {
    params.set("accountName", accountName);
  }

  const queryString = params.toString();
  return queryString ? `${base}?${queryString}` : base;
}

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
 * 1. If receiver has bankCode + accountNumber → generate standard VietQR (scannable by banking apps)
 * 2. Otherwise → generate custom QR with transfer details (fallback)
 *
 * When using VietQR, the QR image is fetched from vietqr.io as a data URL
 * so it can be embedded in the app without CORS issues.
 */
export async function generatePaymentQr(receiver: Member, payment: SettlementPayment): Promise<string> {
  const paymentInfo = receiver.payment;

  // Try standard VietQR if we have the required bank details
  if (paymentInfo?.bankCode && paymentInfo?.accountNumber) {
    const note =
      paymentInfo.transferNoteTemplate?.trim() ||
      `Trip Split Bill - ${payment.fromMemberId} to ${payment.toMemberId}`;

    const vietQrUrl = buildVietQrUrl(
      paymentInfo.bankCode,
      paymentInfo.accountNumber,
      payment.amountMinor,
      note,
      paymentInfo.accountHolder ?? receiver.name,
    );

    try {
      // Fetch the VietQR image as a data URL for embedding
      const response = await fetch(vietQrUrl);
      if (response.ok) {
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // Fall through to custom QR generation
    }
  }

  // Fallback: generate custom QR with transfer content
  return QRCode.toDataURL(buildTransferContent(receiver, payment), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
  });
}
