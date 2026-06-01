import { Check } from "lucide-react";
import { formatMoney } from "../../domain/money";
import { t } from "../../i18n/translations";
import type { Language, SettlementPayment, Trip } from "../../domain/types";

function getMemberName(trip: Trip, memberId: string) {
  return trip.members.find((member) => member.id === memberId)?.name ?? memberId;
}

export function SettlementList({
  compact = false,
  language,
  onMarkPaid,
  payments,
  trip,
}: {
  compact?: boolean;
  language: Language;
  onMarkPaid: (payment: SettlementPayment) => void;
  payments: SettlementPayment[];
  trip: Trip;
}) {
  if (payments.length === 0) {
    return <div className="emptyState">{t(language, "noPaymentsNeeded")}</div>;
  }

  return (
    <div className={compact ? "settlementList compact" : "settlementList"}>
      {payments.map((payment, index) => {
        const fromName = getMemberName(trip, payment.fromMemberId);
        const toName = getMemberName(trip, payment.toMemberId);
        return (
          <div className="settlementItem" key={`${payment.fromMemberId}-${payment.toMemberId}-${index}`}>
            <div className="settlementFlow">
              <span className="settlementFrom">{fromName}</span>
              <span className="settlementArrow">&rarr;</span>
              <span className="settlementAmount">{formatMoney(payment.amountMinor, language)}</span>
              <span className="settlementArrow">&rarr;</span>
              <span className="settlementTo">{toName}</span>
            </div>
            {!compact && (
              <button className="ghostButton" onClick={() => onMarkPaid(payment)} type="button">
                <Check size={14} /> {t(language, "markPaid")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
