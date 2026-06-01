import { Banknote } from "lucide-react";
import { useEffect, useState } from "react";
import { formatMoney } from "../../domain/money";
import type { Language, SettlementPayment, Trip } from "../../domain/types";
import { generatePaymentQr } from "../../payment/qr";

export function PaymentCard({
  language,
  payment,
  trip,
}: {
  language: Language;
  payment: SettlementPayment;
  trip: Trip;
}) {
  const receiver = trip.members.find((member) => member.id === payment.toMemberId);
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!receiver) {
      return;
    }
    let cancelled = false;
    void generatePaymentQr(receiver, payment).then((dataUrl) => {
      if (!cancelled) {
        setQr(dataUrl);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [payment, receiver]);

  if (!receiver) {
    return null;
  }

  return (
    <div className="railPanel paymentCard">
      <h2>Payment to {receiver.name}</h2>
      <div className="bankBox">
        <Banknote size={24} />
        <span>
          <strong>{receiver.payment?.bankName ?? "Bank not added"}</strong>
          <small>{receiver.payment?.accountNumber ?? "Add account number"}</small>
          <small>{receiver.payment?.accountHolder ?? receiver.name}</small>
        </span>
      </div>
      {qr && <img alt={`QR for ${receiver.name}`} src={receiver.payment?.qrImageDataUrl || qr} />}
      <small>{formatMoney(payment.amountMinor, language)} · transfer manually after checking formulas.</small>
    </div>
  );
}
