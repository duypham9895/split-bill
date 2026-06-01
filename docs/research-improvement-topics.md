# Improvement Research: 11 Topics Deep Dive

**Date:** 2026-06-01
**Purpose:** Research all potential improvement areas for Trip Split Bill to inform product roadmap decisions.

---

## Table of Contents

1. [Client-side VietQR EMV Generation](#1-client-side-vietqr-emv-generation)
2. [Settlement Algorithm Optimization](#2-settlement-algorithm-optimization)
3. [Expense Category UX Patterns](#3-expense-category-ux-patterns)
4. [Messaging-App Sharing (Zalo, Messenger)](#4-messaging-app-sharing)
5. [PWA Implementation](#5-pwa-implementation)
6. [Touch-First Mobile Expense Entry](#6-touch-first-mobile-expense-entry)
7. [Component Testing Strategy](#7-component-testing-strategy)
8. [Visual Regression Testing](#8-visual-regression-testing)
9. [Zalo/Messenger Integration Patterns](#9-zalomessenger-integration-patterns)
10. [Vietnamese Banking Deep Links](#10-vietnamese-banking-deep-links)
11. [Read-Only Shared Summary HTML](#11-read-only-shared-summary-html)

---

## 1. Client-side VietQR EMV Generation

**Status:** Research incomplete (agent stalled). Findings from earlier research:

### Current State
The app uses `vietqr.io` image API (`https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.jpg`) which requires internet.

### EMVCo QR Specification
VietQR is based on EMVCo Merchant Presented Mode (MPM):
- **TLV format:** `[2-digit Tag][2-digit Length][Value]`
- **Key fields:**
  - ID 00: PayloadFormatIndicator ("01")
  - ID 01: PointOfInitiationMethod ("11" static, "12" dynamic)
  - ID 38: MerchantAccountInformation (VietQR template)
    - Sub-ID 00: GloballyUniqueIdentifier ("A000000727")
    - Sub-ID 01: Bank BIN (e.g., "970436")
    - Sub-ID 02: Account Number
  - ID 53: TransactionCurrency ("704" for VND)
  - ID 54: TransactionAmount
  - ID 58: CountryCode ("VN")
  - ID 62: AdditionalDataFieldTemplate (transfer note)
  - ID 63: CRC-16/CCITT-FALSE checksum

### Implementation Approach
1. Build TLV payload string from member bank details + payment amount
2. Compute CRC-16/CCITT-FALSE over the payload
3. Generate QR image using existing `qrcode` npm package
4. No external API needed — works fully offline

### Recommendation
**Implement client-side EMV generation.** This removes the internet dependency for QR generation and makes the app fully offline-capable. The `qrcode` package is already installed.

---

## 2. Settlement Algorithm Optimization

**Status:** Complete

### Current Implementation
Greedy algorithm in `src/domain/calculations.ts`:
1. Compute net balances (positive = owed, negative = owes)
2. Match debtors with creditors in array order
3. Settle min(remaining), repeat

### Key Findings

| Approach | Time | Min Transactions? | Preserves Relationships? |
|----------|------|-------------------|-------------------------|
| Greedy (current) | O(V) | No | No |
| Greedy (largest-first) | O(V log V) | Near-optimal | No |
| Max-flow (Dinic's) | O(V²E) | Yes | No |
| Exact (preserve relations) | NP-hard | Yes | Yes |

**Splitwise's three rules:**
1. Net amounts unchanged ✅ (we respect this)
2. No new debt relationships ❌ (we break this, like Splitwise)
3. No one pays more than originally owed ✅ (we respect this)

**Breaking rule #2 is fine** — users care about settling with minimum hassle, not about whether they pay someone they didn't directly share an expense with.

### Bug Found
Current implementation iterates debtors/creditors in **array order** (member list order), not sorted by amount. This can produce suboptimal results.

### Recommendation
**Sort debtors and creditors by descending amount before matching.** This is a 3-line change:

```typescript
// In createSimplifiedSettlement:
const debtors = balances
  .filter((balance) => balance.balance < 0)
  .map((balance) => ({ memberId: balance.memberId, remaining: Math.abs(balance.balance) }))
  .sort((a, b) => b.remaining - a.remaining); // ADD THIS LINE

const creditors = balances
  .filter((balance) => balance.balance > 0)
  .map((balance) => ({ memberId: balance.memberId, remaining: balance.balance }))
  .sort((a, b) => b.remaining - a.remaining); // ADD THIS LINE
```

**Do NOT implement max-flow** — overkill for groups of 2-20 people.

---

## 3. Expense Category UX Patterns

**Status:** Complete

### Current State
Free-text input field for categories. The app maps categories to Lucide icons via keyword matching (`categoryIcon()` function).

### How Competitors Handle It
- **Splitwise:** 7 parent categories, 33 subcategories (overkill for trip splitting)
- **Tricount:** No formal categories — free-text descriptions
- **Splid:** Simple predefined list with icons

### Recommendation: Structured Icon Grid with 7 Categories

| Category | Icon | EN | VN | Keywords |
|----------|------|----|----|----------|
| `food` | Utensils | Food & Drink | Ăn uống | food, dinner, lunch, breakfast, restaurant, cafe, seafood |
| `transport` | Car | Transport | Di chuyển | taxi, grab, bus, flight, train, car, gas, motorbike |
| `lodging` | Hotel | Lodging | Lưu trú | hotel, room, hostel, airbnb, resort, villa, homestay |
| `activities` | Ticket | Activities | Hoạt động | ticket, tour, activity, entertainment, beach, diving |
| `shopping` | ShoppingBag | Shopping | Mua sắm | shopping, gift, souvenir, clothes, market |
| `utilities` | Zap | Utilities | Tiện ích | electricity, water, wifi, cleaning, laundry, phone |
| `other` | ReceiptText | Other | Khác | (fallback) |

### Implementation
- Replace free-text `<input>` with scrollable pill chips
- Auto-suggest category from title keywords
- Add `ExpenseCategory` type to `types.ts`
- ~200 lines of code, 1-2 hours

---

## 4. Messaging-App Sharing

**Status:** Research incomplete (429 rate limit). Combined with Zalo/Messenger research below.

See [Section 9: Zalo/Messenger Integration Patterns](#9-zalomessenger-integration-patterns).

---

## 5. PWA Implementation

**Status:** Complete

### Key Findings

| Aspect | Finding |
|--------|---------|
| **Minimum manifest** | name, start_url, display, icons (192x192 + 512x512), theme_color |
| **Service worker** | Required for install prompt. Cache-first strategy for static assets |
| **localStorage benefit** | Indirect — instant loading on revisit (SW serves cached HTML/JS/CSS) |
| **iOS behavior** | Ignores manifest icons — needs `<link rel="apple-touch-icon">` |
| **Share URLs** | Won't open in installed PWA on iOS (Apple limitation) |
| **Competitors** | None of Splitwise/Tricount/Splid offer PWA — differentiator |

### Implementation Plan
1. Install `vite-plugin-pwa` (~5 config lines)
2. Create icon assets (192x192, 512x512, maskable variants, apple-touch-icon 180x180)
3. Configure in `vite.config.ts` with `registerType: 'autoUpdate'`
4. Add `theme-color` meta + `apple-touch-icon` link to `index.html`

### What You Get
- Android: install prompt, home screen icon, splash screen, standalone mode, instant cold start
- iOS: manual "Add to Home Screen" with proper icon, standalone mode
- Desktop Chrome: install prompt in address bar

### What You Don't Get (without backend)
- `url_handlers` for share links opening in PWA
- `share_target` (receiving shares from other apps)
- Push notifications

---

## 6. Touch-First Mobile Expense Entry

**Status:** Complete

### Key Findings

| Finding | Detail |
|---------|--------|
| **Amount-first entry** | All major financial apps (Venmo, Revolut, Wise, Splitwise) lead with amount. Numeric keypad is faster than text keyboard |
| **Smart defaults** | Splitwise defaults: payer = "you", participants = all, split = equal. Achieves ~3 taps for common expense |
| **Bottom sheets** | Good for short selection tasks, NOT for entire forms or stacked multi-step flows |
| **Sticky save bar** | Current implementation is NOT actually sticky (`display: grid`, no `position: fixed`) |
| **Camera scanning** | NOT worth the complexity for a client-only app |

### Recommendation: Collapsible Cards with Smart Defaults
1. **Quick wins (CSS):** Make save bar `position: fixed`, amount field first, empty default amount
2. **Smart defaults (localStorage):** Remember last payer, last split method, last category
3. **Mobile layout:** Collapsible/accordion cards showing collapsed summaries ("Paid by: You", "4 members, equally")
4. **Skip:** Camera scanning, full 3-tap quick-add mode

---

## 7. Component Testing Strategy

**Status:** Research incomplete (429 rate limit). Recommendations based on codebase analysis:

### Highest-Risk Components

| Component | Risk | Why |
|-----------|------|-----|
| `ExpensesSection` | High | Complex form with 4 cards, payer rows, participant grid, split method, formula preview |
| `BalancesSection` | Medium | Balance cards, settlement mode toggle, settlement list |
| `MembersSection` | Medium | Form with 7 fields, member list with edit/archive |
| `SharingSection` | Low | Action buttons, payment profiles |

### Recommended Test Cases (Priority Order)
1. **Expense form validation** — empty title, zero amount, payer total mismatch
2. **Formula preview** — updates in real-time as user types
3. **Participant grid** — checkbox selection, select all/clear all
4. **Split method switching** — equal/exact/percentage/shares
5. **Settlement mode toggle** — simplified vs. direct payback
6. **Member form** — add/edit/archive, payment details

### Approach
- Use React Testing Library (already installed)
- Test behavior, not implementation
- Co-locate test files (`*.test.tsx` next to components)
- Mock the calculation engine for component tests

---

## 8. Visual Regression Testing

**Status:** Complete

### Recommendation: Playwright Built-in `toHaveScreenshot`

| Factor | Playwright Built-in | Chromatic/Percy |
|--------|-------------------|-----------------|
| Cost | Free | $149+/mo |
| Setup effort | Minimal (1 line per assertion) | Medium |
| Baseline management | Manual (commit PNGs) | Cloud UI |

### Screenshot Targets (Priority Order)

**P0 — Core layout (6 screenshots × 2-3 viewports):**
1. Expenses default state (3 sample expenses)
2. Expenses empty state
3. Trip members (4 members with payment info)
4. Settle balances
5. Share section
6. Expenses add form

**P1 — Edge cases (4 screenshots):**
7. Edit expense form (pre-filled)
8. Settle after recording transfer
9. Edit member payment form
10. Share link section

### Config
```ts
// playwright.config.ts
expect: {
  toHaveScreenshot: {
    threshold: 0.3,
    maxDiffPixelRatio: 0.01,
    animations: "disabled",
  },
},
```

### Implementation
- ~2 hours initial setup
- Add `tablet-chrome` project (1120x900 viewport)
- Create `e2e/visual.spec.ts` with `@visual` tagged tests
- Commit snapshot PNGs to git

---

## 9. Zalo/Messenger Integration Patterns

**Status:** Complete

### Vietnamese Messaging Landscape

| Platform | Users | Primary Use |
|----------|-------|-------------|
| Zalo | 75M+ | Family, friends, work coordination (dominant) |
| Messenger | 55.9M | Social, younger users, international |
| iMessage | 10-15M | iPhone users, high-income segment |

### Client-Side Sharing Approaches

| Integration | Feasible? | Complexity | Recommendation |
|-------------|-----------|------------|----------------|
| Zalo share URL | ✅ Yes | Low | Implement |
| Messenger share URL | ✅ Yes | Low | Implement |
| Web Share API | ✅ Yes | Low | Implement (primary) |
| Zalo OA API | ❌ No (needs backend) | High | Skip |
| Momo payment link | ❌ No (needs merchant API) | High | Use VietQR |
| ZaloPay payment link | ❌ No (needs merchant API) | High | Use VietQR |

### Implementation
```typescript
// Zalo share
function shareToZalo(url: string, text: string) {
  window.open(`https://zalo.me/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
}

// Messenger share
function shareToMessenger(url: string) {
  window.open(`https://www.facebook.com/dialog/share?display=popup&href=${encodeURIComponent(url)}`);
}

// Web Share API (mobile primary)
async function shareTrip(url: string, title: string, text: string) {
  if (navigator.share) {
    await navigator.share({ title, text, url });
  }
}
```

### OG Tags
- Zalo/Messenger read standard OG tags for link previews
- Can't serve dynamic OG tags without a server
- Use static OG tags in `index.html` with a good default preview image
- Trip data is in `?trip=` query param (crawlers won't execute JS)

---

## 10. Vietnamese Banking Deep Links

**Status:** Complete

### Key Finding
Only **4 of 37** Vietnamese banking apps support auto-fill via deep links:
- ✅ ACB, BIDV, VietinBank, OCB — auto-fill recipient/amount/note
- ❌ Vietcombank, Techcombank, MBBank, VPBank, TPBank — open app but no pre-fill

### VietQR Deep Link Format
```
https://dl.vietqr.io/pay?app={appId}&ba={account}@{bank}&am={amount}&tn={note}&bn={name}
```

### Recommendation
**Hybrid approach:**
1. **Primary:** Show QR code (universal, always works)
2. **Secondary:** Offer "Open in Banking App" button (works for 4 banks with autofill, opens app for others)
3. **Fallback:** If app not installed, show QR + "Install App" link

**Always include all parameters in deep links** — when banks add support, the app will automatically benefit.

---

## 11. Read-Only Shared Summary HTML

**Status:** Complete

### Recommendation: Self-Contained HTML File

| Aspect | Decision |
|--------|----------|
| **Format** | Pre-rendered HTML via template literal, downloaded as Blob |
| **CSS** | Inline `<style>` (~150 lines, subset of design tokens) |
| **Fonts** | System font stack (Inter on Apple, system-ui elsewhere) |
| **QR images** | Pre-resolved to `data:` URLs (1.5-15 KB each) |
| **Offline** | Zero network calls in the final HTML |
| **Print CSS** | `@media print` with `break-inside: avoid`, `@page { size: A4 }` |
| **File size** | Typical trip: 30-100 KB. Worst case: 300 KB |
| **PDF** | Defer — browser "Save as PDF" is sufficient |
| **Security** | Bank details hidden behind `<details>` toggle by default |

### Content Structure
1. Header (trip name, date range, member count)
2. Member payment profiles (privacy-toggled)
3. Expenses table with formulas
4. Balance cards (color-coded)
5. Settlement instructions with bank details + QR codes
6. Transfer timeline
7. Footer (generation date, privacy warning)

### New Files
- `src/export/generate-html.ts` — async orchestrator
- `src/export/html-template.ts` — HTML string builder
- `src/export/inline-styles.ts` — CSS subset

---

## Priority Matrix

| Improvement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Settlement algorithm fix (sort descending) | Medium | 5 min | 🔴 Do now |
| Smart defaults for expense form | High | 30 min | 🔴 Do now |
| Sticky save bar on mobile | Medium | 10 min | 🔴 Do now |
| PWA implementation | High | 1-2 hrs | 🟡 Next |
| Structured category selector | Medium | 1-2 hrs | 🟡 Next |
| Zalo/Messenger share buttons | High | 1 hr | 🟡 Next |
| Web Share API | High | 30 min | 🟡 Next |
| Read-only HTML export | Medium | 2-3 hrs | 🟡 Next |
| Client-side VietQR EMV | Medium | 2-3 hrs | 🟡 Next |
| Banking deep links | Low | 1 hr | 🟢 Later |
| Component tests | High | 3-4 hrs | 🟢 Later |
| Visual regression tests | Medium | 2-3 hrs | 🟢 Later |
| Collapsible cards (mobile) | Medium | 2-3 hrs | 🟢 Later |

---

## Quick Wins (Implementable in < 1 hour)

1. **Settlement sort** — 3-line fix in `calculations.ts`
2. **Sticky save bar** — Add `position: fixed` to `.stickyActionBar`
3. **Smart defaults** — Store last payer/split/category in localStorage
4. **Web Share API** — Add `navigator.share()` with fallback buttons
5. **Zalo/Messenger share buttons** — Two `window.open()` calls
