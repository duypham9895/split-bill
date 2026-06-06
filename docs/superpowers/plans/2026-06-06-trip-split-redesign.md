# Trip Split Bill Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Trip Split Bill app correct, beautiful, and simple — a delightful personal tool for splitting trip expenses with friends, fully offline, bilingual EN/VN.

**Architecture:** Client-only React 19 + Vite + TypeScript SPA, localStorage persistence, base64 share-URLs. No backend. Pure domain layer (`src/domain/`) stays framework-free and fully tested. Changes proceed in 4 themed phases (Trust → Beauty → Simplicity → Delight); refactor only files we already touch.

**Tech Stack:** React 19, Vite 7, TypeScript 5.9 (strict), single global `styles.css`, lucide-react, `qrcode`, Vitest 4 + Testing Library, Playwright 1.57, pnpm.

**Design system (locked — "Ink & Amber Receipt"):**
| Token | Value | Use |
|---|---|---|
| `--ink` | `#1c1a16` | Primary text & buttons |
| `--paper` | `#fbf8f1` | App background |
| `--card` | `#fffdf8` | Surfaces |
| `--amber` | `#b06a1e` | Single accent — totals, links, active |
| `--amber-deep` | `#8f5314` | Accent text on light |
| `--amber-bg` | `#fbf0dd` | Accent fill |
| `--faint` | `#a59a82` | Metadata/labels |
| `--line` | `#e7ddc9` | Hairlines/dashed rules |
| `--good` | `#3f6b3a` | Paid/valid |
| `--bad` | `#b3401f` | Error/invalid |

Monospace for all money & metadata; system sans for UI; dashed hairlines; crisp radii (3–10px); one accent used sparingly; icon-only nav; 4px grid; no dark mode.

**Commands:** `pnpm test` (vitest run), `pnpm test:watch`, `pnpm test:e2e` (playwright), `pnpm build` (tsc -b && vite build), `pnpm dev`.

**Run after every code change:** `pnpm test` must stay green. Commit after each task.

---

## File Structure (decomposition map)

**Phase 1 — Trust** (correctness & honesty)
- Modify `src/domain/calculations.ts` — fix rounding in `createDirectPaybackSettlement`
- Modify `src/domain/calculations.test.ts` — add settle-to-zero tests
- Create `src/payment/bank-bins.ts` — map member `bankCode` → 6-digit NAPAS BIN
- Modify `src/payment/qr.ts` — rewire `generatePaymentQr` to local `vietqr.ts` (no network)
- Create `src/payment/qr.test.ts` — assert offline QR is valid EMVCo
- Modify `src/i18n/translations.ts` — add missing keys (en + vi)
- Modify `src/App.tsx` — remove dark mode, remove QA, use new i18n keys, dedupe `cleanOptional`
- Modify `src/components/expenses/ExpensesSection.tsx` — i18n errors, remove `parseAmountInput`
- Modify `src/components/sharing/SharingSection.tsx` — i18n labels
- Modify `src/components/layout/SummaryRail.tsx` — i18n + remove unused `loading`
- Modify `src/components/balances/PaymentCard.tsx` — drop dead `loading` prop usage
- Delete `src/components/sharing/QaSection.tsx`
- Modify `src/styles.css` — remove dark-mode blocks

**Phase 2 — Beauty** (design system)
- Modify `src/styles.css` — replace `:root` tokens, button system, category colors, typography, nav
- Modify `src/components/layout/SummaryRail.tsx`, `src/components/balances/BalancesSection.tsx`, `src/components/balances/PaymentCard.tsx` — replace inline magic-number styles with classes

**Phase 3 — Simplicity** (UX)
- Create `src/components/expenses/PayerInputs.tsx`
- Create `src/components/expenses/ParticipantSelector.tsx`
- Create `src/components/expenses/SplitMethodPicker.tsx`
- Modify `src/components/expenses/ExpensesSection.tsx` — rebuild form using extracted parts + live validation
- Modify `src/i18n/translations.ts` — split-method summaries/formulas, "All", "Start fresh"
- Modify `src/components/members/MembersSection.tsx` — progressive disclosure of payment fields
- Modify `src/components/balances/BalancesSection.tsx` — settled members recede
- Modify `src/app/sample-data.ts` + `src/App.tsx` — mark sample + "Start fresh"

**Phase 4 — Delight** (features)
- Create `src/media/resize-image.ts` — downscale photos before storing
- Modify `src/components/expenses/ExpensesSection.tsx` + `src/domain/types.ts` usage — receipt photo UI
- Create `src/components/sharing/ShareView.tsx` — friend-facing read-only view + "Who are you?"
- Modify `src/App.tsx` — route `?trip=...` into ShareView when opened as a guest
- Create `src/components/expenses/QuickAdd.tsx` — recent-expense templates
- Add PWA: `pnpm add -D vite-plugin-pwa`, modify `vite.config.ts`, `index.html`, create `public/` icons

---

# PHASE 1 — TRUST

## Task 1: Fix direct-settlement rounding bug

**Files:**
- Modify: `src/domain/calculations.ts:124-159` (`createDirectPaybackSettlement`)
- Test: `src/domain/calculations.test.ts`

**Problem:** Line 135 `Math.floor((shareAmount * payer.amountMinor) / expense.amountMinor)` drops fractional đồng per (participant, payer) pair, so multi-payer settlements don't sum to zero.

- [ ] **Step 1: Write the failing test**

Add to `src/domain/calculations.test.ts` (uses existing `expense()`/`trip()` helpers and `members` at top of file). **Verified API:** `calculateTrip(trip)` takes no mode arg and returns `{ balances, simplifiedSettlement, directPaybackSettlement }`.

```typescript
describe("direct settlement conserves money", () => {
  test("a non-payer's outgoing equals their full share (no lost đồng)", () => {
    // 200,000 split equally among Alvin, Duy, HA → 66,667 / 66,667 / 66,666
    // (remainder to first members by index). Alvin & Duy are the two payers.
    // HA pays no one directly today, so HA owes their full 66,666 share,
    // distributed across the two payers by payer weight — must total 66,666 exactly.
    const e = expense({
      amountMinor: 200_000,
      payers: [
        { memberId: "alvin", amountMinor: 120_000 },
        { memberId: "duy", amountMinor: 80_000 },
      ],
      participants: [
        { memberId: "alvin" },
        { memberId: "duy" },
        { memberId: "ha" },
      ],
      splitMethod: "equal",
    });
    const { directPaybackSettlement } = calculateTrip(trip([e]));
    const haOutgoing = directPaybackSettlement
      .filter((p) => p.fromMemberId === "ha")
      .reduce((sum, p) => sum + p.amountMinor, 0);
    // With the old Math.floor bug this is 66,665 (one đồng lost). Must be 66,666.
    expect(haOutgoing).toBe(66_666);
  });
});
```

> Verified by reading `src/domain/calculations.ts:4-81`: `calculateTrip` returns both settlements; there is no mode parameter and no `result.settlement` field.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- calculations`
Expected: FAIL — HA's outgoing total is short by 1 đồng (the floor bug).

- [ ] **Step 3: Implement largest-remainder allocation per participant**

Replace the inner payer loop in `createDirectPaybackSettlement` (lines 130-147) so each participant's share is split across payers **proportionally with remainder distribution**, conserving every đồng:

```typescript
    for (const [participantId, shareAmount] of shares) {
      const otherPayers = expense.payers.filter((p) => p.memberId !== participantId);
      const payerWeight = otherPayers.reduce((sum, p) => sum + p.amountMinor, 0);
      if (payerWeight <= 0) {
        continue;
      }
      // Allocate this participant's shareAmount across payers by payer weight,
      // distributing the rounding remainder by largest fractional part.
      const raw = otherPayers.map((payer, index) => {
        const exact = (shareAmount * payer.amountMinor) / payerWeight;
        const floor = Math.floor(exact);
        return { payer, amount: floor, fraction: exact - floor, index };
      });
      let remaining = shareAmount - raw.reduce((sum, r) => sum + r.amount, 0);
      for (const r of [...raw].sort((a, b) =>
        b.fraction !== a.fraction ? b.fraction - a.fraction : a.index - b.index,
      )) {
        if (remaining <= 0) break;
        r.amount += 1;
        remaining -= 1;
      }
      for (const r of raw) {
        if (r.amount === 0) continue;
        addNetPayment(netPayments, {
          fromMemberId: participantId,
          toMemberId: r.payer.memberId,
          amountMinor: r.amount,
          expenseId: expense.id,
        });
      }
    }
```

> Note: the denominator changes from `expense.amountMinor` to `payerWeight` (sum of *other* payers' contributions), because a participant only owes the payers who aren't themselves. This is what conserves the full share.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- calculations`
Expected: PASS. Also run full suite `pnpm test` — all green.

- [ ] **Step 5: Commit**

```bash
git add src/domain/calculations.ts src/domain/calculations.test.ts
git commit -m "fix: conserve every đồng in direct settlement (largest-remainder)"
```

---

## Task 2: Map bank codes to NAPAS BINs

**Files:**
- Create: `src/payment/bank-bins.ts`
- Test: `src/payment/bank-bins.test.ts`

**Why:** `vietqr.ts` needs a 6-digit `bankBin` (e.g. `970436`), but members store `bankCode`. We need a lookup, with a passthrough if the code already looks like a BIN.

- [ ] **Step 1: Write the failing test**

Create `src/payment/bank-bins.test.ts`:

```typescript
import { describe, expect, test } from "vitest";
import { resolveBankBin } from "./bank-bins";

describe("resolveBankBin", () => {
  test("maps common short codes to 6-digit BIN", () => {
    expect(resolveBankBin("VCB")).toBe("970436");
    expect(resolveBankBin("TCB")).toBe("970407");
    expect(resolveBankBin("vcb")).toBe("970436"); // case-insensitive
  });
  test("passes through an existing 6-digit BIN", () => {
    expect(resolveBankBin("970415")).toBe("970415");
  });
  test("returns null for unknown code", () => {
    expect(resolveBankBin("NOTABANK")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- bank-bins`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the lookup**

Create `src/payment/bank-bins.ts`:

```typescript
/**
 * Maps Vietnamese bank short codes to their 6-digit NAPAS BIN,
 * used to build VietQR EMVCo payloads. Extend as needed.
 */
const BANK_BINS: Record<string, string> = {
  VCB: "970436", // Vietcombank
  TCB: "970407", // Techcombank
  BIDV: "970418",
  VTB: "970415", // VietinBank
  ACB: "970416",
  MB: "970422", // MBBank
  VPB: "970432", // VPBank
  TPB: "970423", // TPBank
  STB: "970403", // Sacombank
  VIB: "970441",
  SHB: "970443",
  AGRIBANK: "970405",
  HDB: "970437", // HDBank
  OCB: "970448",
  MSB: "970426",
  SCB: "970429",
};

/** Resolve a user-entered bank code to a 6-digit NAPAS BIN, or null if unknown. */
export function resolveBankBin(code: string | undefined): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  if (/^\d{6}$/.test(trimmed)) return trimmed; // already a BIN
  return BANK_BINS[trimmed.toUpperCase()] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- bank-bins`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/payment/bank-bins.ts src/payment/bank-bins.test.ts
git commit -m "feat: add bank code to NAPAS BIN resolver"
```

---

## Task 3: Rewire QR generation to work fully offline

**Files:**
- Modify: `src/payment/qr.ts:69-109` (`generatePaymentQr`)
- Test: `src/payment/qr.test.ts` (create)

**Problem:** `generatePaymentQr` fetches `img.vietqr.io` (line 88) — fails offline, falls back to an unscannable string. We have a working local builder in `src/payment/vietqr.ts` (`buildVietQrPayload`, `generateVietQrDataUrl`). Rewire to use it.

- [ ] **Step 1: Write the failing test**

Create `src/payment/qr.test.ts`:

```typescript
import { describe, expect, test, vi } from "vitest";
import { generatePaymentQr } from "./qr";
import { buildVietQrPayload } from "./vietqr";
import type { Member, SettlementPayment } from "../domain/types";

const receiver: Member = {
  id: "alvin",
  name: "Alvin",
  active: true,
  payment: {
    bankName: "Techcombank",
    bankCode: "TCB",
    accountNumber: "19036666",
    accountHolder: "ALVIN",
  },
};
const payment: SettlementPayment = {
  fromMemberId: "duy",
  toMemberId: "alvin",
  amountMinor: 820_000,
};

describe("generatePaymentQr offline", () => {
  test("never calls the network", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await generatePaymentQr(receiver, payment);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
  test("produces a scannable VietQR data URL", async () => {
    const url = await generatePaymentQr(receiver, payment);
    expect(url.startsWith("data:image/")).toBe(true);
  });
  test("payload encodes the amount and BIN", () => {
    const payload = buildVietQrPayload({
      bankBin: "970407",
      accountNumber: "19036666",
      amount: 820_000,
    });
    expect(payload).toContain("970407");
    expect(payload).toContain("820000");
    expect(payload.endsWith(payload.slice(-8))).toBe(true); // ends with CRC
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- qr`
Expected: FAIL — `fetch` is still called (current impl hits vietqr.io).

- [ ] **Step 3: Rewire `generatePaymentQr`**

Replace the body of `generatePaymentQr` in `src/payment/qr.ts` (lines 69-109) with:

```typescript
export async function generatePaymentQr(receiver: Member, payment: SettlementPayment): Promise<string> {
  const paymentInfo = receiver.payment;
  const bankBin = resolveBankBin(paymentInfo?.bankCode);

  // Preferred: build a real, scannable VietQR EMVCo payload entirely offline.
  if (bankBin && paymentInfo?.accountNumber) {
    const note =
      paymentInfo.transferNoteTemplate?.trim() ||
      `${payment.fromMemberId}-${payment.toMemberId}`;
    return generateVietQrDataUrl({
      bankBin,
      accountNumber: paymentInfo.accountNumber,
      amount: payment.amountMinor,
      description: note,
    });
  }

  // Fallback: encode human-readable transfer details (when bank is unknown).
  return QRCode.toDataURL(buildTransferContent(receiver, payment), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
  });
}
```

Update imports at the top of `src/payment/qr.ts`:

```typescript
import QRCode from "qrcode";
import type { Member, SettlementPayment } from "../domain/types";
import { generateVietQrDataUrl } from "./vietqr";
import { resolveBankBin } from "./bank-bins";
```

Delete the now-unused `buildVietQrUrl` function (lines 14-36) and its doc comment — it's the network path we're removing. (Verify no other file imports it: `grep -rn buildVietQrUrl src` should return only `qr.ts`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- qr`
Expected: PASS. Then `pnpm test` (full) — green. Then `pnpm build` to confirm no unused-import TS errors (strict mode).

- [ ] **Step 5: Commit**

```bash
git add src/payment/qr.ts src/payment/qr.test.ts
git commit -m "fix: generate VietQR offline, remove network dependency"
```

---

## Task 4: Add missing i18n keys

**Files:**
- Modify: `src/i18n/translations.ts` (add keys to both `en` ~lines 3-157 and `vi` ~159-313)

- [ ] **Step 1: Add keys to both dictionaries**

Add these keys to the `en` object and matching VN to `vi` (keep alphabetic-ish grouping with neighbors). Confirm exact existing keys first; only add ones missing:

```typescript
// en
deleteExpenseTitle: "Delete expense",
deleteExpenseConfirm: "Are you sure? This can't be undone.",
deleteAction: "Delete",
importTripTitle: "Import trip",
importTripConfirm: "This will replace your current trip. Continue?",
importAction: "Import",
cancel: "Cancel",
selectCategory: "Select category…",
shareLink: "Share link",
exportData: "Export data",
importData: "Import data",
viewAllTransfers: "View all {count} transfers",
```

```typescript
// vi
deleteExpenseTitle: "Xóa khoản chi",
deleteExpenseConfirm: "Bạn chắc chứ? Không thể hoàn tác.",
deleteAction: "Xóa",
importTripTitle: "Nhập chuyến đi",
importTripConfirm: "Thao tác này sẽ thay thế chuyến đi hiện tại. Tiếp tục?",
importAction: "Nhập",
cancel: "Hủy",
selectCategory: "Chọn danh mục…",
shareLink: "Chia sẻ liên kết",
exportData: "Xuất dữ liệu",
importData: "Nhập dữ liệu",
viewAllTransfers: "Xem tất cả {count} chuyển khoản",
```

> If `cancel` already exists, do not duplicate it (TypeScript object literal will error on duplicate keys). Reuse the existing one.

- [ ] **Step 2: Add a `{count}` interpolation helper if not present**

Check `t()` in `translations.ts:336-338`. If it has no interpolation, extend it (keep backward compatible):

```typescript
export function t(language: Language, key: TranslationKey, vars?: Record<string, string | number>) {
  let text: string = dictionaries[language][key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: PASS (no missing-key type errors; `TranslationKey = keyof typeof en` now includes new keys, and `vi` must have them all or TS errors).

- [ ] **Step 4: Commit**

```bash
git add src/i18n/translations.ts
git commit -m "feat: add i18n keys for dialogs, labels, transfers count"
```

---

## Task 5: Replace hardcoded strings with i18n calls

**Files:**
- Modify: `src/App.tsx:660-689` (dialogs), `:551-558` (theme title — removed in Task 7 anyway)
- Modify: `src/components/expenses/ExpensesSection.tsx:119-127` (errors), `:312` (category)
- Modify: `src/components/sharing/SharingSection.tsx:53,68,101,121`
- Modify: `src/components/layout/SummaryRail.tsx:72`

- [ ] **Step 1: Replace dialog strings in App.tsx**

In the delete/import dialog JSX (lines 660-689), replace literals with `t(language, "...")`: `Delete Expense` → `t(language,"deleteExpenseTitle")`, the confirm text → `deleteExpenseConfirm`, `Cancel` → `cancel`, `Delete` → `deleteAction`, `Import Trip` → `importTripTitle`, import confirm → `importTripConfirm`, `Import` → `importAction`.

- [ ] **Step 2: Replace expense form errors**

In `ExpensesSection.tsx`, the three `throw new Error("...")` at lines 119/123/127 should throw the existing translation keys. Change to throw `t(language, "expenseTitleRequired")`, `t(language, "expenseAmountRequired")`, `t(language, "payerTotalMismatch")` (these keys already exist per research). Ensure `language` is in scope in `buildExpenseFromDraft` — if not, pass it in as a param and update the call site. Replace `Select category...` at line 312 with `t(language, "selectCategory")`.

- [ ] **Step 3: Replace SharingSection + SummaryRail strings**

In `SharingSection.tsx`, replace the inline `language === "vi" ? ... : ...` ternaries at 53/68/101/121 with `t(language, "shareLink")`, etc. In `SummaryRail.tsx:72`, replace the ternary with `t(language, "viewAllTransfers", { count: settlement.length })`.

- [ ] **Step 4: Verify — manual VN pass + build**

Run: `pnpm build` then `pnpm dev`, switch language to VN, open delete dialog, import dialog, expense form errors, sharing tab — confirm zero English.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/expenses/ExpensesSection.tsx src/components/sharing/SharingSection.tsx src/components/layout/SummaryRail.tsx
git commit -m "i18n: replace hardcoded strings with translation keys"
```

---

## Task 6: Remove the QA section

**Files:**
- Delete: `src/components/sharing/QaSection.tsx`
- Modify: `src/App.tsx:38` (import), `:40` (Section type), `:618-624` (render block), `:176` (bugText state)
- Modify: `src/i18n/translations.ts` (remove qa* keys from en + vi)

- [ ] **Step 1: Remove usage in App.tsx**

Delete the `QaSection` import (line 38), remove `"qa"` from the `Section` type (line 40), delete the `bugText`/`setBugText` state (line 176), delete the `{section === "qa" && (...)}` render block (lines 618-624).

- [ ] **Step 2: Delete the component and its keys**

```bash
git rm src/components/sharing/QaSection.tsx
```

Remove the `qa*` keys from both `en` and `vi` in `translations.ts` (qaReleaseSubtitle, qaRule, qaBugReportDraft, qaBugPlaceholder, and any `qaRelease`/`qaReleaseHint` nav keys).

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: PASS (no dangling references). If TS complains about a removed key still used somewhere, grep `grep -rn "qa" src` and clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove out-of-scope QA section"
```

---

## Task 7: Remove dark mode

**Files:**
- Modify: `src/App.tsx:177-189` (theme state/effect), `:551-558` (toggle button), `:4` (Moon/Sun imports)
- Modify: `src/styles.css` (remove `[data-theme="dark"]` block ~1778-1816, `@media (prefers-color-scheme: dark)` ~1819-1856, dark category overrides ~1859-1864)

- [ ] **Step 1: Remove theme code from App.tsx**

Delete the `theme` useState (177-181), the `useEffect` setting `data-theme` (186-189), the toggle `<button>` (551-558), and `Moon`/`Sun` from the lucide-react import on line 4 (keep other icons).

- [ ] **Step 2: Remove dark CSS**

In `styles.css`, delete the three dark-mode blocks (the `[data-theme="dark"] { ... }` overrides, the `@media (prefers-color-scheme: dark) { ... }` block, and the `[data-theme="dark"] .categoryIconCircle.*` overrides).

- [ ] **Step 3: Verify**

Run: `pnpm build && pnpm dev` — app renders in light mode, no theme toggle, no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/styles.css
git commit -m "chore: remove non-functional dark mode"
```

---

## Task 8: Delete dead code

**Files:**
- Modify: `src/components/expenses/ExpensesSection.tsx:239-242` (remove unused `parseAmountInput`)
- Modify: `src/components/layout/SummaryRail.tsx` (remove `loading` prop + skeleton lines 25-46)
- Modify: `src/App.tsx:126-129` & `src/components/expenses/ExpensesSection.tsx:205-208` (consolidate `cleanOptional`)

- [ ] **Step 1: Remove `parseAmountInput`**

Delete the unused `parseAmountInput` function (ExpensesSection.tsx:239-242). Confirm zero callers: `grep -n parseAmountInput src/components/expenses/ExpensesSection.tsx`.

- [ ] **Step 2: Remove unused `loading` from SummaryRail**

In `SummaryRail.tsx`, remove the `loading?: boolean` prop and the `if (loading) { ...skeleton... }` block (lines 25-46) — it's never passed (App.tsx call site omits it). Leave `PaymentCard`'s own internal `loading` state untouched (it's real).

- [ ] **Step 3: Consolidate `cleanOptional`**

Create `src/domain/strings.ts`:

```typescript
/** Trim a string; return undefined when empty, for optional fields. */
export function cleanOptional(value: string): string | undefined {
  const cleaned = value.trim();
  return cleaned || undefined;
}
```

Replace the two local definitions (App.tsx:126-129, ExpensesSection.tsx:205-208) with `import { cleanOptional } from "../../domain/strings";` (adjust relative path per file).

- [ ] **Step 4: Verify**

Run: `pnpm build && pnpm test` — green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove dead code, consolidate cleanOptional util"
```

**Phase 1 verification:** `pnpm test` green (incl. new settlement + qr + bank-bins tests), `pnpm test:e2e` green, `pnpm build` clean, manual VN pass shows zero English, no dark mode / QA in UI, settlement QR scans offline (DevTools → Network → Offline, generate a settlement, scan with a banking app or decode the payload).

---

# PHASE 2 — BEAUTY

## Task 9: Replace design tokens with Ink & Amber system

**Files:**
- Modify: `src/styles.css:4-91` (`:root` block)

- [ ] **Step 1: Rewrite the `:root` token block**

Replace the color tokens in `:root` (keep spacing/radius/shadow structure, retune values). Map old→new so existing class rules keep working without renaming every usage:

```css
:root {
  /* Brand — Ink & Amber Receipt */
  --color-primary: #b06a1e;          /* amber accent (was teal) */
  --color-primary-hover: #8f5314;
  --color-primary-light: #fbf0dd;
  --color-primary-bg: #f5e8d4;
  --color-action: #1c1a16;           /* ink — primary buttons (was blue) */
  --color-action-hover: #000000;
  --color-action-light: #f4ecdd;
  --color-danger: #b3401f;
  --color-danger-light: #f6e6df;
  --color-danger-border: #e6c2ب4;
  --color-danger-text: #b3401f;
  --color-success: #3f6b3a;
  --color-success-light: #eef3ec;
  --color-success-border: #c4d6bf;
  --color-success-text: #2f5a2c;
  --color-warning: #b06a1e;
  --color-warning-light: #fbf0dd;
  --color-warning-border: #e3c99a;

  --color-bg: #fbf8f1;               /* paper */
  --color-surface: #fffdf8;          /* card */
  --color-border: #e7ddc9;
  --color-border-light: #f0e9da;
  --color-border-input: #ddd2bb;
  --color-text: #1c1a16;
  --color-text-secondary: #2a2620;
  --color-text-muted: #8a7f68;
  --color-text-label: #6b6450;
  --color-table-header-bg: #f6f1e7;
  --color-segment-bg: #f4ecdd;

  /* mono for money & metadata */
  --font-mono: "SF Mono", ui-monospace, Menlo, monospace;
}
```

> Fix the typo if copy-paste introduces any non-ASCII (e.g. `#e6c2b4`). Verify the file has no stray characters: `pnpm build` will not catch CSS, so eyeball the diff.

- [ ] **Step 2: Verify visually**

Run: `pnpm dev` — whole app shifts to paper/ink/amber. Check every section (Trip, Expenses, Settle, Share). No teal/blue should remain from tokens.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "feat: Ink & Amber design tokens"
```

---

## Task 10: Apply receipt styling — money mono, dashed rules, nav

**Files:**
- Modify: `src/styles.css` (typography, nav, cards, category colors)

- [ ] **Step 1: Make money & metadata monospace**

Add a utility and apply to amount classes. In `styles.css`, add `font-family: var(--font-mono); font-variant-numeric: tabular-nums;` to `.amountInput`, `.expenseItemAmount`, `.balanceCardAmount`, `.statCardValue`, settlement amounts, and totals. Add `.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }` for ad-hoc use.

- [ ] **Step 2: Convert category colors to a tokenized, warm set**

Replace the hardcoded category hex (lines ~1446-1452) with muted, paper-friendly tones:

```css
.categoryIconCircle.food { background: #f6e6df; color: #b3401f; }
.categoryIconCircle.transport { background: #e7eef0; color: #3a5560; }
.categoryIconCircle.hotel { background: #efe7d6; color: #8f5314; }
.categoryIconCircle.activity { background: #e8efe6; color: #3f6b3a; }
.categoryIconCircle.shopping { background: #f1e7ed; color: #8a3a63; }
.categoryIconCircle.drinks { background: #f3ead3; color: #9a6b1e; }
.categoryIconCircle.other { background: var(--color-segment-bg); color: var(--color-text-muted); }
```

- [ ] **Step 3: Fix nav typography and make it icon-forward**

Replace the hardcoded `font-size: 11px` in `.bottomNav button` with `font-size: var(--text-xs)`. In the sidebar `.navItem.active`, the existing `box-shadow: inset 3px 0 0 var(--color-primary)` now reads as an amber edge bar (good). Confirm the `clamp()` for `--text-xs` (line 52) isn't shrinking nav hints below ~12px; widen its floor if needed: `--text-xs: clamp(0.75rem, 1.2vw, 0.8125rem);`.

- [ ] **Step 4: Add dashed receipt rules to expense/settlement lists**

Add `border-bottom: 1px dashed var(--color-border);` to `.expenseItem` and settlement rows; use a heavier dashed rule (`border-top: 1.5px dashed var(--color-border)`) above any total.

- [ ] **Step 5: Verify visually + commit**

Run: `pnpm dev` — money is mono, lists have receipt rules, category chips are warm, nav text legible on mobile.

```bash
git add src/styles.css
git commit -m "feat: receipt styling — mono money, dashed rules, warm categories"
```

---

## Task 11: Remove inline magic-number styles

**Files:**
- Modify: `src/components/layout/SummaryRail.tsx` (lines with `style={{ height: 60 }}`, `style={{ fontSize..., marginTop... }}`)
- Modify: `src/components/balances/PaymentCard.tsx:60` (`style={{ width: 72, height: 72 }}`)
- Modify: `src/components/balances/BalancesSection.tsx:51,57` (`style={{ color: ... }}`)
- Modify: `src/styles.css` (add the classes)

- [ ] **Step 1: Add classes to styles.css**

```css
.skeletonBox { height: 60px; border-radius: var(--radius-md); }
.qrThumb { width: 72px; height: 72px; }
.statValue--danger { color: var(--color-danger); }
.statValue--success { color: var(--color-success); }
```

- [ ] **Step 2: Replace inline styles**

In `SummaryRail.tsx` the remaining skeletons (if any survived Task 8) → `className="skeleton skeletonBox"`. In `PaymentCard.tsx:60` → `className="skeleton qrThumb"`. In `BalancesSection.tsx:51,57` → add `statValue--danger`/`statValue--success` classes instead of inline `style={{color}}`.

- [ ] **Step 3: Verify + commit**

Run: `pnpm build` — no TS errors. `pnpm dev` — visuals unchanged from intent.

```bash
git add -A
git commit -m "refactor: replace inline magic-number styles with classes"
```

**Phase 2 verification:** `pnpm test` + `pnpm test:e2e` green; manual sweep of all 4 sections shows cohesive Ink & Amber; no inline color/size styles remain (`grep -rn "style={{" src/components` shows only dynamic values like avatar colors).

---

# PHASE 3 — SIMPLICITY

## Task 12: Extract SplitMethodPicker with bilingual explanation

**Files:**
- Create: `src/components/expenses/SplitMethodPicker.tsx`
- Test: `src/components/expenses/SplitMethodPicker.test.tsx`
- Modify: `src/i18n/translations.ts` (add summary/formula keys)

- [ ] **Step 1: Add i18n keys**

Add to `en` and `vi` (use the exact VN from the spec; user confirmed). Keys: `splitEqualSummary`, `splitSharesSummary`, `splitExactSummary`, `splitPercentSummary`, and `splitEqualFormula`, `splitSharesFormula`, `splitExactFormula`, `splitPercentFormula`. Example:

```typescript
// en
splitEqualSummary: "Everyone selected pays the same amount.",
splitEqualFormula: "each = total ÷ n (odd đồng → first members)",
splitSharesSummary: "Each person pays by weight — more shares means a bigger portion.",
splitSharesFormula: "each = total × (yourShares ÷ allShares)",
splitExactSummary: "You type the exact amount each person owes.",
splitExactFormula: "each = amount you type (Σ must = total)",
splitPercentSummary: "Each person pays a percentage of the total.",
splitPercentFormula: "each = total × (yourPercent ÷ 100) (Σ = 100)",
// vi
splitEqualSummary: "Mọi người được chọn trả số tiền bằng nhau.",
splitEqualFormula: "mỗi người = tổng ÷ số người (lẻ đồng → người đầu)",
splitSharesSummary: "Mỗi người trả theo số phần — nhiều phần hơn thì trả nhiều hơn.",
splitSharesFormula: "mỗi người = tổng × (số phần ÷ tổng phần)",
splitExactSummary: "Bạn nhập chính xác số tiền mỗi người phải trả.",
splitExactFormula: "mỗi người = số tiền bạn nhập (Σ = tổng)",
splitPercentSummary: "Mỗi người trả theo phần trăm của tổng số tiền.",
splitPercentFormula: "mỗi người = tổng × (phần trăm ÷ 100) (Σ = 100)",
```

- [ ] **Step 2: Write the failing test**

Create `src/components/expenses/SplitMethodPicker.test.tsx`:

```typescript
import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SplitMethodPicker } from "./SplitMethodPicker";

describe("SplitMethodPicker", () => {
  test("shows the summary for the active method", () => {
    render(<SplitMethodPicker method="shares" language="en" onChange={() => {}} />);
    expect(screen.getByText(/more shares means a bigger portion/i)).toBeInTheDocument();
  });
  test("calls onChange when a method is tapped", () => {
    const onChange = vi.fn();
    render(<SplitMethodPicker method="equal" language="en" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /exact/i }));
    expect(onChange).toHaveBeenCalledWith("exact");
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm test -- SplitMethodPicker`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the component**

Create `src/components/expenses/SplitMethodPicker.tsx`:

```typescript
import type { Language } from "../../i18n/translations";
import { t } from "../../i18n/translations";
import type { SplitMethod } from "../../domain/types";

const METHODS: SplitMethod[] = ["equal", "shares", "exact", "percentage"];
const LABEL: Record<SplitMethod, "equal" | "shares" | "exact" | "percentage"> = {
  equal: "equal", shares: "shares", exact: "exact", percentage: "percentage",
};
const SUMMARY: Record<SplitMethod, string> = {
  equal: "splitEqualSummary", shares: "splitSharesSummary",
  exact: "splitExactSummary", percentage: "splitPercentSummary",
};
const FORMULA: Record<SplitMethod, string> = {
  equal: "splitEqualFormula", shares: "splitSharesFormula",
  exact: "splitExactFormula", percentage: "splitPercentFormula",
};

export function SplitMethodPicker({
  method, language, onChange,
}: {
  method: SplitMethod;
  language: Language;
  onChange: (m: SplitMethod) => void;
}) {
  return (
    <div>
      <div className="segmented">
        {METHODS.map((m) => (
          <button
            key={m}
            type="button"
            className={m === method ? "active" : ""}
            onClick={() => onChange(m)}
          >
            {t(language, LABEL[m] as never)}
          </button>
        ))}
      </div>
      <div className="splitHelp">
        <p className="splitHelpSummary">{t(language, SUMMARY[method] as never)}</p>
        <code className="splitHelpFormula">{t(language, FORMULA[method] as never)}</code>
      </div>
    </div>
  );
}
```

Add styles to `styles.css`:

```css
.splitHelp { margin-top: var(--space-2); background: var(--color-primary-light); border-radius: var(--radius-md); padding: var(--space-3); }
.splitHelpSummary { margin: 0; font-size: var(--text-sm); font-weight: 600; color: var(--color-primary-hover); }
.splitHelpFormula { display: block; margin-top: var(--space-2); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text); }
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm test -- SplitMethodPicker`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/expenses/SplitMethodPicker.tsx src/components/expenses/SplitMethodPicker.test.tsx src/i18n/translations.ts src/styles.css
git commit -m "feat: SplitMethodPicker with bilingual summary + formula"
```

---

## Task 13: Extract ParticipantSelector with "All" toggle

**Files:**
- Create: `src/components/expenses/ParticipantSelector.tsx`
- Test: `src/components/expenses/ParticipantSelector.test.tsx`
- Modify: `src/i18n/translations.ts` (add `all`, `selected` keys)

- [ ] **Step 1: Add i18n keys** — `all: "All"/"Tất cả"`, `nSelected: "{n} selected"/"đã chọn {n}"`.

- [ ] **Step 2: Write the failing test**

Create `src/components/expenses/ParticipantSelector.test.tsx`:

```typescript
import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParticipantSelector } from "./ParticipantSelector";

const members = [
  { id: "a", name: "Alvin", active: true },
  { id: "b", name: "Duy", active: true },
];

describe("ParticipantSelector", () => {
  test("All toggle selects everyone when none selected", () => {
    const onChange = vi.fn();
    render(<ParticipantSelector members={members} selected={[]} language="en" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /all/i }));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  });
  test("All toggle clears everyone when all selected", () => {
    const onChange = vi.fn();
    render(<ParticipantSelector members={members} selected={["a", "b"]} language="en" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /all/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
```

- [ ] **Step 3: Run to verify it fails** — `pnpm test -- ParticipantSelector` → FAIL.

- [ ] **Step 4: Implement**

Create `src/components/expenses/ParticipantSelector.tsx`:

```typescript
import type { Language } from "../../i18n/translations";
import { t } from "../../i18n/translations";
import type { Member } from "../../domain/types";

export function ParticipantSelector({
  members, selected, language, onChange,
}: {
  members: Member[];
  selected: string[];
  language: Language;
  onChange: (ids: string[]) => void;
}) {
  const allOn = selected.length === members.length && members.length > 0;
  const some = selected.length > 0 && !allOn;
  const toggleAll = () => onChange(allOn ? [] : members.map((m) => m.id));
  const toggleOne = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="participantSelector">
      <button
        type="button"
        className={`allTag ${allOn ? "on" : some ? "some" : ""}`}
        onClick={toggleAll}
      >
        <span className="allBox">{allOn ? "✓" : some ? "–" : ""}</span>
        {t(language, "all" as never)}
      </button>
      {members.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`memberTag ${selected.includes(m.id) ? "on" : ""}`}
          onClick={() => toggleOne(m.id)}
        >
          {m.name}
        </button>
      ))}
    </div>
  );
}
```

Add minimal styles (`.participantSelector`, `.allTag`, `.allTag.on`, `.allTag.some`, `.memberTag`, `.memberTag.on`) to `styles.css` following the mock (amber-bordered All, ink-filled selected).

- [ ] **Step 5: Run to verify it passes** — `pnpm test -- ParticipantSelector` → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/expenses/ParticipantSelector.tsx src/components/expenses/ParticipantSelector.test.tsx src/i18n/translations.ts src/styles.css
git commit -m "feat: ParticipantSelector with tri-state All toggle"
```

---

## Task 14: Extract PayerInputs with live running total

**Files:**
- Create: `src/components/expenses/PayerInputs.tsx`
- Test: `src/components/expenses/PayerInputs.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/expenses/PayerInputs.test.tsx`:

```typescript
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { PayerInputs } from "./PayerInputs";

const members = [{ id: "a", name: "Alvin", active: true }, { id: "b", name: "Duy", active: true }];

describe("PayerInputs running total", () => {
  test("shows mismatch when payers don't cover total", () => {
    render(<PayerInputs members={members} payers={[{ rowId: "1", memberId: "a", amount: "150000" }]}
      totalMinor={200000} language="en" onChange={() => {}} />);
    expect(screen.getByText(/150,000 \/ 200,000/)).toBeInTheDocument();
    expect(screen.getByTestId("payer-total")).toHaveClass("no");
  });
  test("shows ok when payers cover total", () => {
    render(<PayerInputs members={members} payers={[{ rowId: "1", memberId: "a", amount: "200000" }]}
      totalMinor={200000} language="en" onChange={() => {}} />);
    expect(screen.getByTestId("payer-total")).toHaveClass("ok");
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm test -- PayerInputs` → FAIL.

- [ ] **Step 3: Implement** PayerInputs rendering one row per payer (member select + amount input + remove), a "+ split payers" affordance, and a running-total line:

```typescript
import type { Language } from "../../i18n/translations";
import type { Member } from "../../domain/types";
import { formatMoney } from "../../domain/money";

export type PayerRow = { rowId: string; memberId: string; amount: string };

function parse(v: string) { const d = v.replace(/[^\d]/g, ""); return d ? Number(d) : 0; }

export function PayerInputs({
  members, payers, totalMinor, language, onChange,
}: {
  members: Member[]; payers: PayerRow[]; totalMinor: number; language: Language;
  onChange: (rows: PayerRow[]) => void;
}) {
  const covered = payers.reduce((s, p) => s + parse(p.amount), 0);
  const ok = covered === totalMinor && totalMinor > 0;
  // ... render rows (member <select>, amount <input>, remove button) + add button ...
  return (
    <div className="payerInputs">
      {/* rows here */}
      <div className={`payerTotal ${ok ? "ok" : "no"}`} data-testid="payer-total">
        {formatMoney(covered, language)} / {formatMoney(totalMinor, language)} {ok ? "✓" : "✗"}
      </div>
    </div>
  );
}
```

> Implement the row rendering fully (member dropdown from `members`, amount input calling `onChange` with updated rows, a remove button per row when >1, and an add-payer button). `formatMoney` already exists in `src/domain/money.ts` — confirm its signature `(minor, language)`.

- [ ] **Step 4: Run to verify it passes** — `pnpm test -- PayerInputs` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/expenses/PayerInputs.tsx src/components/expenses/PayerInputs.test.tsx
git commit -m "feat: PayerInputs with live running total"
```

---

## Task 15: Rebuild ExpensesSection form using extracted parts + edit-time validation

**Files:**
- Modify: `src/components/expenses/ExpensesSection.tsx` (form JSX 290-576)

- [ ] **Step 1: Wire in the three components**

Replace the inline payer block (357-437) with `<PayerInputs ... />`, the participant grid (458-481) with `<ParticipantSelector ... />`, and the split-method pills (482-494) with `<SplitMethodPicker ... />`. Map the existing `draft.payers` / `draft.participants` shapes to the new component props (adapter inline). Keep `buildExpenseFromDraft`/`buildPreview` for the final save.

- [ ] **Step 2: Make Save reflect validity live**

Disable the Save button when `!preview.ok`, and label it with the reason from `preview.message` (the memo at line 267 already computes this each keystroke). The running totals now live inside `PayerInputs`/`SplitMethodPicker`, so the form shows problems before save.

- [ ] **Step 3: Field order + single-payer default**

Reorder to: Amount → Title → Category + Date → Who paid → Split how (with explanation) → Between who. Default `draft.payers` to a single payer covering the full amount; the "+ split payers" affordance reveals additional rows.

- [ ] **Step 4: Verify**

Run: `pnpm test` (component tests green) and `pnpm test:e2e` (the existing expense CRUD E2E must still pass — update selectors in `e2e/app.spec.ts` if labels changed). `pnpm dev` — add an expense, confirm live totals + disabled-save-with-reason.

- [ ] **Step 5: Commit**

```bash
git add src/components/expenses/ExpensesSection.tsx e2e/app.spec.ts
git commit -m "feat: rebuild expense form — extracted parts, edit-time validation"
```

---

## Task 16: Member form progressive disclosure

**Files:**
- Modify: `src/components/members/MembersSection.tsx:86-156`

- [ ] **Step 1: Collapse payment fields**

Wrap the payment fields (bankName, bankCode, accountNumber, accountHolder, transferNoteTemplate, QR upload — lines 94-156) in a collapsible region gated by local state `const [showPayment, setShowPayment] = useState(false)`. Show only the name field plus a `+ {t(language,"addPaymentDetails")}` button initially; expand on click. When editing a member who already has payment info, default `showPayment` to true.

- [ ] **Step 2: Add i18n key** `addPaymentDetails: "Add payment details"/"Thêm thông tin thanh toán"`.

- [ ] **Step 3: Verify + commit**

Run: `pnpm dev` — adding a member shows one field; expanding reveals bank/QR. `pnpm test:e2e` (member bank-edit test still passes; expand the section in the test first).

```bash
git add src/components/members/MembersSection.tsx src/i18n/translations.ts e2e/app.spec.ts
git commit -m "feat: progressive disclosure for member payment details"
```

---

## Task 17: Settlement readability + sample "Start fresh"

**Files:**
- Modify: `src/components/balances/BalancesSection.tsx` (settled members), `src/styles.css`
- Modify: `src/app/sample-data.ts`, `src/App.tsx`

- [ ] **Step 1: Settled members recede**

In `BalancesSection.tsx`, add a `balanceCard--settled` modifier (reduced opacity + ✓) for members with `balance === 0`. Mode toggle captions already exist (`fewestTransfers`/`payWhoYouOwe`) — verify they render under each option.

- [ ] **Step 2: Mark the sample trip**

In `sample-data.ts`, add `isSample: true` to the returned trip object (extend `Trip` type in `src/domain/types.ts` with optional `isSample?: boolean`). In `App.tsx`, when `activeTrip.isSample`, show a dismissible banner: `{t(language,"sampleBanner")}` + a `{t(language,"startFresh")}` button that creates a new empty trip (name prompt or default) and switches to it / routes to "members".

- [ ] **Step 3: Add i18n keys** `sampleBanner`, `startFresh`.

- [ ] **Step 4: Verify + commit**

Run: `pnpm dev` (fresh localStorage) — banner appears on the sample; "Start fresh" gives an empty trip. `pnpm test` + `pnpm test:e2e` green.

```bash
git add -A
git commit -m "feat: settled-member styling + sample trip Start fresh"
```

**Phase 3 verification:** Component tests for the 3 extracted parts pass; expense form shows edit-time validation; member form is progressive; sample is clearly marked. `pnpm test` + `pnpm test:e2e` green.

---

# PHASE 4 — DELIGHT

## Task 18: Image resize utility + receipt photos

**Files:**
- Create: `src/media/resize-image.ts`
- Test: `src/media/resize-image.test.ts`
- Modify: `src/components/expenses/ExpensesSection.tsx` (upload UI after date input ~line 346)

- [ ] **Step 1: Write the failing test** (jsdom lacks canvas; test the guard logic, mock canvas)

Create `src/media/resize-image.test.ts`:

```typescript
import { describe, expect, test } from "vitest";
import { isImageFile } from "./resize-image";

describe("isImageFile", () => {
  test("accepts image mime types", () => {
    expect(isImageFile(new File([], "a.jpg", { type: "image/jpeg" }))).toBe(true);
  });
  test("rejects non-images", () => {
    expect(isImageFile(new File([], "a.pdf", { type: "application/pdf" }))).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm test -- resize-image` → FAIL.

- [ ] **Step 3: Implement**

Create `src/media/resize-image.ts`:

```typescript
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/** Downscale an image file to a JPEG data URL, max edge `maxPx`, to protect localStorage. */
export async function resizeToDataUrl(file: File, maxPx = 1000, quality = 0.7): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
```

- [ ] **Step 4: Run to verify it passes** — `pnpm test -- resize-image` → PASS.

- [ ] **Step 5: Add receipt upload to the expense form**

After the date input in `ExpensesSection.tsx`, add a `📷 {t(language,"addReceipt")}` file input that calls `resizeToDataUrl` and stores the result in `draft` (add `receiptImageDataUrl` to `ExpenseDraft`, persist it in `buildExpenseFromDraft`, and show a thumbnail with a remove button when present). Add i18n keys `addReceipt`, `removeReceipt`.

- [ ] **Step 6: Verify + commit**

Run: `pnpm dev` — attach a photo to an expense, see thumbnail, save, reopen (persists in localStorage). `pnpm test` green.

```bash
git add -A
git commit -m "feat: receipt photos with client-side resize"
```

---

## Task 19: Friend-facing ShareView + "Who are you?"

**Files:**
- Create: `src/components/sharing/ShareView.tsx`
- Modify: `src/App.tsx` (route into ShareView when opened as a guest)

- [ ] **Step 1: Decide guest detection**

When the URL has `?trip=...` AND no saved store existed before this load (guest), render `ShareView` instead of the editor. Reuse `loadTripFromShareUrl()` (App.tsx:98-111). Add a query flag `&view=share` set by the host's copied link so the host opening their own link still edits. Update `getShareUrl()` (App.tsx:391-403) to append `&view=share`.

- [ ] **Step 2: Build ShareView**

Create `src/components/sharing/ShareView.tsx`: a read-only screen that (a) shows a "Who are you?" member picker (stores choice in `sessionStorage`), then (b) shows that member's settlement amount(s) using `calculateTrip` + the existing settlement, with a VietQR via `generatePaymentQr` (now offline), plus a "How this was calculated" breakdown and an "as of {date}" stamp. No editing controls.

- [ ] **Step 3: Add i18n keys** `whoAreYou`, `youOwe`, `youreOwed`, `howCalculated`, `asOf`, `scanToPay`, `allSettled`.

- [ ] **Step 4: Verify + commit**

Run: `pnpm build && pnpm dev`. Copy a share link, open in a private window — picker → amount → QR. `pnpm test:e2e` — add a test that loads a `?trip=...&view=share` URL and asserts the picker appears.

```bash
git add -A
git commit -m "feat: read-only ShareView with Who-are-you picker"
```

---

## Task 20: Quick-add templates

**Files:**
- Create: `src/components/expenses/QuickAdd.tsx`
- Modify: `src/components/expenses/ExpensesSection.tsx` (render above the form)

- [ ] **Step 1: Implement** a `QuickAdd` that derives up to 5 templates from the most recent expenses (sort `trip.expenses` by `createdAt` desc, dedupe by `title`+`category`), rendered as tappable chips. Tapping pre-fills the draft (title, category, splitMethod, participants, payers) leaving amount empty/focused.

- [ ] **Step 2: Render** `<QuickAdd ... />` above the expense form, only when `trip.expenses.length > 0`. Add i18n key `quickAdd: "Quick add"/"Thêm nhanh"`.

- [ ] **Step 3: Verify + commit**

Run: `pnpm dev` — recent expenses show as chips; tapping pre-fills. `pnpm test` green.

```bash
git add -A
git commit -m "feat: quick-add templates from recent expenses"
```

---

## Task 21: PWA install + offline

**Files:**
- Modify: `package.json` (add dep), `vite.config.ts`, `index.html`
- Create: `public/` icons (192, 512, maskable, apple-touch-icon 180)

- [ ] **Step 1: Install plugin**

```bash
pnpm add -D vite-plugin-pwa
```

- [ ] **Step 2: Configure vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Trip Split Bill",
        short_name: "TripSplit",
        theme_color: "#1c1a16",
        background_color: "#fbf8f1",
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
```

- [ ] **Step 3: Create icons in `public/`**

Generate `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png` (180×180) from a simple receipt-mark on amber/paper. (Placeholder generation acceptable; replace with final art later. Do NOT ship without the files — the manifest references them.)

- [ ] **Step 4: Update index.html**

Add to `<head>`: `<meta name="theme-color" content="#1c1a16" />` and `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`.

- [ ] **Step 5: Verify**

Run: `pnpm build && pnpm preview`. In Chrome DevTools → Application → Manifest: no errors, install prompt available. Toggle Network → Offline, reload — app still loads and a settlement QR still generates (Phase 1/3 made this real).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: PWA install + offline service worker"
```

**Phase 4 verification:** receipts persist & display; ShareView works from a copied link in a fresh browser; quick-add pre-fills; app installs and works fully offline. `pnpm test` + `pnpm test:e2e` green; `pnpm build` clean.

---

## Cross-cutting Definition of Done

- `pnpm test` green (all unit + component tests, incl. new settlement/qr/bank-bins/split-picker/participant/payer/resize tests)
- `pnpm test:e2e` green on desktop + mobile
- `pnpm build` clean under strict TS
- Manual VN pass: zero English anywhere
- Offline: load + settlement QR generation work with network disabled
- All four phases' verification sections satisfied
