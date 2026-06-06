import { Banknote, Check, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import { calculateTrip } from "../../domain/calculations";
import { formatMoney } from "../../domain/money";
import type { Language, SettlementPayment, Trip } from "../../domain/types";
import { t } from "../../i18n/translations";
import { useGeneratedQr } from "../../payment/use-generated-qr";
import { Avatar } from "../shared/Avatar";

function storageKey(tripId: string) {
  return `split-bill:shareview:${tripId}`;
}

function readSelection(tripId: string): string | null {
  try {
    return window.sessionStorage.getItem(storageKey(tripId));
  } catch {
    return null;
  }
}

function writeSelection(tripId: string, memberId: string | null) {
  try {
    if (memberId) {
      window.sessionStorage.setItem(storageKey(tripId), memberId);
    } else {
      window.sessionStorage.removeItem(storageKey(tripId));
    }
  } catch {
    // sessionStorage unavailable — selection just won't persist across refresh.
  }
}

export function ShareView({ trip }: { trip: Trip }) {
  const language = trip.language;
  const activeMembers = useMemo(() => trip.members.filter((member) => member.active), [trip.members]);
  const [selectedId, setSelectedId] = useState<string | null>(() => readSelection(trip.id));

  const calculation = useMemo(() => calculateTrip(trip), [trip]);
  const selectedMember = trip.members.find((member) => member.id === selectedId);
  const selectedBalance = calculation.balances.find((balance) => balance.memberId === selectedId);

  function selectMember(memberId: string) {
    setSelectedId(memberId);
    writeSelection(trip.id, memberId);
  }

  function resetSelection() {
    setSelectedId(null);
    writeSelection(trip.id, null);
  }

  // Picker view — no valid selection yet.
  if (!selectedMember || !selectedBalance) {
    return (
      <div className="shareView">
        <div className="shareViewCard">
          <div className="shareViewBrand">
            <div className="brandMark">
              <ReceiptText size={22} />
            </div>
            <strong>{trip.name}</strong>
          </div>
          <h1>{t(language, "whoAreYou")}</h1>
          <div className="shareViewPicker">
            {activeMembers.map((member) => (
              <button
                key={member.id}
                className="shareViewMemberButton"
                onClick={() => selectMember(member.id)}
                type="button"
              >
                <Avatar member={member} />
                <span>{member.name}</span>
              </button>
            ))}
          </div>
          <p className="shareViewFooter">{t(language, "readOnlySummary")}</p>
        </div>
      </div>
    );
  }

  const owes = selectedBalance.balance < 0;
  const owed = selectedBalance.balance > 0;
  const outgoing = calculation.simplifiedSettlement.filter(
    (payment) => payment.fromMemberId === selectedMember.id,
  );
  const incoming = calculation.simplifiedSettlement.filter(
    (payment) => payment.toMemberId === selectedMember.id,
  );

  return (
    <div className="shareView">
      <div className="shareViewCard">
        <div className="shareViewBrand">
          <div className="brandMark">
            <ReceiptText size={22} />
          </div>
          <strong>{trip.name}</strong>
        </div>

        <div className="shareViewHello">
          <Avatar member={selectedMember} />
          <div>
            <strong>{selectedMember.name}</strong>
            <button className="linkButton" onClick={resetSelection} type="button">
              {t(language, "notYou")}
            </button>
          </div>
        </div>

        {owes && (
          <div className="shareViewStatus shareViewStatus--owe">
            <small>{t(language, "youOwe")}</small>
            <strong className="mono">{formatMoney(Math.abs(selectedBalance.balance), language)}</strong>
          </div>
        )}
        {owed && (
          <div className="shareViewStatus shareViewStatus--owed">
            <small>{t(language, "youreOwed")}</small>
            <strong className="mono">{formatMoney(selectedBalance.balance, language)}</strong>
          </div>
        )}
        {!owes && !owed && (
          <div className="shareViewStatus shareViewStatus--settled">
            <Check size={20} />
            <strong>{t(language, "allSettledUp")}</strong>
          </div>
        )}

        {owes &&
          outgoing.map((payment, index) => (
            <SharePaymentCard
              key={`${payment.toMemberId}-${index}`}
              language={language}
              payment={payment}
              trip={trip}
            />
          ))}

        {owed && incoming.length > 0 && (
          <div className="shareViewIncoming">
            {incoming.map((payment, index) => {
              const payer = trip.members.find((member) => member.id === payment.fromMemberId);
              return (
                <div className="shareViewIncomingRow" key={`${payment.fromMemberId}-${index}`}>
                  <span>{payer?.name ?? payment.fromMemberId}</span>
                  <span className="mono">{formatMoney(payment.amountMinor, language)}</span>
                </div>
              );
            })}
          </div>
        )}

        <details className="shareViewBreakdown">
          <summary>{t(language, "howCalculated")}</summary>
          <div className="shareViewBreakdownBody">
            <div className="shareViewBreakdownTotals">
              <div>
                <small>{t(language, "paid")}</small>
                <span className="mono">{formatMoney(selectedBalance.totalPaid, language)}</span>
              </div>
              <div>
                <small>{t(language, "owed")}</small>
                <span className="mono">{formatMoney(selectedBalance.totalOwed, language)}</span>
              </div>
            </div>
            <ul className="shareViewExpenseList">
              {trip.expenses.map((expense) => (
                <li key={expense.id}>
                  <span>{expense.title}</span>
                  <span className="mono">{formatMoney(expense.amountMinor, language)}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>

        <p className="shareViewFooter">{t(language, "readOnlySummary")}</p>
      </div>
    </div>
  );
}

function SharePaymentCard({
  language,
  payment,
  trip,
}: {
  language: Language;
  payment: SettlementPayment;
  trip: Trip;
}) {
  const receiver = trip.members.find((member) => member.id === payment.toMemberId);
  const { qr, loading } = useGeneratedQr(receiver, payment);

  if (!receiver) {
    return null;
  }

  return (
    <div className="shareViewPayment">
      <div className="shareViewPaymentHead">
        <span>
          <strong>{receiver.name}</strong>
          <small className="mono">{formatMoney(payment.amountMinor, language)}</small>
        </span>
      </div>
      {loading ? (
        <div className="skeleton qrThumb shareViewQr" />
      ) : (
        <img
          className="shareViewQr"
          alt={`${t(language, "scanToPay")} ${receiver.name}`}
          src={qr}
        />
      )}
      <p className="shareViewScanHint">{t(language, "scanToPay")}</p>
      <div className="bankBox">
        <Banknote size={20} />
        <span>
          <strong>{receiver.payment?.bankName ?? t(language, "bankNotAdded")}</strong>
          <small>{receiver.payment?.accountNumber ?? t(language, "addAccountNumber")}</small>
          <small>{receiver.payment?.accountHolder ?? receiver.name}</small>
        </span>
      </div>
    </div>
  );
}
