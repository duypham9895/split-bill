import QRCode from "qrcode";
import type { Member, SettlementPayment } from "../domain/types";

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

export async function generatePaymentQr(receiver: Member, payment: SettlementPayment) {
  return QRCode.toDataURL(buildTransferContent(receiver, payment), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
  });
}

