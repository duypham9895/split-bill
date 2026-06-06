import { Check } from "lucide-react";
import { formatMoney } from "../../domain/money";
import { t } from "../../i18n/translations";
import type { Language, SettlementPayment, Trip } from "../../domain/types";
import { Avatar } from "../shared/Avatar";

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
        const from = trip.members.find((member) => member.id === payment.fromMemberId);
        const fromName = from?.name ?? payment.fromMemberId;
        const toName =
          trip.members.find((member) => member.id === payment.toMemberId)?.name ??
          payment.toMemberId;
        return (
          <div className="settlementItem" key={`${payment.fromMemberId}-${payment.toMemberId}-${index}`}>
            {/* One readable statement: "[Payer] owes [Receiver]" — the debt fact. */}
            <div className="settlementSentence">
              {!compact && <Avatar member={from} />}
              <span className="settlementSentenceText">
                <strong className="settlementDebtor">{fromName}</strong>{" "}
                {t(language, "owesConnector")}{" "}
                <strong className="settlementCreditor">{toName}</strong>
              </span>
            </div>
            {/* The amount belongs to the statement above, with the action beside it. */}
            <div className="settlementItemActions">
              <span className="settlementAmount mono">{formatMoney(payment.amountMinor, language)}</span>
              {!compact && (
                <button
                  aria-label={`${t(language, "markPaid")}: ${fromName} ${t(language, "owesConnector")} ${toName}`}
                  className="settlementPayButton"
                  onClick={() => onMarkPaid(payment)}
                  type="button"
                >
                  <Check size={14} /> {t(language, "markPaid")}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
