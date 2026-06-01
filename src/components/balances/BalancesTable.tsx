import { formatMoney } from "../../domain/money";
import type { Language, MemberBalance } from "../../domain/types";

export function BalancesTable({ balances, language }: { balances: MemberBalance[]; language: Language }) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Paid</th>
            <th>Owed</th>
            <th>Transfer paid</th>
            <th>Transfer received</th>
            <th>Balance</th>
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
