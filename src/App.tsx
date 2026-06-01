import {
  Check,
  Languages,
  Pencil,
  Plus,
  ReceiptText,
  Scale,
  Send,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { calculateTrip } from "./domain/calculations";
import { calculateExpenseShares } from "./domain/split";
import type {
  Expense,
  Language,
  Member,
  SettlementPayment,
  Trip,
} from "./domain/types";
import { t } from "./i18n/translations";
import { exportCsvBundle, exportTripJson, importTripJson } from "./persistence/import-export";
import { loadTripStore, saveTripStore, type TripStore } from "./persistence/local-storage";
import { createSampleTrip } from "./app/sample-data";

import { SummaryRail } from "./components/layout/SummaryRail";
import { MembersSection, type MemberForm } from "./components/members/MembersSection";
import {
  ExpensesSection,
  createExpenseDraft,
  createExpenseDraftFromExpense,
  buildExpenseFromDraft,
} from "./components/expenses/ExpensesSection";
import { BalancesSection, type SettlementMode } from "./components/balances/BalancesSection";
import { SharingSection } from "./components/sharing/SharingSection";
import { QaSection } from "./components/sharing/QaSection";

type Section = "members" | "expenses" | "balances" | "sharing" | "qa";

const navSections: Array<{
  id: Section;
  icon: typeof Users;
  titleKey:
    | "tripsMembers"
    | "expensesSplits"
    | "balancesSettlement"
    | "sharingPayment";
  hintKey:
    | "tripsMembersHint"
    | "expensesSplitsHint"
    | "balancesSettlementHint"
    | "sharingPaymentHint";
  shortKey: "trip" | "expenses" | "settle" | "share";
}> = [
  { id: "members", icon: Users, titleKey: "tripsMembers", hintKey: "tripsMembersHint", shortKey: "trip" },
  { id: "expenses", icon: ReceiptText, titleKey: "expensesSplits", hintKey: "expensesSplitsHint", shortKey: "expenses" },
  { id: "balances", icon: Scale, titleKey: "balancesSettlement", hintKey: "balancesSettlementHint", shortKey: "settle" },
  { id: "sharing", icon: Send, titleKey: "sharingPayment", hintKey: "sharingPaymentHint", shortKey: "share" },
];

const emptyMemberForm: MemberForm = {
  name: "",
  bankName: "",
  bankCode: "",
  accountNumber: "",
  accountHolder: "",
  transferNoteTemplate: "",
  qrImageDataUrl: "",
};

function createInitialStore(): TripStore {
  const sharedTrip = loadTripFromShareUrl();
  const savedStore = loadTripStore();

  if (sharedTrip) {
    return {
      activeTripId: sharedTrip.id,
      trips: [
        ...(savedStore?.trips.filter((trip) => trip.id !== sharedTrip.id) ?? []),
        sharedTrip,
      ],
    };
  }

  if (savedStore && savedStore.trips.length > 0) {
    return savedStore;
  }

  const trip = createSampleTrip();
  return {
    activeTripId: trip.id,
    trips: [trip],
  };
}

function loadTripFromShareUrl(): Trip | null {
  const payload = new URLSearchParams(window.location.search).get("trip");

  if (!payload) {
    return null;
  }

  try {
    const bytes = Uint8Array.from(window.atob(payload), (character) => character.charCodeAt(0));
    return importTripJson(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function cleanPaymentInfo(form: MemberForm): Member["payment"] {
  const payment = {
    bankName: cleanOptional(form.bankName),
    bankCode: cleanOptional(form.bankCode),
    accountNumber: cleanOptional(form.accountNumber),
    accountHolder: cleanOptional(form.accountHolder),
    transferNoteTemplate: cleanOptional(form.transferNoteTemplate),
    qrImageDataUrl: cleanOptional(form.qrImageDataUrl),
  };

  return Object.values(payment).some(Boolean) ? payment : undefined;
}

function cleanOptional(value: string) {
  const cleaned = value.trim();
  return cleaned || undefined;
}

function slugId(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `member-${Date.now()}`
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [store, setStore] = useState<TripStore>(createInitialStore);
  const activeTrip = useMemo(
    () => store.trips.find((trip) => trip.id === store.activeTripId) ?? store.trips[0],
    [store],
  );
  const [section, setSection] = useState<Section>("expenses");
  const [settlementMode, setSettlementMode] = useState<SettlementMode>("simplified");
  const [memberForm, setMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [expenseDraft, setExpenseDraft] = useState(() => createExpenseDraft(activeTrip));
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [bugText, setBugText] = useState("");

  useEffect(() => {
    saveTripStore(store);
  }, [store]);

  useEffect(() => {
    setExpenseDraft(createExpenseDraft(activeTrip));
    setEditingExpenseId(null);
    setEditingMemberId(null);
    setMemberForm(emptyMemberForm);
    setFormError("");
  }, [activeTrip.id]);

  const calculation = useMemo(() => calculateTrip(activeTrip), [activeTrip]);
  const language = activeTrip.language;
  const settlement =
    settlementMode === "simplified"
      ? calculation.simplifiedSettlement
      : calculation.directPaybackSettlement;

  function updateActiveTrip(updater: (trip: Trip) => Trip) {
    setStore((currentStore) => ({
      ...currentStore,
      trips: currentStore.trips.map((trip) =>
        trip.id === currentStore.activeTripId ? updater(trip) : trip,
      ),
    }));
  }

  function setLanguage(languageValue: Language) {
    updateActiveTrip((trip) => ({ ...trip, language: languageValue }));
  }

  function addTrip() {
    const nextTrip = createSampleTrip();
    nextTrip.id = `trip-${Date.now()}`;
    nextTrip.name = `${t(language, "trip")} ${store.trips.length + 1}`;
    nextTrip.expenses = [];
    nextTrip.transfers = [];
    setStore((currentStore) => ({
      activeTripId: nextTrip.id,
      trips: [...currentStore.trips, nextTrip],
    }));
    setSection("members");
  }

  function addMember() {
    if (!memberForm.name.trim()) {
      setFormError(t(language, "memberNameRequired"));
      return;
    }

    const memberId = slugId(memberForm.name);
    if (activeTrip.members.some((existingMember) => existingMember.id === memberId)) {
      setFormError(t(language, "duplicateMemberName"));
      return;
    }

    const member: Member = {
      id: memberId,
      name: memberForm.name.trim(),
      active: true,
      payment: cleanPaymentInfo(memberForm),
    };

    updateActiveTrip((trip) => ({ ...trip, members: [...trip.members, member] }));
    setMemberForm(emptyMemberForm);
    setFormError("");
  }

  function startEditMember(member: Member) {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name,
      bankName: member.payment?.bankName ?? "",
      bankCode: member.payment?.bankCode ?? "",
      accountNumber: member.payment?.accountNumber ?? "",
      accountHolder: member.payment?.accountHolder ?? "",
      transferNoteTemplate: member.payment?.transferNoteTemplate ?? "",
      qrImageDataUrl: member.payment?.qrImageDataUrl ?? "",
    });
    setFormError("");
    setSection("members");
  }

  function cancelEditMember() {
    setEditingMemberId(null);
    setMemberForm(emptyMemberForm);
    setFormError("");
  }

  function saveMember() {
    if (!editingMemberId) {
      addMember();
      return;
    }

    if (!memberForm.name.trim()) {
      setFormError(t(language, "memberNameRequired"));
      return;
    }

    updateActiveTrip((trip) => ({
      ...trip,
      members: trip.members.map((member) =>
        member.id === editingMemberId
          ? {
              ...member,
              name: memberForm.name.trim(),
              payment: cleanPaymentInfo(memberForm),
            }
          : member,
      ),
    }));
    cancelEditMember();
  }

  function saveExpense() {
    try {
      const originalExpense = activeTrip.expenses.find((expense) => expense.id === editingExpenseId);
      const nextExpense = buildExpenseFromDraft(expenseDraft, activeTrip, originalExpense);
      calculateExpenseShares(nextExpense);
      calculateTrip({
        ...activeTrip,
        expenses: originalExpense
          ? activeTrip.expenses.map((expense) =>
              expense.id === originalExpense.id ? nextExpense : expense,
            )
          : [...activeTrip.expenses, nextExpense],
      });
      updateActiveTrip((trip) => ({
        ...trip,
        expenses: originalExpense
          ? trip.expenses.map((expense) => (expense.id === originalExpense.id ? nextExpense : expense))
          : [...trip.expenses, nextExpense],
      }));
      setExpenseDraft(createExpenseDraft(activeTrip));
      setEditingExpenseId(null);
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t(language, "cannotSaveExpense"));
    }
  }

  function startEditExpense(expense: Expense) {
    setExpenseDraft(createExpenseDraftFromExpense(expense, activeTrip));
    setEditingExpenseId(expense.id);
    setFormError("");
    setSection("expenses");
  }

  function cancelEditExpense() {
    setExpenseDraft(createExpenseDraft(activeTrip));
    setEditingExpenseId(null);
    setFormError("");
  }

  function deleteExpense(expenseId: string) {
    updateActiveTrip((trip) => ({
      ...trip,
      expenses: trip.expenses.filter((expense) => expense.id !== expenseId),
    }));

    if (editingExpenseId === expenseId) {
      cancelEditExpense();
    }
  }

  function markPaid(payment: SettlementPayment) {
    updateActiveTrip((trip) => ({
      ...trip,
      transfers: [
        ...trip.transfers,
        {
          id: `transfer-${Date.now()}`,
          fromMemberId: payment.fromMemberId,
          toMemberId: payment.toMemberId,
          amountMinor: payment.amountMinor,
          date: today(),
          note: t(language, "markedPaidNote"),
          status: "paid",
        },
      ],
    }));
  }

  function downloadJson() {
    downloadText(`${activeTrip.name}.trip.json`, exportTripJson(activeTrip), "application/json");
  }

  function downloadCsv() {
    const bundle = exportCsvBundle(activeTrip);
    downloadText(`${activeTrip.name}-expenses.csv`, bundle.expensesCsv, "text/csv");
    downloadText(`${activeTrip.name}-balances.csv`, bundle.balancesCsv, "text/csv");
    downloadText(`${activeTrip.name}-settlement.csv`, bundle.settlementCsv, "text/csv");
  }

  async function copyShareLink() {
    const payload = encodeURIComponent(btoa(unescape(encodeURIComponent(exportTripJson(activeTrip)))));
    const url = `${window.location.origin}${window.location.pathname}?trip=${payload}`;
    await navigator.clipboard.writeText(url);
    setShareMessage(t(language, "shareCopied"));
  }

  function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const importedTrip = importTripJson(String(reader.result));
        setStore((currentStore) => ({
          activeTripId: importedTrip.id,
          trips: [
            ...currentStore.trips.filter((trip) => trip.id !== importedTrip.id),
            importedTrip,
          ],
        }));
        setShareMessage(t(language, "tripImported"));
      } catch (error) {
        setShareMessage(error instanceof Error ? error.message : t(language, "importFailed"));
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">
            <ReceiptText size={22} />
          </div>
          <div>
            <strong>{t(language, "appName")}</strong>
            <span>{t(language, "fullLocalApp")}</span>
          </div>
        </div>

        <nav className="sideNav" aria-label="Primary">
          {navSections.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={section === item.id ? "navItem active" : "navItem"}
                key={item.id}
                onClick={() => setSection(item.id)}
                type="button"
              >
                <Icon size={22} />
                <span>
                  <strong>{t(language, item.titleKey)}</strong>
                  <small>{t(language, item.hintKey)}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="localBox">
          <Check size={18} />
          <span>
            <strong>{t(language, "localFirst")}</strong>
            <small>{t(language, "localFirstHint")}</small>
          </span>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="tripPicker">
            <select
              aria-label="Active trip"
              value={activeTrip.id}
              onChange={(event) =>
                setStore((currentStore) => ({
                  ...currentStore,
                  activeTripId: event.target.value,
                }))
              }
            >
              {store.trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </select>
            <button className="iconButton" onClick={addTrip} title={t(language, "createTrip")} type="button">
              <Plus size={18} />
            </button>
            <button
              className="iconButton"
              onClick={() => setSection("members")}
              title={t(language, "editTripName")}
              type="button"
            >
              <Pencil size={16} />
            </button>
          </div>
          <div className="topActions">
            <button
              className={language === "en" ? "lang active" : "lang"}
              onClick={() => setLanguage("en")}
              type="button"
            >
              EN
            </button>
            <button
              className={language === "vi" ? "lang active" : "lang"}
              onClick={() => setLanguage("vi")}
              type="button"
            >
              VN
            </button>
            <Languages size={20} />
          </div>
        </header>

        <div className="contentGrid">
          <section className="primaryPanel">
            {section === "members" && (
              <MembersSection
                editingMemberId={editingMemberId}
                error={formError}
                form={memberForm}
                language={language}
                onCancelEdit={cancelEditMember}
                onEditMember={startEditMember}
                onSaveMember={saveMember}
                setForm={setMemberForm}
                trip={activeTrip}
                updateTrip={updateActiveTrip}
              />
            )}
            {section === "expenses" && (
              <ExpensesSection
                draft={expenseDraft}
                editingExpenseId={editingExpenseId}
                error={formError}
                language={language}
                onCancelEdit={cancelEditExpense}
                onDeleteExpense={deleteExpense}
                onEditExpense={startEditExpense}
                setDraft={setExpenseDraft}
                trip={activeTrip}
                onSave={saveExpense}
              />
            )}
            {section === "balances" && (
              <BalancesSection
                balances={calculation.balances}
                language={language}
                mode={settlementMode}
                settlement={settlement}
                setMode={setSettlementMode}
                trip={activeTrip}
                onMarkPaid={markPaid}
              />
            )}
            {section === "sharing" && (
              <SharingSection
                importJson={importJson}
                language={language}
                message={shareMessage}
                onCopyShareLink={() => void copyShareLink()}
                onDownloadCsv={downloadCsv}
                onDownloadJson={downloadJson}
                trip={activeTrip}
              />
            )}
            {section === "qa" && (
              <QaSection
                bugText={bugText}
                language={language}
                setBugText={setBugText}
              />
            )}
          </section>

          <aside className="summaryRail">
            <SummaryRail
              balances={calculation.balances}
              language={language}
              settlement={settlement}
              trip={activeTrip}
              onMarkPaid={markPaid}
            />
          </aside>
        </div>
      </main>

      <nav className="bottomNav" aria-label="Mobile navigation">
        {navSections.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={section === item.id ? "active" : ""}
              key={item.id}
              onClick={() => setSection(item.id)}
              type="button"
            >
              <Icon size={22} />
              <span>{t(language, item.shortKey)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
