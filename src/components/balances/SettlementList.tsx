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
    return <div className="emptyState">No payments needed. Everyone is settled.</div>;
  }

  return (
    <div className={compact ? "settlementList compact" : "settlementList"}>
      {payments.map((payment, index) => (
        <div className="settlementRow" key={`${payment.fromMemberId}-${payment.toMemberId}-${index}`}>
          <span>
            {getMemberName(trip, payment.fromMemberId)} pays {getMemberName(trip, payment.toMemberId)}
          </span>
          <strong>{formatMoney(payment.amountMinor, language)}</strong>
          {!compact && (
            <button className="ghostButton" onClick={() => onMarkPaid(payment)} type="button">
              {t(language, "markPaid")}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
