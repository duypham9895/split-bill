import { Banknote } from "lucide-react";
import { useEffect, useState } from "react";
import { formatMoney } from "../../domain/money";
import { t } from "../../i18n/translations";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!receiver) {
      return;
    }
    setLoading(true);
    let cancelled = false;
    void generatePaymentQr(receiver, payment)
      .then((dataUrl) => {
        if (!cancelled) {
          setQr(dataUrl);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
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
      <h2>{t(language, "paymentTo")} {receiver.name}</h2>
      <div className="bankBox">
        <Banknote size={24} />
        <span>
          <strong>{receiver.payment?.bankName ?? t(language, "bankNotAdded")}</strong>
          <small>{receiver.payment?.accountNumber ?? t(language, "addAccountNumber")}</small>
          <small>{receiver.payment?.accountHolder ?? receiver.name}</small>
        </span>
      </div>
      {loading ? (
        <div className="skeleton" style={{ width: 72, height: 72 }} />
      ) : qr ? (
        <img alt={`${t(language, "paymentTo")} ${receiver.name}`} src={receiver.payment?.qrImageDataUrl || qr} />
      ) : null}
      <small>{formatMoney(payment.amountMinor, language)} · {t(language, "transferManually")}</small>
    </div>
  );
}
