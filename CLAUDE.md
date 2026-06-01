# CLAUDE.md — Trip Split Bill

## Project Overview

A browser-only, no-database trip expense splitting web app. Handles mixed/multiple payers, 4 split methods (equal/exact/percentage/shares), transfers, bilingual EN/VN UI, payment QR codes, and shareable settlement output. Pure client-side SPA — no server, no login, no backend.

**Target users:** Trip hosts (create/manage trips) and trip members (review shared summaries, transfer money).

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite 7 |
| Language | TypeScript 5.9 (strict mode, `noUnusedLocals`, `noUnusedParameters`) |
| Styling | Single global CSS file with custom properties (no Tailwind, no CSS modules) |
| Icons | lucide-react |
| QR | qrcode (client-side generation) |
| State | React useState in App.tsx (no Redux/Zustand) |
| Persistence | localStorage (`split-bill:v1:trips`) |
| i18n | Simple dictionary in `src/i18n/translations.ts` (34 keys, `en` + `vi`) |
| Unit tests | Vitest 4 + @testing-library/react + jsdom |
| E2E tests | Playwright 1.57 (Chromium desktop + Pixel 7 mobile) |
| Package manager | pnpm |

## Commands

```bash
pnpm dev          # Dev server at http://127.0.0.1:5173
pnpm build        # tsc -b && vite build
pnpm test         # vitest run (11 unit tests)
pnpm test:e2e     # playwright test (12 E2E: 6 desktop + 6 mobile)
```

## Architecture

```
src/
  App.tsx                          # Shell: layout, state, handlers (~370 lines)
  styles.css                       # Global design system CSS (~1370 lines)
  main.tsx                         # React entry point
  domain/                          # Pure functions, no React deps
    types.ts                       # All TypeScript types/interfaces
    money.ts                       # formatMoney() via Intl.NumberFormat
    split.ts                       # calculateExpenseShares() — 4 split methods
    calculations.ts                # calculateTrip() — balances + settlement engine
    calculations.test.ts           # Unit tests for domain logic
  components/
    shared/                        # Avatar, PanelHeader, EmptyState
    layout/                        # SummaryRail (desktop right rail)
    members/                       # MembersSection + MemberForm type + uploadMemberQr
    expenses/                      # ExpensesSection + all draft types + helpers
    balances/                      # BalancesSection, BalancesTable, SettlementList, PaymentCard
    sharing/                       # SharingSection, QaSection
  i18n/translations.ts             # EN/VN dictionaries + t() function
  payment/qr.ts                    # QR code generation
  persistence/
    local-storage.ts               # localStorage load/save
    import-export.ts               # JSON/CSV export, JSON import with validation
    import-export.test.ts          # Unit tests
  app/sample-data.ts               # Default "Da Nang 3N2D" trip
  test/setup.ts                    # Vitest setup (jest-dom matchers)
e2e/app.spec.ts                    # 6 Playwright E2E tests
docs/                              # 12 markdown docs (PRD, design, architecture, etc.)
```

## Data Model

All money is **integer minor units** (1 = 1 VND, no decimals). No floating point.

```
Trip
  id, name, currency ("VND"), language ("en"|"vi")
  members: Member[]
    id, name, active (boolean), payment?: PaymentInfo
      PaymentInfo: bankName, bankCode, accountNumber, accountHolder, transferNoteTemplate, qrImageDataUrl
  expenses: Expense[]
    id, title, amountMinor, splitMethod, category, date, note, payers[], participants[]
    payers: PayerContribution[] { memberId, amountMinor }
    participants: ParticipantShare[] { memberId, exactAmountMinor?, percentage?, shares? }
  transfers: Transfer[]
    id, fromMemberId, toMemberId, amountMinor, date, note, status ("pending"|"paid")

Computed (not stored):
  MemberBalance: totalPaid, totalOwed, transferPaid, transferReceived, balance
  SettlementPayment: fromMemberId, toMemberId, amountMinor
```

**Split methods:** `equal` (1 weight each, remainder by index), `exact` (sum must equal total), `percentage` (must total 100%), `shares` (positive weights, proportional).

**Settlement modes:** `simplified` (greedy debtor-creditor matching, fewest transfers), `direct` (per-expense payer-to-participant debts, netted).

## Key Design Decisions

- **No routing library.** Navigation is a `Section` state variable (`"members"|"expenses"|"balances"|"sharing"|"qa"`) with conditional rendering.
- **Single-file state.** All state in `App.tsx` with `useState`. `updateActiveTrip(updater)` provides immutable updates.
- **Share URLs.** Trip JSON is base64-encoded in `?trip=` query param. Decoded on init.
- **Payer is never auto-assumed to be a participant.** Explicit checkbox selection required.
- **Multiple payers supported.** Contributions must sum to expense total.
- **Formula preview updates before save.** Trust-building UX pattern.
- **No confirmation dialogs** for destructive actions (delete expense, archive member).

## Navigation (Post-Redesign)

4 main sections (QA removed from nav):
1. **Trip** — members, payment profiles, trip settings
2. **Expenses** — add/edit expenses, expense list with category icons
3. **Settle** — balance cards, settlement, transfers
4. **Share** — export/import, share link, payment profiles

Desktop: 292px sidebar + workspace. Mobile (<760px): bottom tab bar, sidebar hidden.

## CSS Design System Tokens

```css
--color-primary: #087f7b    /* teal — brand, active nav, positive balance */
--color-action: #2563eb     /* blue — primary buttons, CTAs */
--color-danger: #ef5d54     /* red — delete, error, negative balance */
--color-success: #20a064    /* green — paid status */
--color-warning: #f59e0b    /* amber — privacy notices */
--space-1 through --space-8 /* 4px base grid */
--text-xs: 12px ... --text-xl: 24px
--radius-sm: 6px, --radius-md: 10px, --radius-lg: 14px
--shadow-sm/md/lg           /* elevation system */
--input-height: 44px        /* touch target compliant */
--avatar-md: 40px           /* up from 34px */
```

## Responsive Breakpoints

- **1120px:** Sidebar collapses to horizontal nav, content grid goes single column
- **760px:** Sidebar hidden, bottom nav appears, summary rail hidden, participant grid 2-col

## i18n Notes

- 34 keys in `translations.ts`. ~30% of strings still hardcoded in components (form labels, error messages, subtitles).
- Vietnamese uses proper diacritics (`Chuyến đi`, not `Chuyen di`).
- Currency formatted via `Intl.NumberFormat` with locale-aware formatting.

## Testing

- **11 unit tests** cover: money formatting, all 4 split methods, balance calculations, transfers, settlement algorithms, JSON round-trip, CSV export, validation.
- **12 E2E tests** cover: section navigation, expense CRUD, member bank edit, QR upload, share link loading. Runs on both desktop and mobile viewports.
- **No component tests yet.** React Testing Library is installed but unused.
- E2E helper `clickNav(page, text)` handles both desktop sidebar and mobile bottom nav.

## Out of Scope

- No server, no database, no authentication
- No real payment processing
- No multi-currency (VND only)
- No recurring expenses or templates
- No undo/redo
- No dark mode
- No CI/CD pipeline configured
