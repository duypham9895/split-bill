import type { Member, Language } from "../../domain/types";
import { t } from "../../i18n/translations";
import { formatMoney } from "../../domain/money";

export type PayerRow = {
  rowId: string;
  memberId: string;
  amount: string;
};

interface PayerInputsProps {
  members: Member[];
  payers: PayerRow[];
  totalMinor: number;
  language: Language;
  onChange: (rows: PayerRow[]) => void;
}

function parse(v: string): number {
  const d = v.replace(/[^\d]/g, "");
  return d ? Number(d) : 0;
}

function nextRowId(rows: PayerRow[]): string {
  const max = rows.reduce((acc, r) => {
    const n = Number(r.rowId);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return String(max + 1);
}

export function PayerInputs({ members, payers, totalMinor, language, onChange }: PayerInputsProps) {
  const activeMembers = members.filter((m) => m.active);

  const covered = payers.reduce((sum, r) => sum + parse(r.amount), 0);
  const ok = covered === totalMinor && totalMinor > 0;

  function handleMemberChange(rowId: string, memberId: string) {
    onChange(payers.map((r) => (r.rowId === rowId ? { ...r, memberId } : r)));
  }

  function handleAmountChange(rowId: string, amount: string) {
    onChange(payers.map((r) => (r.rowId === rowId ? { ...r, amount } : r)));
  }

  function handleRemove(rowId: string) {
    onChange(payers.filter((r) => r.rowId !== rowId));
  }

  function handleAdd() {
    const newRow: PayerRow = {
      rowId: nextRowId(payers),
      memberId: activeMembers[0]?.id ?? "",
      amount: "",
    };
    onChange([...payers, newRow]);
  }

  return (
    <div className="payerInputs">
      <div className="payerRows">
        {payers.map((row) => (
          <div key={row.rowId} className="payerRow">
            <select
              value={row.memberId}
              aria-label={t(language, "whoPaid")}
              onChange={(e) => handleMemberChange(row.rowId, e.target.value)}
            >
              {activeMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              inputMode="numeric"
              value={row.amount}
              placeholder={t(language, "amountPlaceholder")}
              onChange={(e) => handleAmountChange(row.rowId, e.target.value)}
            />
            {payers.length > 1 && (
              <button
                type="button"
                className="btnIcon danger"
                aria-label={t(language, "removePayer")}
                onClick={() => handleRemove(row.rowId)}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div
        data-testid="payer-total"
        className={`payerTotal ${ok ? "ok" : "no"}`}
      >
        <span className="payerTotalLabel">
          {ok ? "✓" : "✗"}{" "}
          {language === "vi" ? "Đã thu" : "Covered"}
        </span>
        <span className="payerTotalNumbers">
          {formatMoney(covered, language)} / {formatMoney(totalMinor, language)}
        </span>
      </div>

      <button type="button" className="btnSecondary" onClick={handleAdd}>
        + {t(language, "addPayer")}
      </button>
    </div>
  );
}
