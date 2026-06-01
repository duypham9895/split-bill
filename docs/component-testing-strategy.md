# Component Testing Strategy

## Current State

- **11 unit tests** in `src/domain/calculations.test.ts` and `src/persistence/import-export.test.ts` — pure domain logic only
- **12 E2E tests** in `e2e/app.spec.ts` — full user flows via Playwright
- **0 component tests** — React Testing Library is installed (`@testing-library/react@16.3.1`) but unused
- Test infrastructure ready: `vitest.config.ts` with jsdom, `src/test/setup.ts` importing `@testing-library/jest-dom/vitest`

## Key Architecture Observations

All components receive props from `App.tsx` — they are **controlled components** with no internal state management (except `expenseSearch` in ExpensesSection). This makes them straightforward to test: render with props, assert DOM, simulate interactions, verify callback arguments.

The formula preview in ExpensesSection is a `useMemo` that depends on `draft`, `trip`, and `language`. Testing it means: change draft state via user interactions, then assert the preview DOM updates.

## Testing Principles

1. **Test behavior, not implementation.** Assert what the user sees and does, not internal state.
2. **Use real calculations.** The domain functions (`calculateExpenseShares`, `calculateTrip`, `formatMoney`) are pure and fast — no reason to mock them.
3. **Prefer `getByRole` over `getByText` or `querySelector`.** Role-based queries enforce accessibility and are resilient to DOM changes.
4. **Use `userEvent` over `fireEvent`.** `userEvent` simulates real browser behavior (focus, input, blur) which catches more bugs.
5. **Co-locate test files.** Place `*.test.tsx` next to the component file (`ExpensesSection.test.tsx` next to `ExpensesSection.tsx`).

## Test File Organization

```
src/components/
  expenses/
    ExpensesSection.tsx
    ExpensesSection.test.tsx    # NEW
  members/
    MembersSection.tsx
    MembersSection.test.tsx     # NEW
  balances/
    BalancesSection.tsx
    BalancesSection.test.tsx    # NEW
    SettlementList.tsx
    SettlementList.test.tsx     # NEW
  sharing/
    SharingSection.tsx
    SharingSection.test.tsx     # NEW
  shared/
    Avatar.tsx
    Avatar.test.tsx             # NEW
```

## Shared Test Helpers

Create `src/test/helpers.tsx` for reusable fixtures and render wrappers:

```tsx
// src/test/helpers.tsx
import { render, type RenderOptions } from "@testing-library/react";
import type { Member, Trip } from "../domain/types";

export const testMembers: Member[] = [
  { id: "duy", name: "Duy", active: true, payment: { bankName: "Vietcombank", bankCode: "970436", accountNumber: "1023456789", accountHolder: "DUY NGUYEN" } },
  { id: "alvin", name: "Alvin", active: true },
  { id: "ha", name: "Ha", active: true },
];

export const testTrip: Trip = {
  id: "trip-1",
  name: "Da Nang",
  currency: "VND",
  language: "en",
  members: testMembers,
  expenses: [],
  transfers: [],
};

export function tripWith(expenses: Trip["expenses"] = [], members: Member[] = testMembers): Trip {
  return { ...testTrip, members, expenses };
}
```

## Prioritized Test Cases

### Priority 1: ExpensesSection (highest complexity, highest risk)

The form has 4 cards, real-time formula preview, validation, and 4 split methods. Most user-facing bugs will surface here.

#### 1.1 Form Rendering and Basic Input

```tsx
// ExpensesSection.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { ExpensesSection, createExpenseDraft } from "./ExpensesSection";
import { tripWith } from "../../test/helpers";

function renderExpenses(overrides: Partial<Parameters<typeof ExpensesSection>[0]> = {}) {
  const trip = tripWith();
  const draft = createExpenseDraft(trip);
  const defaults = {
    draft,
    editingExpenseId: null,
    error: "",
    language: "en" as const,
    onCancelEdit: vi.fn(),
    onDeleteExpense: vi.fn(),
    onEditExpense: vi.fn(),
    setDraft: vi.fn(),
    trip,
    onSave: vi.fn(),
    ...overrides,
  };
  return { ...render(<ExpensesSection {...defaults} />), ...defaults };
}
```

**Test cases:**

| # | Test | What it verifies |
|---|------|-----------------|
| 1 | `renders all 4 form cards` | All section headers visible: "What was the expense?", "Who paid?", "Who shared this?", formula preview |
| 2 | `title input updates draft via setDraft` | Typing in title field calls `setDraft` with updated title |
| 3 | `amount input shows formatted preview` | Typing "300000" shows "300,000 VND" next to the input |
| 4 | `payer select dropdown lists all members` | Select element contains options for Duy, Alvin, Ha |
| 5 | `add payer button appends a new payer row` | Clicking "Add payer" calls setDraft with 2 payers |
| 6 | `remove payer button is disabled when only 1 payer` | Trash button has `disabled` attribute |
| 7 | `participant checkboxes reflect draft state` | All participants checked by default (createExpenseDraft sets selected: true) |

#### 1.2 Split Method Switching and Conditional Rendering

| # | Test | What it verifies |
|---|------|-----------------|
| 8 | `split details card hidden for equal method` | No "Split details" heading when splitMethod is "equal" |
| 9 | `split details card appears for exact method` | Clicking "Exact" shows "Split details — Exact" heading |
| 10 | `split details card appears for percentage method` | Clicking "Percent" shows "Split details — Percent" heading |
| 11 | `split details card appears for shares method` | Clicking "Shares" shows "Split details — Shares" heading |
| 12 | `exact split shows amount inputs per participant` | Each selected member gets an input field in the split table |
| 13 | `percentage split shows percentage inputs per participant` | Each selected member gets a percentage input |

**Code example — testing split method switching:**

```tsx
test("shows split details card when switching from equal to exact", async () => {
  const user = userEvent.setup();
  const { setDraft } = renderExpenses();

  const exactButton = screen.getByRole("button", { name: "Exact" });
  await user.click(exactButton);

  // setDraft was called with updated splitMethod
  expect(setDraft).toHaveBeenCalledWith(
    expect.objectContaining({ splitMethod: "exact" })
  );
});
```

#### 1.3 Select All / Clear All Participants

| # | Test | What it verifies |
|---|------|-----------------|
| 14 | `select all sets all participant checkboxes to checked` | All 3 checkboxes become checked |
| 15 | `clear all sets all participant checkboxes to unchecked` | All 3 checkboxes become unchecked |
| 16 | `toggle button text changes based on selection state` | Shows "Clear all" when all selected, "Select all" otherwise |

**Code example:**

```tsx
test("select all / clear all toggles participant checkboxes", async () => {
  const user = userEvent.setup();
  const trip = tripWith();
  const draft = createExpenseDraft(trip);
  // Start with no one selected
  for (const id of Object.keys(draft.participants)) {
    draft.participants[id].selected = false;
  }

  const { setDraft } = renderExpenses({ draft, trip });

  const selectAll = screen.getByRole("button", { name: "Select all" });
  await user.click(selectAll);

  const lastCall = setDraft.mock.calls.at(-1)![0];
  expect(Object.values(lastCall.participants).every((p: any) => p.selected)).toBe(true);
});
```

#### 1.4 Formula Preview (useMemo)

The formula preview is the most important UX element — it updates in real-time as the user edits the draft. Test it by rendering with specific draft states and asserting the preview text.

| # | Test | What it verifies |
|---|------|-----------------|
| 17 | `formula preview shows equal split breakdown` | "300,000 VND -> Duy 100,000 VND, Alvin 100,000 VND, Ha 100,000 VND" |
| 18 | `formula preview shows error for zero amount` | Preview shows warning message when amount is "0" |
| 19 | `formula preview shows error for empty title on save` | Validation error appears after clicking save with empty title |
| 20 | `formula preview shows exact split breakdown` | Each participant's exact amount shown in preview |
| 21 | `formula preview shows percentage split breakdown` | Each participant's percentage amount shown |

**Code example — testing formula preview with specific draft:**

```tsx
test("formula preview shows equal split breakdown", () => {
  const trip = tripWith();
  const draft = createExpenseDraft(trip);
  draft.amount = "300000";
  draft.title = "Dinner";
  // All 3 members selected with equal split

  renderExpenses({ draft, trip });

  const preview = screen.getByText(/Formula preview/i).closest(".formulaBox");
  expect(preview).toHaveTextContent("300,000 VND");
  expect(preview).toHaveTextContent("Duy");
  expect(preview).toHaveTextContent("Alvin");
  expect(preview).toHaveTextContent("Ha");
});
```

#### 1.5 Validation Errors

| # | Test | What it verifies |
|---|------|-----------------|
| 22 | `error box displays when error prop is non-empty` | Error message visible in `.errorBox` |
| 23 | `error box hidden when error prop is empty` | No `.errorBox` element |
| 24 | `save button calls onSave callback` | Clicking "Save expense" triggers onSave |

#### 1.6 Edit Mode

| # | Test | What it verifies |
|---|------|-----------------|
| 25 | `edit mode shows "Save changes" button instead of "Save expense"` | Button text changes |
| 26 | `edit mode shows cancel button` | "Cancel" button visible |
| 27 | `cancel button calls onCancelEdit` | Callback triggered |

#### 1.7 Expense List

| # | Test | What it verifies |
|---|------|-----------------|
| 28 | `empty state shown when no expenses` | "No expenses yet" message visible |
| 29 | `expense list renders each expense with title and amount` | Each expense title and formatted amount visible |
| 30 | `edit button on expense calls onEditExpense with expense` | Callback receives correct expense object |
| 31 | `delete button on expense calls onDeleteExpense with id` | Callback receives correct expense id |
| 32 | `expense search filters list by title` | Typing "dinner" hides non-matching expenses |

---

### Priority 2: MembersSection

#### 2.1 Form Rendering

| # | Test | What it verifies |
|---|------|-----------------|
| 33 | `renders all 7 form fields` | Trip name, member name, bank, bank code, account number, account holder, transfer note, QR upload |
| 34 | `member name input updates form via setForm` | Typing calls setForm with updated name |
| 35 | `bank fields update form via setForm` | Each bank field change triggers setForm |

#### 2.2 Validation

| # | Test | What it verifies |
|---|------|-----------------|
| 36 | `error displayed when error prop is non-empty` | Error box shows "Enter a name for this member." |
| 37 | `save button calls onSaveMember` | Clicking "Add member" triggers callback |

#### 2.3 Member List

| # | Test | What it verifies |
|---|------|-----------------|
| 38 | `member list renders each member with name` | Each member name visible |
| 39 | `member list shows payment info or "No payment info yet"` | Correct subtitle per member |
| 40 | `edit button calls onEditMember with member` | Callback receives correct member |
| 41 | `archive button toggles member active state` | Calls updateTrip with toggled active flag |

#### 2.4 Edit Mode

| # | Test | What it verifies |
|---|------|-----------------|
| 42 | `edit mode pre-fills form with member data` | All fields populated from member.payment |
| 43 | `edit mode shows "Save member" instead of "Add member"` | Button text changes |
| 44 | `cancel button calls onCancelEdit` | Callback triggered, form cleared |

---

### Priority 3: BalancesSection

#### 3.1 Balance Cards

| # | Test | What it verifies |
|---|------|-----------------|
| 45 | `renders balance card per member` | One card per member in balances array |
| 46 | `positive balance shows "should receive" status` | Status text and CSS class correct |
| 47 | `negative balance shows "should pay" status` | Status text and CSS class correct |
| 48 | `zero balance shows "settled" status` | Status text and CSS class correct |
| 49 | `balance card shows paid and owed amounts` | Formatted amounts visible |

#### 3.2 Settlement Mode Toggle

| # | Test | What it verifies |
|---|------|-----------------|
| 50 | `simplified mode button active by default` | Button has "active" class |
| 51 | `clicking direct mode calls setMode("direct")` | Callback triggered |
| 52 | `settlement list renders payments` | Each payment shows "From -> To" and amount |

#### 3.3 Mark Paid

| # | Test | What it verifies |
|---|------|-----------------|
| 53 | `mark paid button calls onMarkPaid with payment` | Callback receives correct SettlementPayment |

#### 3.4 Transfers Timeline

| # | Test | What it verifies |
|---|------|-----------------|
| 54 | `empty state shown when no transfers` | "No transfers yet" message visible |
| 55 | `transfer timeline renders each transfer` | Each transfer shows from->to and amount |

**Code example — testing balance status rendering:**

```tsx
test("positive balance shows should-receive status", () => {
  const balances = [
    { memberId: "duy", name: "Duy", totalPaid: 300000, totalOwed: 0, transferPaid: 0, transferReceived: 0, balance: 300000 },
    { memberId: "alvin", name: "Alvin", totalPaid: 0, totalOwed: 100000, transferPaid: 0, transferReceived: 0, balance: -100000 },
  ];

  render(
    <BalancesSection
      balances={balances}
      language="en"
      mode="simplified"
      settlement={[]}
      setMode={vi.fn()}
      trip={tripWith()}
      onMarkPaid={vi.fn()}
    />
  );

  expect(screen.getByText("Duy").closest(".balanceCard")).toHaveClass("balanceCard--receive");
  expect(screen.getByText("should receive")).toBeInTheDocument();
  expect(screen.getByText("Alvin").closest(".balanceCard")).toHaveClass("balanceCard--pay");
  expect(screen.getByText("should pay")).toBeInTheDocument();
});
```

---

### Priority 4: SettlementList

| # | Test | What it verifies |
|---|------|-----------------|
| 56 | `empty state when no payments` | "No payments needed" message |
| 57 | `renders payment rows with from->to and amount` | Each row shows member names and formatted amount |
| 58 | `mark paid button hidden in compact mode` | No button when `compact={true}` |
| 59 | `mark paid button triggers onMarkPaid` | Callback receives correct payment |

---

### Priority 5: SharingSection

| # | Test | What it verifies |
|---|------|-----------------|
| 60 | `renders all action buttons` | Copy share link, Print, Export JSON, Import JSON, Export CSV |
| 61 | `copy share link button calls onCopyShareLink` | Callback triggered |
| 62 | `export JSON button calls onDownloadJson` | Callback triggered |
| 63 | `export CSV button calls onDownloadCsv` | Callback triggered |
| 64 | `privacy notice is visible` | Privacy warning text present |
| 65 | `payment profiles render for each member` | Each member name and bank info visible |
| 66 | `empty state when no members` | "No members yet" message |
| 67 | `message box displays share message` | "Share link copied" message visible |
| 68 | `message box uses warning class for error messages` | CSS class changes based on message content |

---

### Priority 6: Shared Components (Avatar)

| # | Test | What it verifies |
|---|------|-----------------|
| 69 | `renders initials from member name` | "Duy" shows "D", "Alvin" shows "A" |
| 70 | `renders "?" when no member provided` | Fallback avatar |
| 71 | `renders first 2 initials for multi-word names` | "Anh TA" shows "AT" |

---

## Mocking Strategy

### What NOT to mock

- `calculateExpenseShares`, `calculateTrip`, `formatMoney` — pure functions, fast, deterministic
- `t()` translations — simple dictionary lookup, no side effects
- `buildPreview`, `buildExpenseFromDraft` — pure functions

### What to mock

- **Callback props** (`setDraft`, `onSave`, `onMarkPaid`, etc.) — use `vi.fn()` to assert calls
- **`navigator.clipboard`** — if testing copy-to-clipboard in SharingSection
- **`window.print()`** — if testing print button
- **`FileReader`** — if testing QR upload in MembersSection (already handled by jsdom)

### Mocking FileReader for QR upload tests

```tsx
test("uploadMemberQr reads file and calls setForm", async () => {
  const setForm = vi.fn();
  const form = { ...emptyMemberForm };
  const file = new File(["dummy"], "qr.png", { type: "image/png" });

  // Mock FileReader
  const reader = { readAsDataURL: vi.fn(), onload: null as any, result: "data:image/png;base64,abc" };
  vi.spyOn(window, "FileReader").mockImplementation(() => reader as any);

  const event = { target: { files: [file], value: "" } } as any;
  uploadMemberQr(event, form, setForm);

  // Simulate the onload callback
  reader.onload();

  expect(setForm).toHaveBeenCalledWith(
    expect.objectContaining({ qrImageDataUrl: "data:image/png;base64,abc" })
  );
});
```

---

## Testing User Interactions

### Typing into inputs

```tsx
const user = userEvent.setup();
const titleInput = screen.getByPlaceholderText("e.g. Seafood dinner, Airport taxi");
await user.type(titleInput, "Dinner");
expect(setDraft).toHaveBeenCalledWith(expect.objectContaining({ title: "Dinner" }));
```

### Selecting from dropdowns

```tsx
const payerSelect = screen.getByRole("combobox");
await user.selectOptions(payerSelect, "alvin");
expect(setDraft).toHaveBeenCalledWith(
  expect.objectContaining({
    payers: [expect.objectContaining({ memberId: "alvin" })],
  })
);
```

### Clicking checkboxes

```tsx
const checkbox = screen.getByRole("checkbox", { name: /Duy/ });
await user.click(checkbox);
```

### Clicking segmented buttons (split method)

```tsx
const exactButton = screen.getByRole("button", { name: "Exact" });
await user.click(exactButton);
```

---

## Testing Conditional Rendering

The split details card only renders when `splitMethod !== "equal"`. Test by:

1. Render with `splitMethod: "equal"` in draft — assert no "Split details" heading
2. Simulate clicking "Exact" button — assert "Split details" heading appears
3. Or: render directly with `splitMethod: "exact"` in draft — assert heading present

```tsx
test("split details card hidden for equal split", () => {
  const trip = tripWith();
  const draft = createExpenseDraft(trip);
  draft.splitMethod = "equal";
  renderExpenses({ draft, trip });
  expect(screen.queryByText(/Split details/)).not.toBeInTheDocument();
});

test("split details card shown for exact split", () => {
  const trip = tripWith();
  const draft = createExpenseDraft(trip);
  draft.splitMethod = "exact";
  renderExpenses({ draft, trip });
  expect(screen.getByText(/Split details/)).toBeInTheDocument();
});
```

---

## Testing Error Messages Appear/Disappear

Error messages are driven by the `error` prop. Test that:

1. When `error=""`, no `.errorBox` exists
2. When `error="Enter a name"`, the text is visible

```tsx
test("error box hidden when no error", () => {
  renderExpenses({ error: "" });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  // Or: expect(document.querySelector(".errorBox")).not.toBeInTheDocument();
});

test("error box shown when error present", () => {
  renderExpenses({ error: "Give this expense a name." });
  expect(screen.getByText("Give this expense a name.")).toBeInTheDocument();
});
```

Note: The app uses `<div className="errorBox">` not `<div role="alert">`. Consider adding `role="alert"` to error boxes in the component for better accessibility and easier testing.

---

## Implementation Order

1. **Phase 1:** Create `src/test/helpers.tsx` with shared fixtures
2. **Phase 2:** `ExpensesSection.test.tsx` — tests 1-32 (highest value, most complex component)
3. **Phase 3:** `MembersSection.test.tsx` — tests 33-44
4. **Phase 4:** `BalancesSection.test.tsx` — tests 45-55
5. **Phase 5:** `SettlementList.test.tsx` — tests 56-59
6. **Phase 6:** `SharingSection.test.tsx` — tests 60-68
7. **Phase 7:** `Avatar.test.tsx` — tests 69-71

Total: 71 test cases across 7 test files.

---

## Dependency: `@testing-library/user-event`

The project has `@testing-library/react` but may not have `@testing-library/user-event`. Check and install if needed:

```bash
pnpm add -D @testing-library/user-event
```

This is required for realistic keyboard/mouse simulation (`user.type`, `user.click`, `user.selectOptions`).

---

## Accessibility Improvements to Enable Testing

These small changes to components would make them more testable AND more accessible:

1. Add `role="alert"` to `.errorBox` elements — enables `getByRole("alert")` queries
2. Add `aria-label` to the payer amount inputs — enables `getByRole("spinbutton", { name: "Amount" })`
3. The existing `aria-label` on edit/delete buttons is already good for testing
