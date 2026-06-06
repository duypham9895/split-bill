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
import { decodeTripFromShareParam, encodeTripToShareParam } from "./persistence/share-link";
import { loadTripStore, saveTripStore, type TripStore } from "./persistence/local-storage";
import { createSampleTrip } from "./app/sample-data";

import { cleanOptional } from "./domain/strings";
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
import { ShareView } from "./components/sharing/ShareView";
import { ShareLinkError } from "./components/sharing/ShareLinkError";

type Section = "members" | "expenses" | "balances" | "sharing";

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

function isShareViewMode(): boolean {
  return new URLSearchParams(window.location.search).get("view") === "share";
}

function loadTripFromShareUrl(): Trip | null {
  const payload = new URLSearchParams(window.location.search).get("trip");

  if (!payload) {
    return null;
  }

  try {
    return decodeTripFromShareParam(payload);
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

async function copyTextToClipboard(text: string) {
  // navigator.clipboard needs a secure context (https/localhost); fall back to
  // the legacy textarea trick for plain-http LAN testing on phones.
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) {
    throw new Error("Clipboard unavailable");
  }
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
  // Guest mode: a shared link with `view=share` opens the read-only friend view
  // instead of the full editor. Determined purely by the URL at page load, so the
  // branch is stable for the component's whole lifetime (hook order is preserved
  // because the early-return path runs no hooks on every render).
  if (isShareViewMode()) {
    const sharedTrip = loadTripFromShareUrl();
    if (sharedTrip) {
      return <ShareView trip={sharedTrip} />;
    }
    // A share link that can't be decoded (truncated by a messenger app, stale
    // version, corrupted paste) must not fall through to the editor — the
    // friend would land on the sample trip and think it's the real data.
    return <ShareLinkError />;
  }

  return <Editor />;
}

function Editor() {
  const [store, setStore] = useState<TripStore>(createInitialStore);
  const activeTrip = useMemo(
    () => store.trips.find((trip) => trip.id === store.activeTripId) ?? store.trips[0],
    [store],
  );
  const [section, setSection] = useState<Section>(() => {
    const store = createInitialStore();
    const trip = store.trips.find((t) => t.id === store.activeTripId);
    if (!trip || trip.members.filter((m) => m.active).length === 0) {
      return "members";
    }
    return "expenses";
  });
  const [settlementMode, setSettlementMode] = useState<SettlementMode>("simplified");
  const [memberForm, setMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [expenseDraft, setExpenseDraft] = useState(() => createExpenseDraft(activeTrip));
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<Trip | null>(null);
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

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

  function showToast(message: string, undo?: () => void) {
    setToast({ message, undo });
    setTimeout(() => setToast(null), 5000);
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

  function startFresh() {
    const newTrip = {
      id: crypto.randomUUID(),
      name: t(language, "newTripName"),
      currency: "VND" as const,
      language,
      members: [],
      expenses: [],
      transfers: [],
    };
    setStore((currentStore) => ({
      activeTripId: newTrip.id,
      trips: [...currentStore.trips, newTrip],
    }));
    setBannerDismissed(false);
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
      const nextExpense = buildExpenseFromDraft(expenseDraft, activeTrip, originalExpense, language);
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
      expenses: trip.expenses.filter((e) => e.id !== expenseId),
    }));
    if (editingExpenseId === expenseId) {
      cancelEditExpense();
    }
  }

  function markPaid(payment: SettlementPayment) {
    const transferId = `transfer-${Date.now()}`;
    updateActiveTrip((trip) => ({
      ...trip,
      transfers: [
        ...trip.transfers,
        {
          id: transferId,
          fromMemberId: payment.fromMemberId,
          toMemberId: payment.toMemberId,
          amountMinor: payment.amountMinor,
          date: today(),
          note: t(language, "markedPaidNote"),
          status: "paid",
        },
      ],
    }));
    // Recording a payment is easy to mis-tap; offer an immediate undo instead
    // of stranding a phantom transfer the user has no other way to remove.
    showToast(t(language, "markedPaidToast"), () => removeTransfer(transferId));
  }

  function removeTransfer(transferId: string) {
    updateActiveTrip((trip) => ({
      ...trip,
      transfers: trip.transfers.filter((transfer) => transfer.id !== transferId),
    }));
  }

  function deleteTransfer(transferId: string) {
    const removed = activeTrip.transfers.find((transfer) => transfer.id === transferId);
    removeTransfer(transferId);
    if (removed) {
      showToast(t(language, "transferDeleted"), () =>
        updateActiveTrip((trip) => ({ ...trip, transfers: [...trip.transfers, removed] })),
      );
    }
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

  function getShareUrl() {
    const payload = encodeTripToShareParam(activeTrip);
    return `${window.location.origin}${window.location.pathname}?trip=${payload}&view=share`;
  }

  async function copyShareLink() {
    const url = getShareUrl();
    if (url.length > 1800) {
      showToast(t(language, "shareLinkLarge"));
    }
    await copyTextToClipboard(url);
  }

  async function nativeShare() {
    const url = getShareUrl();
    const shareText = `${activeTrip.name} — ${t(language, "appName")}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: activeTrip.name, text: shareText, url });
      } catch {
        // User cancelled — ignore
      }
    } else {
      // No Web Share API (desktop browsers) — copy instead and say so, since
      // the button promised a share dialog.
      try {
        await copyShareLink();
        showToast(t(language, "linkCopied"));
      } catch {
        showToast(t(language, "linkCopyFailed"));
      }
    }
  }

  function shareToZalo() {
    const url = getShareUrl();
    const text = `${activeTrip.name} — ${t(language, "appName")}`;
    window.open(`https://zalo.me/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank", "width=600,height=400");
  }

  function shareToMessenger() {
    const url = getShareUrl();
    window.open(`https://www.facebook.com/dialog/share?display=popup&href=${encodeURIComponent(url)}`, "_blank", "width=600,height=400");
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
        setImportPreview(importedTrip);
      } catch (error) {
        setShareMessage(error instanceof Error ? error.message : t(language, "importFailed"));
      }
    };
    reader.readAsText(file);
  }

  function confirmImport() {
    if (!importPreview) return;
    setStore((currentStore) => ({
      activeTripId: importPreview.id,
      trips: [
        ...currentStore.trips.filter((trip) => trip.id !== importPreview.id),
        importPreview,
      ],
    }));
    setShareMessage(t(language, "tripImported"));
    setImportPreview(null);
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
                aria-current={section === item.id ? "page" : undefined}
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

        {activeTrip.isSample && !bannerDismissed && (
          <div className="sampleBanner">
            <span>{t(language, "sampleBanner")}</span>
            <div className="sampleBannerActions">
              <button className="primaryButton sampleBannerStart" onClick={startFresh} type="button">
                {t(language, "startFresh")}
              </button>
              <button className="iconButton sampleBannerDismiss" onClick={() => setBannerDismissed(true)} type="button" aria-label="Dismiss">
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="contentGrid">
          <section className="primaryPanel">
            {section === "members" && (
              <MembersSection
                balances={calculation.balances}
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
                onDeleteExpense={setDeleteConfirm}
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
                onDeleteTransfer={deleteTransfer}
              />
            )}
            {section === "sharing" && (
              <SharingSection
                importJson={importJson}
                language={language}
                message={shareMessage}
                onCopyShareLink={copyShareLink}
                onDownloadCsv={downloadCsv}
                onDownloadJson={downloadJson}
                onNativeShare={() => void nativeShare()}
                onShareToZalo={shareToZalo}
                onShareToMessenger={shareToMessenger}
                trip={activeTrip}
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
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => setSection(item.id)}
              type="button"
            >
              <Icon size={22} />
              <span>{t(language, item.shortKey)}</span>
            </button>
          );
        })}
      </nav>

      {deleteConfirm && (
        <div className="confirmOverlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirmDialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t(language, "deleteExpenseTitle")}</h3>
            <p>{t(language, "deleteExpenseConfirm")}</p>
            <div className="confirmActions">
              <button className="ghostButton" onClick={() => setDeleteConfirm(null)}>{t(language, "cancel")}</button>
              <button
                className="primaryButton"
                style={{ background: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                onClick={() => {
                  deleteExpense(deleteConfirm);
                  setDeleteConfirm(null);
                }}
              >
                {t(language, "deleteAction")}
              </button>
            </div>
          </div>
        </div>
      )}

      {importPreview && (
        <div className="confirmOverlay" onClick={() => setImportPreview(null)}>
          <div className="confirmDialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t(language, "importTripTitle")}</h3>
            <p>
              {t(language, "importTripConfirm", {
                name: importPreview.name,
                members: importPreview.members.length,
                expenses: importPreview.expenses.length,
              })}
            </p>
            <div className="confirmActions">
              <button className="ghostButton" onClick={() => setImportPreview(null)}>{t(language, "cancel")}</button>
              <button className="primaryButton" onClick={confirmImport}>{t(language, "importAction")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <span>{toast.message}</span>
          {toast.undo && (
            <button onClick={() => { toast.undo!(); setToast(null); }}>{t(language, "undo")}</button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
