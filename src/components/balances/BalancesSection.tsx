import { Check, ArrowRight } from "lucide-react";
import { formatMoney } from "../../domain/money";
import { t } from "../../i18n/translations";
import type { Language, MemberBalance, SettlementPayment, Trip } from "../../domain/types";
import { PanelHeader } from "../shared/PanelHeader";
import { Avatar } from "../shared/Avatar";
import { BalancesTable } from "./BalancesTable";
import { SettlementList } from "./SettlementList";

export type SettlementMode = "simplified" | "direct";

function getMemberName(trip: Trip, memberId: string) {
  return trip.members.find((member) => member.id === memberId)?.name ?? memberId;
}

export function BalancesSection({
  balances,
  language,
  mode,
  settlement,
  setMode,
  trip,
  onMarkPaid,
}: {
  balances: MemberBalance[];
  language: Language;
  mode: SettlementMode;
  settlement: SettlementPayment[];
  setMode: (mode: SettlementMode) => void;
  trip: Trip;
  onMarkPaid: (payment: SettlementPayment) => void;
}) {
  const hasTransfers = trip.transfers.length > 0;

  return (
    <div>
      <PanelHeader title={t(language, "balancesSettlement")} subtitle="Audit totals, settlement modes, and paid transfers." />

      {/* Balance Cards */}
      <div className="balanceCards">
        {balances.map((balance) => {
          const member = trip.members.find((m) => m.id === balance.memberId);
          const status = balance.balance > 0 ? "receive" : balance.balance < 0 ? "pay" : "settled";
          return (
            <div className={`balanceCard balanceCard--${status}`} key={balance.memberId}>
              <div className="balanceCardHeader">
                <Avatar member={member} />
                <div>
                  <strong>{balance.name}</strong>
                  <span className={`balanceCardStatus balanceCardStatus--${status}`}>
                    {status === "receive" && t(language, "shouldReceive")}
                    {status === "pay" && t(language, "shouldPay")}
                    {status === "settled" && t(language, "settled")}
                  </span>
                </div>
              </div>
              <div className="balanceCardAmount">
                {balance.balance >= 0 ? "+" : ""}{formatMoney(balance.balance, language)}
              </div>
              <div className="balanceCardDetail">
                <span>Paid: {formatMoney(balance.totalPaid, language)}</span>
                <span>Owed: {formatMoney(balance.totalOwed, language)}</span>
                {balance.transferPaid > 0 && <span>Transfer paid: {formatMoney(balance.transferPaid, language)}</span>}
                {balance.transferReceived > 0 && <span>Transfer received: {formatMoney(balance.transferReceived, language)}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full balance table (collapsed by default) */}
      <details className="balanceTableToggle">
        <summary>View full balance breakdown</summary>
        <BalancesTable balances={balances} language={language} />
      </details>

      {/* Settlement Mode */}
      <div className="settlementSection">
        <h2>Settlement</h2>
        <div className="settlementControls">
          <button className={mode === "simplified" ? "active" : ""} onClick={() => setMode("simplified")} type="button">
            <span>{t(language, "simplified")}</span>
            <small>Fewest transfers</small>
          </button>
          <button className={mode === "direct" ? "active" : ""} onClick={() => setMode("direct")} type="button">
            <span>{t(language, "directPayback")}</span>
            <small>Pay who you owe</small>
          </button>
        </div>
      </div>

      <SettlementList language={language} onMarkPaid={onMarkPaid} payments={settlement} trip={trip} />

      {/* Transfers Timeline */}
      <div className="transferList">
        <h3>Transfers</h3>
        {!hasTransfers ? (
          <div className="emptyState">
            <ArrowRight size={24} />
            <strong>No transfers yet</strong>
            <p>Mark a settlement payment as paid to record a transfer.</p>
          </div>
        ) : (
          <div className="transferTimeline">
            {trip.transfers.map((transfer) => (
              <div className="transferTimelineItem" key={transfer.id}>
                <div className="transferTimelineDot">
                  <Check size={14} />
                </div>
                <div className="transferTimelineContent">
                  <div className="transferTimelineHeader">
                    <span>
                      <strong>{getMemberName(trip, transfer.fromMemberId)}</strong>
                      <ArrowRight size={14} />
                      <strong>{getMemberName(trip, transfer.toMemberId)}</strong>
                    </span>
                    <strong>{formatMoney(transfer.amountMinor, language)}</strong>
                  </div>
                  <small>{transfer.date}{transfer.note ? ` · ${transfer.note}` : ""}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
