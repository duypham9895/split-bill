# Full Product Redesign Proposal

**Date:** 2026-06-01
**Scope:** Complete product redesign — information architecture, UX flows, visual system, content, mobile ergonomics, and implementation architecture.
**Preserves:** All existing domain logic, calculation engines, data model, persistence layer, i18n structure, and test coverage.

---

## Part 1: Diagnosis

### 1.1 Architecture Smell — The Monolith

`App.tsx` is 1,581 lines containing every component, helper, form state, and handler. This makes the codebase hard to navigate, test in isolation, or extend. The domain layer (`src/domain/`) is clean; the React layer is not.

**Impact:** Adding a single field to the expense form requires reading through 1,000+ lines of unrelated component code. Component tests are impossible without extracting components first.

### 1.2 Information Architecture Problems

| Problem | Evidence |
|---------|----------|
| "QA & Release" is a dev-only section exposed to end users | Screenshot 21–22: shows QA checklist and bug report draft — meaningless to a trip organizer |
| "Members" conflates trip settings with member management | The trip name field sits above the member form, creating a confusing two-level hierarchy |
| No empty states guide new users | Screenshot 23: new trip shows an empty expenses list with no prompt to add members first |
| No progressive disclosure — everything is visible at once | The expense form shows all fields (title, amount, date, category, payers, participants, split method, split details, note, formula preview) regardless of complexity |

### 1.3 Expense Form — The Core Pain Point

The expense form is the most-used surface and the most problematic:

1. **Vertical sprawl:** 10+ form fields stacked vertically before the save button. On mobile, the user scrolls through ~800px of form to reach "Save expense."
2. **Payer UX confusion:** The remove button on payer rows shows the row index number (`1`, `2`) — users expect a delete icon, not a number.
3. **No visual grouping:** "Paid by," "Participants," and "Split method" are separated only by small bold labels. There's no card or section container to group related fields.
4. **Split method segmented control is cramped:** 4 equal-width columns on desktop (2 on mobile) with labels "Equal / Exact / Percent / Shares" — "Percent" and "Shares" can truncate on narrow screens.
5. **Participant grid shows 4 columns:** On desktop with 4 members, each checkbox cell is ~200px wide. With 6+ members, this becomes a wall of checkboxes.
6. **Formula preview is buried below the note field:** The most trust-building element (showing the math) is pushed below an optional field.
7. **Expense list has no visual differentiation:** Every expense looks the same — no category icons, no date, no split method badge, no visual weight difference between a 300K taxi and a 1.5M dinner.

### 1.4 Visual Design Issues

| Issue | Detail |
|-------|--------|
| Red primary button (`#ef5d54`) for "Add" actions | Red universally signals danger/delete. Using it for the primary CTA creates subconscious hesitation. |
| No depth or layering | All panels are flat white cards with identical 1px gray borders. No elevation hierarchy. |
| Inconsistent spacing rhythm | Panel padding is 24px, form gap is 16px, rail gap is 16px, content grid gap is 20px — no consistent 8px grid. |
| Typography is flat | h1 (22px), labels (13px bold), body (13px), small (13px) — only 2 effective sizes. No visual hierarchy through type scale. |
| Avatar is too small for touch | 34px circle with 12px initials — below the 44px minimum touch target. |
| Segmented control active state uses teal (`#087f7b`) | This is the same color as the brand mark and positive balances — it creates visual confusion between "selected" and "positive/good." |

### 1.5 Mobile Experience

- Sidebar collapses to a 5-column horizontal nav. With labels like "Trips & Members" and "Balances & Settlement," text overflows or wraps awkwardly.
- The expense form on mobile is a single column that extends to 800+ pixels of scrolling.
- No sticky primary action — the "Save expense" button is at the bottom of the form, invisible until the user scrolls.
- Touch targets below 44px (avatar, icon buttons at 40px).
- The summary rail disappears on mobile — users lose the balance/settlement context.

### 1.6 Content & Copy Issues

- ~30% of user-facing strings are hardcoded in English inside components (e.g., "Edit member," "Trip name," "Bank," "Account number," "Paid by," "Participants," "Note," "Formula preview," all error messages, all section subtitles).
- Vietnamese translations use ASCII-only (`Chuyen di` instead of `Chuyến đi`) — this was a deliberate choice but reduces readability for Vietnamese users.
- Error messages are generic: "Member name is required." — no guidance on what to do.
- No contextual help explaining split methods, settlement modes, or what "simplified" vs "direct payback" means.

---

## Part 2: Redesigned Information Architecture

### 2.1 Section Restructure

**Current (5 sections):**
1. Trips & Members
2. Expenses & Splits
3. Balances & Settlement
4. Sharing & Payment
5. QA & Release

**Proposed (4 sections):**
1. **Trip** — trip settings, member management, payment profiles
2. **Expenses** — add/edit expenses, expense list
3. **Settle** — balances, settlement, transfers, mark paid
4. **Share** — export, import, print, share link, payment summary

**Rationale:**
- Remove "QA & Release" from the main nav entirely. It's a dev tool, not a user workflow. Move it to a hidden route (`/qa`) or a settings debug menu.
- Rename "Members" to "Trip" — the section already manages trip-level settings (name, language) alongside members. The name should reflect that.
- Rename "Balances & Settlement" to "Settle" — shorter, more actionable, works as a verb.
- Rename "Sharing & Payment" to "Share" — the "Payment" part is redundant since payment profiles are also in the Trip section.

### 2.2 Navigation Labels

| Section | Icon | EN Label | VN Label | Hint (EN) | Hint (VN) |
|---------|------|----------|----------|-----------|-----------|
| Trip | `Users` | Trip | Chuyến đi | Members & payments | Thành viên & thanh toán |
| Expenses | `ReceiptText` | Expenses | Chi phí | Who paid, how to split | Ai trả, chia thế nào |
| Settle | `Scale` | Settle | Quyết toán | Balances & transfers | Số dư & chuyển tiền |
| Share | `Send` | Share | Chia sẻ | Export & share | Xuất & chia sẻ |

### 2.3 Default Landing Section

**Current:** Opens on "Expenses" by default.
**Proposed:** Open on "Trip" if the trip has 0 members (guided setup), otherwise open on "Expenses" (primary workflow).

---

## Part 3: Screen-by-Screen Redesign

### 3.1 Trip Section (formerly Members)

#### Layout

**Desktop:** Two-column layout (form left, member list right) — keep this, it works.

**Mobile:** Stack vertically — form on top, member list below. Add a floating "Add member" FAB at the bottom-right when the form is not visible.

#### Form Redesign

**Current problem:** The form shows all 7 fields (name, bank, bank code, account number, account holder, transfer note, QR upload) at once, even for a new member who just wants to add a name.

**Proposed:** Progressive disclosure with two tiers.

**Tier 1 — Always visible:**
- Member name (required)
- "Add payment details" expandable section (collapsed by default for new members)

**Tier 2 — Inside "Payment details" accordion:**
- Bank name + Bank code (2-column grid)
- Account number + Account holder (2-column grid)
- Transfer note template
- QR image upload with preview

**When editing an existing member:** Payment details accordion is open by default if the member already has payment info.

#### Trip Name Field

Move the trip name field to the top bar (next to the trip picker dropdown), not inside the Members section. This makes it always visible and clearly a trip-level setting, not a member-level one.

**Implementation:** Replace the `<select>` in the topbar with a combiner: dropdown for trip switching + inline-editable trip name.

#### Member List Redesign

**Current:** Each row shows avatar, name, bank summary, edit button, active/archived toggle.

**Proposed:**
- Avatar (40px, up from 34px — meets touch target)
- Name + bank summary (keep)
- **Status badge:** "Has payment" (teal dot) or "No payment" (gray dot) — replaces the text-only indicator
- **Edit button** (keep)
- **Archive toggle:** Replace the text "Active/Archived" with a more compact icon toggle (archive box icon). Show archived members in a collapsible "Archived" section below.

#### Empty State

When no members exist, show:
```
[Users icon]
No members yet
Add trip members to start splitting expenses.
[Add member button]
```

### 3.2 Expenses Section

This is the most critical redesign. The expense form needs to go from a 10-field vertical sprawl to a guided, grouped workflow.

#### Form Redesign — Card-Based Grouping

Split the form into 4 visual cards (white cards with subtle shadows, inside the main panel):

**Card 1: "What was the expense?"**
- Title (text input)
- Amount (numeric input, large font — the most important field)
- Date + Category (2-column grid, below amount)

**Card 2: "Who paid?"**
- Payer rows with proper delete icons (not index numbers)
- "Add payer" button
- Running total vs. expense amount validation indicator

**Card 3: "Who shared this?"**
- Participant checkboxes (2-column grid on desktop, 1-column on mobile)
- "Select all / Clear all" toggle buttons above the grid
- Split method segmented control (below the participant grid, not above — the user picks participants first, then decides how to split)

**Card 4: "Split details"** (only visible when split method ≠ equal)
- Split table with participant names and input fields
- This card is hidden for "Equal" split — reducing visual noise for the common case

**Formula preview:** Move to a sticky bar at the bottom of the form (above the save button), always visible. This is the trust-building element — it should never be below the fold.

**Save button:** Sticky at the bottom of the form on mobile. On desktop, it's at the bottom of the last card.

#### Expense List Redesign

**Current:** Each expense shows title, amount, payer names, participant names, edit/delete buttons.

**Proposed:** Each expense card shows:
- **Left column:** Category icon (use Lucide icons mapped to common categories: `Utensils` for food, `Car` for transport, `Hotel` for lodging, `Shopping` for shopping, `ReceiptText` for other)
- **Center:** Title, payer line ("HA paid · percentage split"), participant count ("4 people")
- **Right:** Amount (large, bold), date (small, muted), edit/delete icon buttons

**Category icon mapping:**
```
Food/Dinner → Utensils
Transport/Taxi → Car
Hotel/Accommodation → Hotel
Shopping → ShoppingBag
Activities → Ticket
Other → ReceiptText
```

#### Expense Form — Amount Input

Make the amount input visually prominent:
- Larger font size (24px instead of default 14px)
- Right-aligned
- Show formatted preview below the input: `1,520,000 VND`
- Use `inputMode="numeric"` with a pattern that strips non-digits (already implemented)

#### Participant Grid Improvements

- **Desktop:** 3 columns (not 4) — more breathing room
- **Tablet:** 2 columns
- **Mobile:** 2 columns (not 1) — avoids an extremely long vertical list
- Each checkbox cell should show: avatar (40px) + name + checkbox — vertically stacked or horizontal, but always with adequate spacing
- Touch target: entire cell is clickable, not just the checkbox

#### Payer Row Improvements

- Replace the index-number button with a `Trash2` icon button
- Show a visual indicator when payer contributions don't match the expense total (red border on the payer amount input, or a warning below the payer rows)
- Auto-fill single payer amount to match the expense total (already implemented, but make it more obvious)

### 3.3 Settle Section (formerly Balances & Settlement)

#### Balance Table Redesign

**Current:** 6-column HTML table (Member, Paid, Owed, Transfer paid, Transfer received, Balance).

**Proposed:** Simplified view with expandable detail.

**Default view (card-based, not table):**
```
[Avatar] Duy
  Paid: 800,000 VND · Owed: 575,000 VND
  Net: +225,000 VND (should receive)    [teal]

[Avatar] Alvin
  Paid: 200,000 VND · Owed: 575,000 VND
  Net: -375,000 VND (needs to pay)      [red]
```

**Expandable detail (click to expand):**
```
  Transfer paid: 0 VND
  Transfer received: 100,000 VND
  Balance breakdown: ...
```

**Rationale:** Most users care about the net balance, not the intermediate columns. The full table is still available for audit-minded users.

**On mobile:** This card layout works much better than a 6-column table that requires horizontal scrolling.

#### Settlement Mode Toggle

Keep the simplified/direct toggle but add helper text:
- **Simplified:** "Fewest transfers between members"
- **Direct payback:** "Each person pays back who they owe"

#### Settlement Payment Cards

**Current:** Simple rows with "pays" text and "Mark paid" button.

**Proposed:** Rich payment cards:
```
[Avatar] Alvin → [Avatar] Duy
300,000 VND
[Bank info] Vietcombank · 102345678910
[QR code thumbnail — click to expand]
Transfer note: "Da Nang trip - Alvin"
[Mark as paid button]
```

When marked as paid, the card shows a green "Paid" badge and the date.

#### Transfer History

Show transfers as a timeline, not a flat list:
```
✓ Alvin paid Duy 100,000 VND — Jun 1
  Note: "Marked paid from settlement"
```

### 3.4 Share Section

#### Action Grid Redesign

**Current:** 5 buttons in a 3-column grid (Export JSON, Import JSON, Export CSV, Print, Copy share link).

**Proposed:** Group by intent:

**Primary actions (top row, larger buttons):**
- **Copy share link** (primary button — this is the most common action)
- **Print summary** (ghost button)

**Secondary actions (bottom row, smaller):**
- Export JSON · Import JSON · Export CSV

#### Payment Profiles

Keep the current layout but improve:
- Show QR image at a larger size (96px instead of 72px)
- Add a "Tap to expand" interaction for QR codes
- Show bank details in a copyable format (click-to-copy account number)
- Add a visual indicator for members with complete vs. incomplete payment info

#### Share Link Privacy Warning

**Current:** Shows a message after copying: "Share link copied. Keep in mind that payment details are visible to anyone with the link."

**Proposed:** Show the warning *before* copying, in a confirmation-style box:
```
⚠️ This link includes bank details for all members.
Only share with your trip group.
[Copy link] [Cancel]
```

### 3.5 Remove QA Section from Main Nav

Move the QA section to a hidden route or debug menu. End users should never see this. If you want to keep it accessible during development, add a keyboard shortcut (e.g., `Ctrl+Shift+Q`) or a version-tap easter egg.

---

## Part 4: Visual Design System Overhaul

### 4.1 Color System

**Problem:** Red (`#ef5d54`) as the primary action color signals danger.

**Proposed palette:**

| Token | Current | Proposed | Usage |
|-------|---------|----------|-------|
| `--color-primary` | `#087f7b` (teal) | `#087f7b` (keep) | Brand, active nav, positive balance, checkboxes |
| `--color-action` | `#ef5d54` (red) | `#2563eb` (blue) | Primary buttons, CTAs |
| `--color-danger` | `#ef5d54` (red) | `#ef5d54` (keep) | Delete actions, error states, negative balance |
| `--color-success` | `#20a064` (green) | `#20a064` (keep) | Paid status, local-first indicator |
| `--color-warning` | (none) | `#f59e0b` (amber) | Validation warnings, privacy notices |

**Rationale:** Blue as the primary action color is universally understood as "safe to proceed." Red is reserved exclusively for destructive actions and negative balances, eliminating the current confusion.

### 4.2 Spacing System

Adopt a strict 4px base grid:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps (icon-to-text) |
| `--space-2` | 8px | Default gap within components |
| `--space-3` | 12px | Card padding, row padding |
| `--space-4` | 16px | Form field gaps |
| `--space-5` | 20px | Section gaps |
| `--space-6` | 24px | Panel padding |
| `--space-8` | 32px | Major section dividers |

### 4.3 Typography Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| `h1` | 24px | 700 | Panel headers (up from 22px) |
| `h2` | 18px | 700 | Card headers, rail section headers |
| `h3` | 15px | 600 | Sub-section headers |
| `body` | 14px | 400 | Default text (up from 13px) |
| `label` | 13px | 600 | Form labels (down from 700 — less aggressive) |
| `caption` | 12px | 400 | Muted text, timestamps |
| `amount-lg` | 24px | 700 | Amount input, primary amounts |
| `amount-md` | 16px | 600 | Amounts in lists |

### 4.4 Component Tokens

| Component | Token | Value |
|-----------|-------|-------|
| Border radius | `--radius-sm` | 6px (inputs, buttons) |
| | `--radius-md` | 10px (cards) |
| | `--radius-lg` | 14px (panels) |
| Shadow | `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| | `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` |
| Input height | `--input-h` | 44px (up from 42px — better touch target) |
| Button height | `--btn-h` | 44px |
| Avatar size | `--avatar-sm` | 36px |
| | `--avatar-md` | 44px (default, up from 34px) |
| | `--avatar-lg` | 56px (payment cards) |

### 4.5 Elevation System

| Level | Usage |
|-------|-------|
| Level 0 | Page background (`#f6f8fb`) |
| Level 1 | Sidebar, panels (white, `--shadow-sm`) |
| Level 2 | Cards within panels (white, `--shadow-md`) |
| Level 3 | Dropdowns, modals, popovers (white, `--shadow-lg`) |

### 4.6 Segmented Control Redesign

**Current:** 4 equal-width columns with text labels.

**Proposed:**
- Use pill-style buttons with adequate padding
- On mobile, allow horizontal scroll if needed (don't force 2-column)
- Active state: teal background with white text (keep) but add a subtle transition
- Inactive state: transparent background with muted text

---

## Part 5: Mobile-First Improvements

### 5.1 Bottom Navigation (Mobile)

Replace the horizontal top nav with a bottom tab bar on mobile (< 760px):

```
┌─────────────────────────────────────┐
│            [Content Area]           │
│                                     │
├─────────────────────────────────────┤
│  🧳 Trip  │ 💰 Expenses │ 📊 Settle │ 📤 Share │
└─────────────────────────────────────┘
```

**Rationale:** Bottom tabs are the standard mobile navigation pattern. They're reachable with the thumb, visible without scrolling, and don't consume content space.

### 5.2 Sticky Actions

- **Expense form:** Sticky "Save expense" button at the bottom of the viewport on mobile
- **Settle section:** Sticky "Mark paid" action on settlement cards
- **Share section:** Sticky "Copy share link" button

### 5.3 Touch Target Compliance

- All interactive elements: minimum 44×44px
- Avatar: increase from 34px to 40px
- Icon buttons: increase from 40px to 44px
- Checkbox cells: entire cell is tappable, not just the checkbox

### 5.4 Summary Rail on Mobile

**Current:** The summary rail disappears on mobile.

**Proposed:** Show a condensed summary bar below the top nav on mobile:
```
┌─────────────────────────────────────┐
│ Net: Duy +225K · Alvin -375K · ... │  ← tappable, expands to full rail
└─────────────────────────────────────┘
```

Tapping the bar expands it into a bottom sheet showing the full summary rail content.

---

## Part 6: Content Design Improvements

### 6.1 Complete i18n Coverage

**Current:** ~30% of strings are hardcoded English.

**Proposed:** Move all user-facing strings to `translations.ts`. This includes:
- All form labels ("Trip name," "Member name," "Bank," "Account number," etc.)
- All section subtitles
- All error messages
- All empty state messages
- All status labels
- All button labels

### 6.2 Error Message Improvements

| Current | Proposed |
|---------|----------|
| "Member name is required." | "Enter a name for this member." |
| "Duplicate member name." | "A member named '{name}' already exists. Use a different name." |
| "Expense title is required." | "Give this expense a name (e.g., 'Dinner,' 'Taxi')." |
| "Expense amount must be greater than 0." | "Enter an amount greater than 0." |
| "Payer contributions must equal the expense total." | "Payer amounts ({current}) don't match the total ({total}). Adjust to equal {total}." |

### 6.3 Empty States

**Expenses (no expenses yet):**
```
[ReceiptText icon]
No expenses yet
Add your first expense to start splitting.
[Add expense button]
```

**Balances (all settled):**
```
[Check icon]
Everyone is settled
No payments needed — all balances are zero.
```

**Transfers (no transfers):**
```
[Send icon]
No transfers yet
Mark a settlement payment as paid to record a transfer.
```

### 6.4 Helper Text & Tooltips

Add contextual help for:
- **Split methods:** Tooltip or helper text explaining each method
  - Equal: "Split the total equally among all participants"
  - Exact: "Enter the exact amount for each participant"
  - Percentage: "Enter the percentage each participant pays"
  - Shares: "Enter relative weights (e.g., 2:1 means one person pays twice as much)"
- **Settlement modes:**
  - Simplified: "Minimizes the number of transfers needed"
  - Direct payback: "Each person pays back exactly who they owe"

### 6.5 Vietnamese Copy with Diacritics

**Current:** ASCII-only Vietnamese (`Chuyen di` instead of `Chuyến đi`).

**Proposed:** Use proper Vietnamese diacritics. This is a Vietnamese-targeted app — ASCII Vietnamese looks unprofessional and is harder to read.

| Current (ASCII) | Proposed (Diacritics) |
|-----------------|----------------------|
| Chuyen di & Thanh vien | Chuyến đi & Thành viên |
| Chi phi & Cach chia | Chi phí & Cách chia |
| So du & Quyet toan | Số dư & Quyết toán |
| Chia se & Thanh toan | Chia sẻ & Thanh toán |
| Quan ly chuyen di va thanh vien | Quản lý chuyến đi và thành viên |
| Them thanh vien | Thêm thành viên |
| Luu khoan chi | Lưu khoản chi |
| Xem cong thuc | Xem công thức |
| Rut gon | Rút gọn |
| Tra ve nguoi da tra | Trả về người đã trả |
| Danh dau da tra | Đánh dấu đã trả |
| Xuat JSON / Xuat CSV | Xuất JSON / Xuất CSV |
| Nhap JSON | Nhập JSON |
| In tong ket | In tổng kết |
| Copy link chia se | Copy link chia sẻ |

---

## Part 7: Implementation Architecture

### 7.1 File Structure

Extract `App.tsx` into a modular structure:

```
src/
  App.tsx                          # Shell: layout, routing, top-level state (~100 lines)
  styles.css                       # Global tokens, resets, layout grid
  components/
    layout/
      Sidebar.tsx                  # Desktop sidebar + mobile bottom nav
      Topbar.tsx                   # Trip picker, language toggle
      SummaryRail.tsx              # Right rail (desktop) / bottom sheet (mobile)
      PanelHeader.tsx              # Reusable section header
    shared/
      Avatar.tsx                   # Member initials circle
      SegmentedControl.tsx         # Reusable segmented/toggle control
      FormulaPreview.tsx           # Formula preview box
      ErrorBox.tsx                 # Error message display
      EmptyState.tsx               # Empty state placeholder
      AmountInput.tsx              # Formatted amount input with preview
    members/
      MemberForm.tsx               # Add/edit member form with progressive disclosure
      MemberList.tsx               # Member list with archive toggle
      PaymentDetailsAccordion.tsx  # Collapsible bank/QR fields
    expenses/
      ExpenseForm.tsx              # Card-based expense form
      ExpenseList.tsx              # Expense list with category icons
      PayerRow.tsx                 # Single payer row component
      ParticipantGrid.tsx          # Participant checkbox grid
      SplitDetailsTable.tsx        # Split method input table
    balances/
      BalanceCards.tsx             # Card-based balance display
      BalanceTable.tsx             # Full balance table (expandable)
      SettlementList.tsx           # Settlement payment cards
      SettlementCard.tsx           # Single settlement card with bank/QR
      TransferTimeline.tsx         # Transfer history timeline
    sharing/
      ActionGrid.tsx               # Export/import/print/share buttons
      PaymentProfiles.tsx          # Member payment profile list
      ShareLinkConfirm.tsx         # Share link with privacy warning
  hooks/
    useTripStore.ts                # Store state + persistence logic
    useActiveTrip.ts               # Active trip derived state
    useCalculations.ts             # Memoized calculation results
    useExpenseForm.ts              # Expense form state machine
    useMemberForm.ts               # Member form state machine
  domain/                          # (keep as-is — already well-structured)
    types.ts
    money.ts
    split.ts
    calculations.ts
    calculations.test.ts
  i18n/
    translations.ts                # (expand with all missing keys)
  payment/
    qr.ts
  persistence/
    local-storage.ts
    import-export.ts
    import-export.test.ts
```

### 7.2 State Management

**Current:** All state in `App` component with `useState`.

**Proposed:** Extract into custom hooks:

```typescript
// useTripStore.ts — replaces the raw useState in App
function useTripStore() {
  const [store, setStore] = useState<TripStore>(createInitialStore);
  // ... persistence, trip switching, etc.
  return { store, activeTrip, setActiveTrip, updateActiveTrip, addTrip };
}

// useCalculations.ts — replaces the useMemo in App
function useCalculations(trip: Trip) {
  return useMemo(() => calculateTrip(trip), [trip]);
}

// useExpenseForm.ts — replaces the draft state in App
function useExpenseForm(trip: Trip) {
  const [draft, setDraft] = useState(() => createExpenseDraft(trip));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  // ... save, edit, cancel, delete logic
  return { draft, setDraft, editingId, error, save, startEdit, cancel, remove };
}
```

**No new dependencies needed.** React hooks are sufficient for this scale.

### 7.3 Implementation Phases

**Phase 1 — Foundation (no visual changes):**
1. Extract `App.tsx` into component files
2. Extract state into custom hooks
3. Move all hardcoded strings to `translations.ts`
4. Add Vietnamese diacritics
5. Verify all existing tests pass
6. Verify all E2E tests pass

**Phase 2 — Design system:**
1. Update CSS custom properties (colors, spacing, typography, shadows, radii)
2. Implement new component tokens
3. Update button styles (blue primary, keep red for danger)
4. Update avatar sizes, input heights, touch targets
5. Add card styles with shadows for elevation

**Phase 3 — Layout & navigation:**
1. Redesign topbar (trip name editable, trip picker)
2. Implement bottom tab bar for mobile
3. Redesign sidebar for desktop
4. Add summary rail bottom sheet for mobile
5. Remove QA section from main nav

**Phase 4 — Expense form redesign:**
1. Implement card-based form grouping
2. Redesign amount input (large, formatted preview)
3. Redesign payer rows (proper delete icons)
4. Redesign participant grid (3-column desktop, 2-column mobile)
5. Add "Select all / Clear all" for participants
6. Move formula preview to sticky bottom bar
7. Add category icons to expense list

**Phase 5 — Balances & settlement redesign:**
1. Implement card-based balance display
2. Add expandable detail rows
3. Redesign settlement cards with bank/QR info
4. Add helper text for settlement modes
5. Implement transfer timeline

**Phase 6 — Share section & polish:**
1. Regroup share actions by intent
2. Add share link confirmation with privacy warning
3. Implement empty states for all sections
4. Implement error message improvements
5. Add contextual help/tooltips
6. Final responsive testing

### 7.4 Testing Strategy

- **Phase 1:** All existing unit + E2E tests must pass unchanged (refactoring only)
- **Phase 2–3:** Add component tests for extracted components (MemberForm, ExpenseForm, BalanceCards, SettlementCard)
- **Phase 4–5:** Update E2E tests for new UI structure (selectors may change)
- **Phase 6:** Add E2E tests for empty states, error states, mobile navigation

---

## Part 8: Summary of Changes

| Dimension | Current | Proposed |
|-----------|---------|----------|
| Sections | 5 (including QA) | 4 (Trip, Expenses, Settle, Share) |
| Primary button color | Red | Blue |
| Expense form | 10-field vertical stack | 4 card-based groups |
| Balance display | 6-column table | Card-based with expandable detail |
| Mobile nav | Horizontal top tabs | Bottom tab bar |
| Mobile summary | Hidden | Bottom sheet |
| Avatar size | 34px | 40px |
| Input/button height | 42px | 44px |
| Typography scale | 2 sizes (13px, 22px) | 6 sizes (12–24px) |
| Elevation | Flat (1px borders) | 3-level shadow system |
| i18n coverage | ~70% | 100% |
| Vietnamese | ASCII | Diacritics |
| Empty states | None | All sections |
| Error messages | Generic | Contextual with guidance |
| Split method help | None | Tooltips/helper text |
| File structure | 1 file (1581 lines) | ~20 component files + hooks |
| State management | useState in App | Custom hooks |

---

## Appendix: Screenshot-to-Proposal Mapping

| Screenshot | Key Issues Found | Proposal Section |
|------------|-----------------|-----------------|
| 01-expenses-default | Form sprawl, red CTA, buried formula preview | §3.2, §4.1 |
| 02–04 split variants | Segmented control cramped, split table below fold | §3.2, §4.6 |
| 05-multiple-payers | Index-number delete button | §3.2 |
| 06-edit-existing | No visual distinction between add/edit mode | §3.2 |
| 07-validation-error | Generic error message | §6.2 |
| 08-members-default | Trip name mixed with member form, long form | §3.1 |
| 09–10 member edit/QR | All fields visible at once | §3.1 |
| 11-archived | Text toggle for active/archived | §3.1 |
| 13–15 balances | Dense table, no mobile-friendly layout | §3.3 |
| 16–19 sharing | Flat action grid, small QR | §3.4 |
| 21–22 QA | Dev-only section in main nav | §3.5 |
| 23 new trip empty | No empty state guidance | §6.3 |
| 24 shared link | Works well, keep | — |
| 25–29 Vietnamese | ASCII-only diacritics | §6.5 |
