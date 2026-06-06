import { Banknote, Car, Check, Hotel, ImagePlus, MoreHorizontal, Pencil, PieChart, ReceiptText, ShoppingBag, SplitSquareHorizontal, Ticket, Trash2, Users, UtensilsCrossed, Wine, X } from "lucide-react";
import { useMemo, useRef, useState, type ElementType } from "react";
import type { Expense, Language, SplitMethod, Trip } from "../../domain/types";
import { formatMoney } from "../../domain/money";
import { calculateExpenseShares } from "../../domain/split";
import { cleanOptional } from "../../domain/strings";
import { t } from "../../i18n/translations";
import { isImageFile, resizeToDataUrl } from "../../media/resize-image";
import { PanelHeader } from "../shared/PanelHeader";
import { QuickAdd } from "./QuickAdd";
import { SplitMethodPicker } from "./SplitMethodPicker";
import { ParticipantSelector } from "./ParticipantSelector";
import { PayerInputs, type PayerRow } from "./PayerInputs";

import type { TranslationKey } from "../../i18n/translations";

const EXPENSE_CATEGORIES: { value: string; labelKey: TranslationKey; icon: ElementType }[] = [
  { value: "food", labelKey: "catFood", icon: UtensilsCrossed },
  { value: "transport", labelKey: "catTransport", icon: Car },
  { value: "hotel", labelKey: "catHotel", icon: Hotel },
  { value: "activity", labelKey: "catActivity", icon: Ticket },
  { value: "shopping", labelKey: "catShopping", icon: ShoppingBag },
  { value: "drinks", labelKey: "catDrinks", icon: Wine },
  { value: "other", labelKey: "catOther", icon: MoreHorizontal },
];

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
  /** When false, the form shows a single "Paid by" picker and the lone payer amount tracks the total. */
  payersExpanded: boolean;
  participants: Record<string, ParticipantDraft>;
  receiptImageDataUrl?: string;
};

export function createExpenseDraft(trip: Trip): ExpenseDraft {
  const amount = "";
  const members = trip.members.filter((member) => member.active);
  // Seed percentages so they sum to exactly 100: base = floor(100/n), and the
  // first `remainder` participants get base + 1 (e.g. 3 people → 34/33/33).
  const base = members.length > 0 ? Math.floor(100 / members.length) : 0;
  const remainder = members.length > 0 ? 100 - base * members.length : 0;
  const participants = Object.fromEntries(
    members.map((member, index) => [
      member.id,
      {
        selected: true,
        exactAmount: "0",
        percentage: String(index < remainder ? base + 1 : base),
        shares: "1",
      },
    ]),
  );

  return {
    title: "",
    amount,
    category: "",
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
    payersExpanded: false,
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
    payersExpanded: expense.payers.length > 1,
    participants,
    receiptImageDataUrl: expense.receiptImageDataUrl,
  };
}

export function buildExpenseFromDraft(draft: ExpenseDraft, trip: Trip, originalExpense?: Expense, language: Language = "en"): Expense {
  const amountMinor = parseAmount(draft.amount);
  const now = new Date().toISOString();
  const payers = draft.payers.map((payer) => ({
    memberId: payer.memberId,
    amountMinor: parseAmount(payer.amount),
  }));

  if (!draft.title.trim()) {
    throw new Error(t(language, "expenseTitleRequired"));
  }

  if (amountMinor <= 0) {
    throw new Error(t(language, "expenseAmountRequired"));
  }

  if (payers.reduce((sum, payer) => sum + payer.amountMinor, 0) !== amountMinor) {
    throw new Error(t(language, "payerTotalMismatch"));
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
    receiptImageDataUrl: draft.receiptImageDataUrl ?? undefined,
    createdAt: originalExpense?.createdAt ?? now,
    updatedAt: now,
  };
}

export function buildPreview(draft: ExpenseDraft, trip: Trip, language: Language) {
  try {
    const expense = buildExpenseFromDraft(draft, trip, undefined, language);
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

function today() {
  return new Date().toISOString().slice(0, 10);
}

function categoryIcon(category: string) {
  const cat = EXPENSE_CATEGORIES.find((c) => c.value === category);
  return cat ? cat.icon : ReceiptText;
}

function groupExpensesByDate(expenses: Expense[]): Map<string, Expense[]> {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const date = expense.date || "No date";
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date)!.push(expense);
  }
  return groups;
}

function formatDateHeader(date: string): string {
  if (date === "No date") return date;
  try {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return date;
  }
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

  // Quick-add: pre-fill the NEW-expense form from a template (source expense untouched).
  // We intentionally do NOT call onEditExpense so editingExpenseId stays null — this
  // starts a brand-new expense pre-filled with the template's structure, not an edit.
  function handleQuickPick(expense: Expense) {
    const templated = createExpenseDraftFromExpense(expense, trip);
    // Blank out amount (user must type the new figure), clear receipt, set today's date.
    const firstPayer = templated.payers[0];
    setDraft({
      ...templated,
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      receiptImageDataUrl: undefined,
      // Keep single-payer collapsed; reset payer amount to empty too.
      payers: templated.payersExpanded
        ? templated.payers.map((row) => ({ ...row, amount: "" }))
        : [{ rowId: firstPayer?.rowId ?? "payer-1", memberId: firstPayer?.memberId ?? "", amount: "" }],
      payersExpanded: false,
    });
  }
  const activeMembers = trip.members.filter((m) => m.active);
  const selectedCount = activeMembers.filter((m) => draft.participants[m.id]?.selected).length;
  const [expenseSearch, setExpenseSearch] = useState("");
  const receiptInputRef = useRef<HTMLInputElement>(null);

  async function handleReceiptUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isImageFile(file)) return;
    try {
      const dataUrl = await resizeToDataUrl(file);
      setDraft({ ...draft, receiptImageDataUrl: dataUrl });
    } catch {
      // Silently ignore — canvas not available in some environments
    }
    event.target.value = "";
  }

  const amountMinor = parseAmount(draft.amount);
  // The form is valid (and Save enabled) only when the live preview computes cleanly:
  // buildPreview runs buildExpenseFromDraft (title + amount + payer-sum checks) then
  // calculateExpenseShares (split validity). preview.ok reflects all of them at once.
  const canSave = preview.ok;
  // Show a friendly "adjust the split" hint when the blocker is a sum-constrained
  // split (percentage must total 100, exact amounts must total the expense).
  const showFixSplitHint =
    !preview.ok && (draft.splitMethod === "percentage" || draft.splitMethod === "exact");

  // Bridge: ParticipantSelector works on a string[] of selected member ids.
  const selectedParticipantIds = activeMembers
    .filter((m) => draft.participants[m.id]?.selected)
    .map((m) => m.id);

  function setSelectedParticipants(ids: string[]) {
    const idSet = new Set(ids);
    const updated = { ...draft.participants };
    for (const member of activeMembers) {
      const current = updated[member.id] ?? defaultParticipant();
      updated[member.id] = { ...current, selected: idSet.has(member.id) };
    }
    setDraft({ ...draft, participants: updated });
  }

  // Bridge: PayerInputs works on PayerRow[] which is structurally identical to PayerDraft.
  function setPayerRows(rows: PayerRow[]) {
    setDraft({ ...draft, payers: rows });
  }

  // Collapse to a single payer whose amount tracks the full expense total.
  function collapsePayers() {
    const first = draft.payers[0];
    setDraft({
      ...draft,
      payersExpanded: false,
      payers: [
        {
          rowId: first?.rowId ?? "payer-1",
          memberId: first?.memberId ?? activeMembers[0]?.id ?? "",
          amount: draft.amount,
        },
      ],
    });
  }

  // Expand to the multi-payer editor, seeding the first row with the full amount.
  function expandPayers() {
    const first = draft.payers[0];
    setDraft({
      ...draft,
      payersExpanded: true,
      payers: [
        {
          rowId: first?.rowId ?? "payer-1",
          memberId: first?.memberId ?? activeMembers[0]?.id ?? "",
          amount: draft.amount,
        },
      ],
    });
  }

  function setSinglePayerMember(memberId: string) {
    const first = draft.payers[0];
    setDraft({
      ...draft,
      payers: [{ rowId: first?.rowId ?? "payer-1", memberId, amount: draft.amount }],
    });
  }

  return (
    <div>
      <PanelHeader
        title={isEditing ? t(language, "editExpense") : t(language, "expensesSplits")}
        subtitle={t(language, "expensesSubtitle")}
      />

      {!isEditing && (
        <QuickAdd trip={trip} language={language} onPick={handleQuickPick} />
      )}

      <div className="formStack">
        {/* Card 1: Amount → What → Category + Date */}
        <div className="formCard">
          <div className="formCardHeader">
            <ReceiptText size={18} />
            <span>{t(language, "whatWasExpense")}</span>
          </div>
          <div className="formCardBody">
            <label>
              {t(language, "amountLabel")}
              <div className="amountInputWrap">
                <input
                  className="amountInput"
                  inputMode="numeric"
                  value={draft.amount}
                  onChange={(event) => {
                    const amount = event.target.value;
                    // When collapsed (single payer), keep that payer's amount in lockstep with the total.
                    const payers = draft.payersExpanded
                      ? draft.payers
                      : draft.payers.map((row, index) =>
                          index === 0 ? { ...row, amount } : row,
                        );
                    setDraft({ ...draft, amount, payers });
                  }}
                  placeholder="0"
                />
                <span className="amountPreview">{formatMoney(amountMinor, language)}</span>
              </div>
            </label>
            <label>
              {t(language, "titleLabel")}
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder={t(language, "titlePlaceholder")}
              />
            </label>
            <div className="inputGrid">
              <label>
                {t(language, "categoryLabel")}
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                >
                  <option value="">{t(language, "selectCategory")}</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{t(language, cat.labelKey)}</option>
                  ))}
                </select>
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
        </div>

        {/* Card 2: Who paid? — single-payer default, expandable to multi-payer */}
        <div className="formCard">
          <div className="formCardHeader">
            <Banknote size={18} />
            <span>{t(language, "whoPaid")}</span>
          </div>
          <div className="formCardBody">
            {draft.payersExpanded ? (
              <>
                <PayerInputs
                  members={activeMembers}
                  payers={draft.payers}
                  totalMinor={amountMinor}
                  language={language}
                  onChange={setPayerRows}
                />
                <button className="ghostButton" type="button" onClick={collapsePayers}>
                  {t(language, "singlePayer")}
                </button>
              </>
            ) : (
              <>
                <label>
                  {t(language, "paidBy")}
                  <select
                    aria-label={t(language, "paidBy")}
                    value={draft.payers[0]?.memberId ?? ""}
                    onChange={(event) => setSinglePayerMember(event.target.value)}
                  >
                    {activeMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="ghostButton" type="button" onClick={expandPayers}>
                  <SplitSquareHorizontal size={16} />
                  {t(language, "splitPayers")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Split how? */}
        <div className="formCard">
          <div className="formCardHeader">
            <PieChart size={18} />
            <span>{t(language, "splitHow")}</span>
          </div>
          <div className="formCardBody">
            <SplitMethodPicker
              method={draft.splitMethod}
              language={language}
              onChange={(method) => setDraft({ ...draft, splitMethod: method })}
            />
          </div>
        </div>

        {/* Card 4: Between who? */}
        <div className="formCard">
          <div className="formCardHeader">
            <Users size={18} />
            <span>{t(language, "betweenWho")}</span>
            <span className="formCardBadge">{selectedCount} {t(language, "selected")}</span>
          </div>
          <div className="formCardBody">
            <ParticipantSelector
              members={activeMembers}
              selected={selectedParticipantIds}
              language={language}
              onChange={setSelectedParticipants}
            />
          </div>
        </div>

        {/* Card 5: Split details (only for non-equal) */}
        {draft.splitMethod !== "equal" && (
          <div className="formCard">
            <div className="formCardHeader">
              <PieChart size={18} />
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

        {/* Receipt photo */}
        <div className="receiptUploadRow">
          <input
            ref={receiptInputRef}
            accept="image/*"
            style={{ display: "none" }}
            type="file"
            onChange={handleReceiptUpload}
          />
          {draft.receiptImageDataUrl ? (
            <div className="receiptPreview">
              <img
                alt={t(language, "receiptAlt")}
                className="receiptThumb"
                src={draft.receiptImageDataUrl}
              />
              <button
                className="ghostButton"
                type="button"
                onClick={() => setDraft({ ...draft, receiptImageDataUrl: undefined })}
              >
                <X size={16} />
                {t(language, "removeReceipt")}
              </button>
            </div>
          ) : (
            <button
              className="ghostButton"
              type="button"
              onClick={() => receiptInputRef.current?.click()}
            >
              <ImagePlus size={16} />
              {t(language, "addReceipt")}
            </button>
          )}
        </div>

        {/* Sticky formula preview + save */}
        <div className="stickyActionBar">
          <div className={preview.ok ? "formulaBox" : "formulaBox warning"}>
            <strong>{t(language, "formulaPreview")}</strong>
            <span>{preview.message}</span>
            {showFixSplitHint && <span className="formulaHint">{t(language, "fixSplit")}</span>}
          </div>

          {error && <div className="errorBox">{error}</div>}

          <div className="buttonRow">
            <button className="primaryButton" onClick={onSave} type="button" disabled={!canSave}>
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
                placeholder={t(language, "searchExpenses")}
                value={expenseSearch}
                onChange={(event) => setExpenseSearch(event.target.value)}
              />
            )}
            {[...groupExpensesByDate(
              trip.expenses.filter((expense) => {
                if (!expenseSearch.trim()) return true;
                const query = expenseSearch.toLowerCase();
                const payerNames = expense.payers.map((payer) => getMemberName(trip, payer.memberId).toLowerCase()).join(" ");
                return (
                  expense.title.toLowerCase().includes(query) ||
                  (expense.category ?? "").toLowerCase().includes(query) ||
                  payerNames.includes(query)
                );
              })
            ).entries()].map(([date, items]) => (
              <div key={date}>
                <div className="expenseDateGroup">{formatDateHeader(date)}</div>
                {items.map((expense) => {
                  const CatIcon = categoryIcon(expense.category ?? "");
                  return (
                    <div className="expenseItem" key={expense.id}>
                      <div className={`categoryIconCircle ${expense.category || "other"}`}>
                        <CatIcon size={18} />
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
                })}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
