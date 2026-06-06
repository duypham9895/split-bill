import { formatMoney } from "../../domain/money";
import { t } from "../../i18n/translations";
import type { Language, MemberBalance, SettlementPayment, Trip } from "../../domain/types";
import { Avatar } from "../shared/Avatar";
import { SettlementList } from "../balances/SettlementList";
import { PaymentCard } from "../balances/PaymentCard";

export function SummaryRail({
  balances,
  language,
  settlement,
  trip,
  onMarkPaid,
  onViewAll,
}: {
  balances: MemberBalance[];
  language: Language;
  settlement: SettlementPayment[];
  trip: Trip;
  onMarkPaid: (payment: SettlementPayment) => void;
  onViewAll?: () => void;
}) {
  return (
    <>
      <div className="railPanel">
        <h2>{t(language, "balancesSettlement")}</h2>
        {balances.map((balance) => (
          <div className="balanceRow" key={balance.memberId}>
            <Avatar member={trip.members.find((member) => member.id === balance.memberId)} />
            <span>{balance.name}</span>
            <strong className={balance.balance >= 0 ? "positive" : "negative"}>
              {formatMoney(balance.balance, language)}
            </strong>
          </div>
        ))}
      </div>
      <div className="railPanel">
        <h2>{t(language, "settlement")}</h2>
        <SettlementList language={language} onMarkPaid={onMarkPaid} payments={settlement.slice(0, 3)} trip={trip} compact />
        {settlement.length > 3 && onViewAll && (
          <button
            className="ghostButton ghostButton--sm"
            onClick={onViewAll}
            type="button"
          >
            {t(language, "viewAllTransfers", { count: settlement.length })}
          </button>
        )}
      </div>
      {settlement[0] && <PaymentCard language={language} payment={settlement[0]} trip={trip} />}
    </>
  );
}
