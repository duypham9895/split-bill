import { formatMoney } from "../../domain/money";
import { t } from "../../i18n/translations";
import type { Language, MemberBalance } from "../../domain/types";

export function BalancesTable({ balances, language }: { balances: MemberBalance[]; language: Language }) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>{t(language, "memberName")}</th>
            <th>{t(language, "paid")}</th>
            <th>{t(language, "owed")}</th>
            <th>{t(language, "transferPaid")}</th>
            <th>{t(language, "transferReceived")}</th>
            <th>{t(language, "balance")}</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((balance) => (
            <tr key={balance.memberId}>
              <td>{balance.name}</td>
              <td>{formatMoney(balance.totalPaid, language)}</td>
              <td>{formatMoney(balance.totalOwed, language)}</td>
              <td>{formatMoney(balance.transferPaid, language)}</td>
              <td>{formatMoney(balance.transferReceived, language)}</td>
              <td className={balance.balance >= 0 ? "positive" : "negative"}>
                {formatMoney(balance.balance, language)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
