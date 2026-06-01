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

  // Stat card calculations
  const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amountMinor, 0);
  const totalOwed = balances.filter((b) => b.balance > 0).reduce((sum, b) => sum + b.balance, 0);
  const totalOwing = Math.abs(balances.filter((b) => b.balance < 0).reduce((sum, b) => sum + b.balance, 0));

  return (
    <div>
      <PanelHeader title={t(language, "balancesSettlement")} subtitle={t(language, "balancesSubtitle")} />

      {/* Summary Stat Cards */}
      <div className="statCardsRow">
        <div className="statCard">
          <div className="statCardValue">{formatMoney(totalSpent, language)}</div>
          <div className="statCardLabel">Total Spent</div>
        </div>
        <div className="statCard">
          <div className="statCardValue" style={{ color: "var(--color-danger)" }}>
            {formatMoney(totalOwing, language)}
          </div>
          <div className="statCardLabel">To Pay</div>
        </div>
        <div className="statCard">
          <div className="statCardValue" style={{ color: "var(--color-success)" }}>
            {formatMoney(totalOwed, language)}
          </div>
          <div className="statCardLabel">To Receive</div>
        </div>
      </div>

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
                <span className={`balanceBadge ${balance.balance > 0 ? "positive" : balance.balance < 0 ? "negative" : "settled"}`}>
                  {balance.balance > 0 ? "+" : ""}{formatMoney(balance.balance, language)}
                </span>
              </div>
              <div className="balanceCardDetail">
                <div className="detailRow">
                  <span>{t(language, "paid")}</span>
                  <span>{formatMoney(balance.totalPaid, language)}</span>
                </div>
                <div className="detailRow">
                  <span>{t(language, "owed")}</span>
                  <span>{formatMoney(balance.totalOwed, language)}</span>
                </div>
                {balance.transferPaid > 0 && (
                  <div className="detailRow">
                    <span>{t(language, "transferPaid")}</span>
                    <span>{formatMoney(balance.transferPaid, language)}</span>
                  </div>
                )}
                {balance.transferReceived > 0 && (
                  <div className="detailRow">
                    <span>{t(language, "transferReceived")}</span>
                    <span>{formatMoney(balance.transferReceived, language)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full balance table (collapsed by default) */}
      <details className="balanceTableToggle">
        <summary>{t(language, "viewFullBreakdown")}</summary>
        <BalancesTable balances={balances} language={language} />
      </details>

      {/* Settlement Mode */}
      <div className="settlementSection">
        <h2>{t(language, "settlement")}</h2>
        <div className="settlementControls">
          <button className={mode === "simplified" ? "active" : ""} onClick={() => setMode("simplified")} type="button">
            <span>{t(language, "simplified")}</span>
            <small>{t(language, "fewestTransfers")}</small>
          </button>
          <button className={mode === "direct" ? "active" : ""} onClick={() => setMode("direct")} type="button">
            <span>{t(language, "directPayback")}</span>
            <small>{t(language, "payWhoYouOwe")}</small>
          </button>
        </div>
      </div>

      <SettlementList language={language} onMarkPaid={onMarkPaid} payments={settlement} trip={trip} />

      {/* Transfers Timeline */}
      <div className="transferList">
        <h3>{t(language, "transfers")}</h3>
        {!hasTransfers ? (
          <div className="emptyState">
            <ArrowRight size={24} />
            <strong>{t(language, "noTransfersYet")}</strong>
            <p>{t(language, "noTransfersDesc")}</p>
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
