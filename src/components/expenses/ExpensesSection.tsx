import { Check, Pencil, Plus, ReceiptText, Trash2, X, Utensils, Car, Hotel, ShoppingBag, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import type { Expense, Language, SplitMethod, Trip } from "../../domain/types";
import { formatMoney } from "../../domain/money";
import { calculateExpenseShares } from "../../domain/split";
import { t } from "../../i18n/translations";
import { Avatar } from "../shared/Avatar";
import { PanelHeader } from "../shared/PanelHeader";

export type PayerDraft = {
  rowId: string;
  memberId: string;
  amount: string;
};

export type ParticipantDraft = {
  selected: boolean;
  exactAmount: string;
  percentage: string;
  shares: string;
};

export type ExpenseDraft = {
  title: string;
  amount: string;
  category: string;
  date: string;
  note: string;
  splitMethod: SplitMethod;
  payers: PayerDraft[];
  participants: Record<string, ParticipantDraft>;
};

export function createExpenseDraft(trip: Trip): ExpenseDraft {
  const amount = "300000";
  const members = trip.members.filter((member) => member.active);
  const equalPercent = members.length > 0 ? String(Math.floor(100 / members.length)) : "0";
  const participants = Object.fromEntries(
    members.map((member) => [
      member.id,
      {
        selected: true,
        exactAmount: "0",
        percentage: equalPercent,
        shares: "1",
      },
    ]),
  );

  return {
    title: "",
    amount,
    category: "Food",
    date: today(),
    note: "",
    splitMethod: "equal",
    payers: [
      {
        rowId: "payer-1",
        memberId: members[0]?.id ?? "",
        amount,
      },
    ],
    participants,
  };
}

export function createExpenseDraftFromExpense(expense: Expense, trip: Trip): ExpenseDraft {
  const participantDrafts = new Map(
    expense.participants.map((participant) => [
      participant.memberId,
      {
        selected: true,
        exactAmount: String(participant.exactAmountMinor ?? 0),
        percentage: String(participant.percentage ?? 0),
        shares: String(participant.shares ?? 1),
      },
    ]),
  );
  const participants = Object.fromEntries(
    trip.members.map((member) => [member.id, participantDrafts.get(member.id) ?? defaultParticipant()]),
  );

  return {
    title: expense.title,
    amount: String(expense.amountMinor),
    category: expense.category ?? "",
    date: expense.date,
    note: expense.note ?? "",
    splitMethod: expense.splitMethod,
    payers: expense.payers.map((payer, index) => ({
      rowId: `payer-${expense.id}-${index}`,
      memberId: payer.memberId,
      amount: String(payer.amountMinor),
    })),
    participants,
  };
}

export function buildExpenseFromDraft(draft: ExpenseDraft, trip: Trip, originalExpense?: Expense): Expense {
  const amountMinor = parseAmount(draft.amount);
  const now = new Date().toISOString();
  const payers = draft.payers.map((payer) => ({
    memberId: payer.memberId,
    amountMinor: parseAmount(payer.amount),
  }));

  if (!draft.title.trim()) {
    throw new Error("Give this expense a name (e.g., 'Dinner,' 'Taxi').");
  }

  if (amountMinor <= 0) {
    throw new Error("Enter an amount greater than 0.");
  }

  if (payers.reduce((sum, payer) => sum + payer.amountMinor, 0) !== amountMinor) {
    throw new Error("Payer contributions must equal the expense total.");
  }

  const participants = trip.members
    .filter((member) => draft.participants[member.id]?.selected)
    .map((member) => {
      const participant = draft.participants[member.id] ?? defaultParticipant();
      return {
        memberId: member.id,
        exactAmountMinor:
          draft.splitMethod === "exact" ? parseAmount(participant.exactAmount) : undefined,
        percentage: draft.splitMethod === "percentage" ? Number(participant.percentage) : undefined,
        shares: draft.splitMethod === "shares" ? Number(participant.shares) : undefined,
      };
    });

  return {
    id: originalExpense?.id ?? `expense-${Date.now()}`,
    title: draft.title.trim(),
    amountMinor,
    payers,
    participants,
    splitMethod: draft.splitMethod,
    category: draft.category.trim(),
    date: draft.date,
    note: cleanOptional(draft.note),
    createdAt: originalExpense?.createdAt ?? now,
    updatedAt: now,
  };
}

export function buildPreview(draft: ExpenseDraft, trip: Trip, language: Language) {
  try {
    const expense = buildExpenseFromDraft(draft, trip);
    const shares = Array.from(calculateExpenseShares(expense).entries()).map(
      ([memberId, amount]) => `${getMemberName(trip, memberId)} ${formatMoney(amount, language)}`,
    );

    return {
      ok: true,
      message: `${formatMoney(expense.amountMinor, language)} → ${shares.join(", ")}`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Formula cannot be calculated yet.",
    };
  }
}

export function defaultParticipant(): ParticipantDraft {
  return {
    selected: false,
    exactAmount: "0",
    percentage: "0",
    shares: "1",
  };
}

export function methodLabel(method: SplitMethod, language: Language = "en") {
  const labels: Record<SplitMethod, string> = {
    equal: t(language, "equal"),
    exact: t(language, "exact"),
    percentage: t(language, "percentage"),
    shares: t(language, "shares"),
  };
  return labels[method];
}

export function getMemberName(trip: Trip, memberId: string) {
  return trip.members.find((member) => member.id === memberId)?.name ?? memberId;
}

export function parseAmount(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function cleanOptional(value: string) {
  const cleaned = value.trim();
  return cleaned || undefined;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function categoryIcon(category: string) {
  const lower = category.toLowerCase();
  if (lower.includes("food") || lower.includes("dinner") || lower.includes("lunch") || lower.includes("breakfast") || lower.includes("restaurant") || lower.includes("cafe")) return Utensils;
  if (lower.includes("transport") || lower.includes("taxi") || lower.includes("car") || lower.includes("grab") || lower.includes("bus") || lower.includes("flight")) return Car;
  if (lower.includes("hotel") || lower.includes("room") || lower.includes("accommodation") || lower.includes("hostel")) return Hotel;
  if (lower.includes("shopping") || lower.includes("gift") || lower.includes("souvenir")) return ShoppingBag;
  if (lower.includes("activity") || lower.includes("ticket") || lower.includes("tour") || lower.includes("entertainment")) return Ticket;
  return ReceiptText;
}

export function ExpensesSection({
  draft,
  editingExpenseId,
  error,
  language,
  onCancelEdit,
  onDeleteExpense,
  onEditExpense,
  setDraft,
  trip,
  onSave,
}: {
  draft: ExpenseDraft;
  editingExpenseId: string | null;
  error: string;
  language: Language;
  onCancelEdit: () => void;
  onDeleteExpense: (expenseId: string) => void;
  onEditExpense: (expense: Expense) => void;
  setDraft: (draft: ExpenseDraft) => void;
  trip: Trip;
  onSave: () => void;
}) {
  const preview = useMemo(() => buildPreview(draft, trip, language), [draft, trip, language]);
  const isEditing = editingExpenseId !== null;
  const activeMembers = trip.members.filter((m) => m.active);
  const allSelected = activeMembers.length > 0 && activeMembers.every((m) => draft.participants[m.id]?.selected);
  const selectedCount = activeMembers.filter((m) => draft.participants[m.id]?.selected).length;
  const [expenseSearch, setExpenseSearch] = useState("");

  function toggleAllParticipants(select: boolean) {
    const updated = { ...draft.participants };
    for (const member of activeMembers) {
      updated[member.id] = { ...defaultParticipant(), ...updated[member.id], selected: select };
    }
    setDraft({ ...draft, participants: updated });
  }

  return (
    <div>
      <PanelHeader
        title={isEditing ? t(language, "editExpense") : t(language, "expensesSplits")}
        subtitle={t(language, "expensesSubtitle")}
      />

      <div className="formStack">
        {/* Card 1: What was the expense? */}
        <div className="formCard">
          <div className="formCardHeader">
            <ReceiptText size={18} />
            <span>{t(language, "whatWasExpense")}</span>
          </div>
          <div className="formCardBody">
            <div className="inputGrid">
              <label>
                {t(language, "titleLabel")}
                <input
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  placeholder={t(language, "titlePlaceholder")}
                />
              </label>
              <label>
                {t(language, "categoryLabel")}
                <input
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                  placeholder={t(language, "categoryPlaceholder")}
                />
              </label>
            </div>
            <label>
              {t(language, "amountLabel")}
              <div className="amountInputWrap">
                <input
                  className="amountInput"
                  inputMode="numeric"
                  value={draft.amount}
                  onChange={(event) => {
                    const amount = event.target.value;
                    const payers =
                      draft.payers.length === 1 && draft.payers[0].amount === draft.amount
                        ? [{ ...draft.payers[0], amount }]
                        : draft.payers;
                    setDraft({ ...draft, amount, payers });
                  }}
                  placeholder="0"
                />
                <span className="amountPreview">{formatMoney(parseAmount(draft.amount), language)}</span>
              </div>
            </label>
            <label>
              {t(language, "dateLabel")}
              <input
                type="date"
                value={draft.date}
                onChange={(event) => setDraft({ ...draft, date: event.target.value })}
              />
            </label>
          </div>
        </div>

        {/* Card 2: Who paid? */}
        <div className="formCard">
          <div className="formCardHeader">
            <span>💰</span>
            <span>{t(language, "whoPaid")}</span>
          </div>
          <div className="formCardBody">
            <div className="payerRows">
              {draft.payers.map((payer) => (
                <div className="payerRow" key={payer.rowId}>
                  <select
                    value={payer.memberId}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        payers: draft.payers.map((row) =>
                          row.rowId === payer.rowId ? { ...row, memberId: event.target.value } : row,
                        ),
                      })
                    }
                  >
                    {trip.members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <input
                    inputMode="numeric"
                    value={payer.amount}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        payers: draft.payers.map((row) =>
                          row.rowId === payer.rowId ? { ...row, amount: event.target.value } : row,
                        ),
                      })
                    }
                    placeholder={t(language, "amountPlaceholder")}
                  />
                  <button
                    className="iconButton danger"
                    disabled={draft.payers.length === 1}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        payers: draft.payers.filter((row) => row.rowId !== payer.rowId),
                      })
                    }
                    type="button"
                    aria-label={t(language, "removePayer")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="ghostButton"
              onClick={() =>
                setDraft({
                  ...draft,
                  payers: [
                    ...draft.payers,
                    {
                      rowId: `payer-${Date.now()}`,
                      memberId: trip.members[0]?.id ?? "",
                      amount: "0",
                    },
                  ],
                })
              }
              type="button"
            >
              <Plus size={16} />
              {t(language, "addPayer")}
            </button>
          </div>
        </div>

        {/* Card 3: Who shared this? */}
        <div className="formCard">
          <div className="formCardHeader">
            <span>👥</span>
            <span>{t(language, "whoShared")}</span>
            <span className="formCardBadge">{selectedCount} {t(language, "selected")}</span>
          </div>
          <div className="formCardBody">
            <div className="participantToggleRow">
              <button
                className="ghostButton"
                onClick={() => toggleAllParticipants(!allSelected)}
                type="button"
              >
                {allSelected ? t(language, "clearAll") : t(language, "selectAll")}
              </button>
            </div>
            <div className="participantGrid">
              {trip.members.map((member) => {
                const participant = draft.participants[member.id] ?? defaultParticipant();
                return (
                  <label className="participantCheck" key={member.id}>
                    <input
                      checked={participant.selected}
                      type="checkbox"
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          participants: {
                            ...draft.participants,
                            [member.id]: { ...participant, selected: event.target.checked },
                          },
                        })
                      }
                    />
                    <Avatar member={member} />
                    {member.name}
                  </label>
                );
              })}
            </div>
            <div className="sectionLabel" style={{ marginTop: "var(--space-4)" }}>{t(language, "splitMethod")}</div>
            <div className="segmented">
              {(["equal", "exact", "percentage", "shares"] as SplitMethod[]).map((method) => (
                <button
                  className={draft.splitMethod === method ? "active" : ""}
                  key={method}
                  onClick={() => setDraft({ ...draft, splitMethod: method })}
                  type="button"
                >
                  {methodLabel(method, language)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: Split details (only for non-equal) */}
        {draft.splitMethod !== "equal" && (
          <div className="formCard">
            <div className="formCardHeader">
              <span>📊</span>
              <span>{t(language, "splitDetails")} — {methodLabel(draft.splitMethod, language)}</span>
            </div>
            <div className="formCardBody">
              <div className="splitTable">
                <div className="splitHeader">
                  <span>{t(language, "participant")}</span>
                  <span>{methodLabel(draft.splitMethod, language)}</span>
                </div>
                {trip.members
                  .filter((member) => draft.participants[member.id]?.selected)
                  .map((member) => {
                    const participant = draft.participants[member.id] ?? defaultParticipant();
                    const field =
                      draft.splitMethod === "exact"
                        ? "exactAmount"
                        : draft.splitMethod === "percentage"
                          ? "percentage"
                          : "shares";
                    return (
                      <div className="splitRow" key={member.id}>
                        <span>{member.name}</span>
                        <input
                          value={participant[field]}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              participants: {
                                ...draft.participants,
                                [member.id]: { ...participant, [field]: event.target.value },
                              },
                            })
                          }
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Note */}
        <label>
          {t(language, "noteOptional")}
          <textarea
            value={draft.note}
            onChange={(event) => setDraft({ ...draft, note: event.target.value })}
            placeholder={t(language, "notePlaceholder")}
          />
        </label>

        {/* Sticky formula preview + save */}
        <div className="stickyActionBar">
          <div className={preview.ok ? "formulaBox" : "formulaBox warning"}>
            <strong>{t(language, "formulaPreview")}</strong>
            <span>{preview.message}</span>
          </div>

          {error && <div className="errorBox">{error}</div>}

          <div className="buttonRow">
            <button className="primaryButton" onClick={onSave} type="button">
              {isEditing ? <Check size={18} /> : <ReceiptText size={18} />}
              {isEditing ? t(language, "saveChanges") : t(language, "saveExpense")}
            </button>
            {isEditing && (
              <button className="ghostButton" onClick={onCancelEdit} type="button">
                <X size={18} />
                {t(language, "cancel")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="expenseList">
        {trip.expenses.length === 0 ? (
          <div className="emptyState">
            <ReceiptText size={32} />
            <strong>{t(language, "noExpensesYet")}</strong>
            <p>{t(language, "noExpensesDesc")}</p>
          </div>
        ) : (
          <>
            {trip.expenses.length > 3 && (
              <input
                className="expenseSearch"
                placeholder={language === "vi" ? "Tìm khoản chi..." : "Search expenses..."}
                value={expenseSearch}
                onChange={(event) => setExpenseSearch(event.target.value)}
              />
            )}
            {trip.expenses
              .filter((expense) => {
                if (!expenseSearch.trim()) return true;
                const query = expenseSearch.toLowerCase();
                const payerNames = expense.payers.map((payer) => getMemberName(trip, payer.memberId).toLowerCase()).join(" ");
                return (
                  expense.title.toLowerCase().includes(query) ||
                  (expense.category ?? "").toLowerCase().includes(query) ||
                  payerNames.includes(query)
                );
              })
              .map((expense) => {
                const CatIcon = categoryIcon(expense.category ?? "");
                return (
                  <div className="expenseItem" key={expense.id}>
                    <div className="expenseItemIcon">
                      <CatIcon size={20} />
                    </div>
                    <div className="expenseItemContent">
                      <strong>{expense.title}</strong>
                      <small>
                        {expense.payers.map((payer) => getMemberName(trip, payer.memberId)).join(", ")} ·{" "}
                        {expense.participants.length} {t(language, "selected")} · {methodLabel(expense.splitMethod, language)}
                      </small>
                    </div>
                    <div className="expenseItemMeta">
                      <span className="expenseItemAmount">{formatMoney(expense.amountMinor, language)}</span>
                      <span className="expenseItemDate">{expense.date}</span>
                    </div>
                    <div className="rowActions">
                      <button
                        aria-label={`Edit ${expense.title}`}
                        className="iconButton"
                        onClick={() => onEditExpense(expense)}
                        title={`Edit ${expense.title}`}
                        type="button"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        aria-label={`Delete ${expense.title}`}
                        className="iconButton danger"
                        onClick={() => onDeleteExpense(expense.id)}
                        title={`Delete ${expense.title}`}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            }
          </>
        )}
      </div>
    </div>
  );
}
