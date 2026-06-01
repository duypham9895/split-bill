# UI/UX Redesign Brief — Trip Split Bill

> **Date:** 2026-06-01
> **Research scope:** Splitwise, Tricount, Settle Up, 2024-2026 fintech design trends, current app gap analysis
> **Goal:** Comprehensive redesign brief to transform Trip Split Bill into a modern, polished expense-splitting experience

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Competitive Landscape](#2-competitive-landscape)
3. [Current App Audit](#3-current-app-audit)
4. [Design Direction](#4-design-direction)
5. [Information Architecture](#5-information-architecture)
6. [Visual Design System](#6-visual-design-system)
7. [Key Screen Redesigns](#7-key-screen-redesigns)
8. [Interaction Patterns](#8-interaction-patterns)
9. [Responsive Strategy](#9-responsive-strategy)
10. [Dark Mode](#10-dark-mode)
11. [Accessibility](#11-accessibility)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Executive Summary

### What we learned

| Platform | Key Insight |
|----------|-------------|
| **Splitwise** | Debt simplification algorithm is the killer feature. Three-value expense model (`paid_share`, `owed_share`, `net_balance`) enables all split methods cleanly. 2019 redesign moved to saturated jewel tones and surfaced all fields directly (no hidden menus). |
| **Tricount** | Link-based sharing (no app install) dramatically lowers barrier. Amount-first design. Built-in calculator avoids app-switching. Casual, friendly tone reduces money anxiety. |
| **Settle Up** | Offline-first works in remote travel. "Who pays next" clarity. Swipe-between-groups gesture. 16 languages. |
| **Design Trends** | OKLCH colors, fluid typography, layered shadows, bento grids, dark mode via CSS custom properties, skeleton loading, pill-style controls. |

### Core design principles for the redesign

1. **Amount-first** — the number is the hero, always
2. **Progressive disclosure** — show what matters, hide what doesn't
3. **Trust through transparency** — formula preview, inline validation, clear balances
4. **Speed** — add an expense in < 10 seconds for the common case
5. **Delight** — subtle animations, polished micro-interactions, modern aesthetics

---

## 2. Competitive Landscape

### Feature Comparison

| Feature | Splitwise | Tricount | Settle Up | **Trip Split Bill** |
|---------|-----------|----------|-----------|---------------------|
| Price | Free + Pro ($X/mo) | Free core | Free + sub ($1-11/mo) | **Free (no backend)** |
| Offline | Limited | ✅ Full | ✅ Full | **✅ Full (localStorage)** |
| Link sharing | ✅ | ✅ (no install) | ❌ | **✅ (base64 URL)** |
| Debt simplification | ✅ | ✅ | ✅ | **✅ (greedy algorithm)** |
| Split methods | 5 | 3 | 2 | **4** |
| Multiple payers | ❌ | ❌ | ❌ | **✅** |
| Receipt photos | Pro only | ✅ | ❌ | **Data model exists, UI missing** |
| Multi-currency | ✅ (Pro auto-convert) | ❌ | ✅ | **❌ (VND only)** |
| Dark mode | ✅ (2026) | ❌ | ❌ | **❌** |
| QR payment | ❌ | ❌ | ❌ | **✅ (VietQR)** |
| Print/export | CSV | CSV | CSV | **✅ JSON/CSV/Print** |

### Our differentiators (keep & amplify)

- **Multiple payers** — no competitor supports this
- **VietQR integration** — unique for Vietnamese market
- **No backend** — zero friction, instant setup
- **4 split methods** with formula preview
- **Print-friendly** settlement summary

### Our gaps (fix)

- No dark mode
- No receipt photos (data model exists, UI missing)
- Category is free-text (not standardized)
- Amount input pre-filled with "300000"
- No delete confirmation
- SummaryRail hidden on mobile
- Emoji in form card headers

---

## 3. Current App Audit

### Strengths (keep)

| Area | What's Working |
|------|----------------|
| Design tokens | Well-structured CSS custom properties with 4px grid, semantic naming |
| Expense form | Card-based grouping (What/Who paid/Who shared/Split), formula preview in sticky bar |
| Balance cards | Color-coded left borders (teal=receive, red=pay, green=settled) |
| Transfer timeline | Vertical timeline with dots and connecting lines |
| Category icons | Lucide icon mapping by category text |
| i18n | Proper Vietnamese diacritics, 34 keys |
| Mobile nav | Bottom tab bar with safe-area-inset support |
| Print stylesheet | Hides chrome, shows only share summary |

### Weaknesses (fix by priority)

**P0 — Critical**
| Issue | Location | Fix |
|-------|----------|-----|
| Amount pre-filled "300000" | `ExpensesSection.tsx:35` | Default to `""` |
| No delete confirmation | `App.tsx:325-333` | Add `window.confirm()` or inline confirmation |
| Import overwrites without confirmation | `App.tsx:372-395` | Preview dialog before replacing |
| Missing `:focus-visible` for buttons | `styles.css` | Add `button:focus-visible { outline: 2px solid }` |
| SummaryRail hidden on mobile | `styles.css:1370-1372` | Collapsible bottom sheet |

**P1 — High**
| Issue | Location | Fix |
|-------|----------|-----|
| Category is free-text | `ExpensesSection.tsx:278-283` | `<select>` with standardized categories |
| No inline payer validation | `ExpensesSection.tsx:323-372` | Running total vs. expense amount |
| Emoji in form headers | `ExpensesSection.tsx:319,399,457` | Replace with Lucide icons |
| Trip name buried in members | `MembersSection.tsx:71-76` | Move to topbar |
| Duplicate `getMemberName` | 3 files | Extract to shared utility |
| No `aria-current` on active nav | `App.tsx:414-426` | Add `aria-current="page"` |
| Share URL length risk | `App.tsx:365-369` | LZ-string compression or warning |
| Default landing on expenses with 0 members | `App.tsx:159` | Smart default based on member count |

**P2 — Medium**
| Issue | Fix |
|-------|-----|
| No elevation differentiation | Apply `--shadow-md` to form cards, `--shadow-lg` to dropdowns |
| Flat typography hierarchy | Increase panelHeader to 28-30px, keep 24px for amounts only |
| Segmented control shares color with positive balances | Use different active color |
| No undo for destructive actions | Toast with undo button (5s window) |
| QR loading state missing | Skeleton while generating |
| Unused receipt image field | Implement upload or remove from type |
| No date range filter | Date picker above expense list |
| Amount input has no thousand separators | Format on onChange |

---

## 4. Design Direction

### Mood Board

**Visual personality:** Modern, clean, trustworthy, slightly playful

- **Splitwise** for information architecture and debt visualization
- **Tricount** for amount-first input and casual tone
- **Revolut/Wise** for card design and micro-interactions
- **Linear** for typography and spacing precision

### Design Principles

```
1. AMOUNT-FIRST    The number is always the visual anchor
2. PROGRESSIVE     Show essentials, reveal detail on demand
3. TRUST           Formula preview, inline validation, clear states
4. SPEED           Common actions in < 10 seconds
5. DELIGHT         Subtle motion, polished details, personality
```

---

## 5. Information Architecture

### Current Navigation (4 sections)

```
Trip → Members, payment profiles, trip settings
Expenses → Add/edit, expense list
Settle → Balance cards, settlement, transfers
Share → Export/import, share link, payment profiles
```

### Proposed Navigation (4 sections, refined)

```
Trip (🏠)     → Trip settings, members, payment profiles
Expenses (💸)  → Add expense, expense list with categories & search
Settle (🤝)   → Balance overview, settlement suggestions, transfers
Share (📤)     → Export, share link, print summary
```

**Changes:**
- Move trip name from Members section to topbar (inline editable)
- Smart default: land on "Expenses" if members exist, "Trip" if empty
- Remove QA section entirely (already hidden from nav)

### Data Flow

```
                    ┌─────────────┐
                    │   Trip      │
                    │  name, lang │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴───┐ ┌─────┴─────┐
        │  Members   │ │Expenses│ │ Transfers │
        │  name, bank│ │ amount │ │  from→to  │
        └─────┬─────┘ │ split  │ └─────┬─────┘
              │        │ payers │       │
              │        └───┬───┘       │
              │            │           │
              └────────────┼───────────┘
                           │
                    ┌──────┴──────┐
                    │  Balances   │  ← computed
                    │  Settlement │
                    └─────────────┘
```

---

## 6. Visual Design System

### 6.1 Color Palette — OKLCH Migration

Migrate from sRGB hex to OKLCH for perceptual uniformity and better gradients.

```css
:root {
  /* Primary — teal (derived from #087f7b) */
  --color-primary: oklch(58% 0.12 175);
  --color-primary-hover: oklch(52% 0.12 175);
  --color-primary-light: oklch(95% 0.03 175);
  --color-primary-bg: oklch(90% 0.05 175);

  /* Action — blue (derived from #2563eb) */
  --color-action: oklch(55% 0.22 265);
  --color-action-hover: oklch(48% 0.22 265);
  --color-action-light: oklch(95% 0.04 265);

  /* Semantic */
  --color-danger: oklch(62% 0.22 25);
  --color-danger-light: oklch(95% 0.04 25);
  --color-danger-text: oklch(55% 0.22 25);
  --color-success: oklch(65% 0.18 155);
  --color-success-light: oklch(95% 0.04 155);
  --color-success-text: oklch(55% 0.18 155);
  --color-warning: oklch(78% 0.16 85);

  /* Neutral — 11-step scale */
  --color-gray-50: oklch(98% 0.003 260);
  --color-gray-100: oklch(96% 0.005 260);
  --color-gray-200: oklch(92% 0.005 260);
  --color-gray-300: oklch(87% 0.006 260);
  --color-gray-400: oklch(70% 0.01 260);
  --color-gray-500: oklch(55% 0.014 260);
  --color-gray-600: oklch(45% 0.014 260);
  --color-gray-700: oklch(37% 0.014 260);
  --color-gray-800: oklch(28% 0.014 260);
  --color-gray-900: oklch(20% 0.014 260);
  --color-gray-950: oklch(14% 0.014 260);
}
```

**Modern gradients (no gray dead zone):**
```css
.gradient-hero {
  background: linear-gradient(135deg in oklch, var(--color-primary), var(--color-action));
}
```

### 6.2 Typography — Fluid Scale

Replace fixed pixel values with viewport-responsive `clamp()`.

```css
:root {
  --text-xs: clamp(0.7rem, 1.2vw, 0.75rem);      /* 11-12px */
  --text-sm: clamp(0.75rem, 1.4vw, 0.8125rem);    /* 12-13px */
  --text-base: clamp(0.8125rem, 1.6vw, 0.875rem); /* 13-14px */
  --text-md: clamp(0.875rem, 1.8vw, 0.9375rem);   /* 14-15px */
  --text-lg: clamp(1rem, 2.2vw, 1.125rem);         /* 16-18px */
  --text-xl: clamp(1.25rem, 3vw, 1.5rem);          /* 20-24px */
  --text-2xl: clamp(1.5rem, 4vw, 2rem);            /* 24-32px */
  --text-3xl: clamp(2rem, 6vw, 2.5rem);            /* 32-40px */

  /* Tighter tracking on headings */
  --tracking-tight: -0.025em;
  --tracking-wide: 0.05em;
}
```

**Font stack:** Inter Variable (already using Inter — upgrade to variable font for fine-grained weight control, especially lighter weights in dark mode).

### 6.3 Spacing — Extended Scale

```css
:root {
  /* Existing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* New */
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Fluid spacing for responsive layouts */
  --space-fluid-1: clamp(0.5rem, 1vw, 1rem);      /* 8-16px */
  --space-fluid-2: clamp(1rem, 2vw, 1.5rem);       /* 16-24px */
  --space-fluid-3: clamp(1.5rem, 3vw, 2rem);       /* 24-32px */
  --space-fluid-4: clamp(2rem, 4vw, 3rem);          /* 32-48px */
}
```

### 6.4 Border Radius — Slightly Larger

```css
:root {
  --radius-xs: 4px;     /* chips, tags */
  --radius-sm: 8px;     /* inputs, buttons (↑ from 6px) */
  --radius-md: 12px;    /* cards, panels (↑ from 10px) */
  --radius-lg: 16px;    /* modals, large cards (↑ from 14px) */
  --radius-xl: 20px;    /* hero cards */
  --radius-full: 9999px; /* pills, avatars */
}
```

### 6.5 Shadows — Layered Multi-Stop

Replace single-layer shadows with richer, layered values.

```css
:root {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06),
               0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07),
               0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08),
               0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08),
               0 8px 10px -6px rgba(0, 0, 0, 0.03);
}
```

**Usage:**
- `--shadow-sm`: panels, cards
- `--shadow-md`: form cards within panels, hover states
- `--shadow-lg`: dropdowns, popovers
- `--shadow-xl`: modals

### 6.6 Easing Functions

```css
:root {
  --ease-elastic: cubic-bezier(0.45, 1.45, 0.65, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}
```

- `--ease-elastic`: buttons, toggles (slight bounce)
- `--ease-spring`: modals appearing
- `--ease-out`: layout transitions, hover lifts

---

## 7. Key Screen Redesigns

### 7.1 Add Expense Form

**Current:** 4 form cards in a scrollable column. Amount pre-filled with 300000.

**Proposed:** Amount-first, progressive disclosure, pill-style split selector.

```
┌─────────────────────────────────────────────┐
│  ✕  New Expense                        Save │
├─────────────────────────────────────────────┤
│                                             │
│              ₫ 0                            │  ← Hero amount input
│         ──────────────                      │     large, centered, no pre-fill
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 🍽  What was this for?              │    │  ← Category + title in one row
│  │ [Select category ▾] [Description]   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 💰 Who paid?                        │    │
│  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐               │    │  ← Avatar row (horizontal scroll)
│  │ │EP│ │AH│ │TN│ │LM│               │    │     tap to select, multi-payer
│  │ └──┘ └──┘ └──┘ └──┘               │    │
│  │                                      │    │
│  │ Payer 1: ₫150,000  Payer 2: ₫150,000│    │  ← Inline amount fields
│  │ Total: ₫300,000  ✓ Matches         │    │  ← Inline validation
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 👥 Split                            │    │
│  │ ┌──────┬────────┬───────┐           │    │  ← Pill-style selector
│  │ │Equal │ Shares │ Exact │           │    │
│  │ └──────┴────────┴───────┘           │    │
│  │                                      │    │
│  │ ┌──┐ EP ₫75,000                    │    │  ← Participant list
│  │ ┌──┐ AH ₫75,000                    │    │
│  │ ┌──┐ TN ₫75,000                    │    │
│  │ ┌──┐ LM ₫75,000                    │    │
│  │                                      │    │
│  │ Select All │ Clear All              │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ₫300,000 ÷ 4 = ₫75,000 each       │    │  ← Sticky formula bar
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Key changes:**
- Amount is the hero — large, centered, no pre-fill
- Category is a `<select>` with standardized options: Food, Transport, Hotel, Activities, Shopping, Drinks, Other
- Payer selection uses avatar row (horizontal scroll)
- Inline validation shows running total vs. expense amount
- Pill-style split method selector (not cramped segmented control)
- Formula bar remains sticky at bottom

### 7.2 Expense List

**Current:** Flat list with 4-column grid items.

**Proposed:** Grouped by date with sticky headers, category icons with colored backgrounds.

```
┌─────────────────────────────────────────────┐
│  🔍 Search expenses...              [Filter]│
├─────────────────────────────────────────────┤
│                                             │
│  TODAY — Jun 1                              │  ← Sticky date header
│  ┌─────────────────────────────────────┐    │
│  │ 🍽  Dinner at seafood restaurant    │    │
│  │     Edward paid · 4 people · Equal  │    │
│  │                         ₫1,200,000  │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ 🚕  Taxi to hotel                   │    │
│  │     Anh paid · 2 people · Exact     │    │
│  │                         ₫150,000    │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  YESTERDAY — May 31                         │  ← Sticky date header
│  ┌─────────────────────────────────────┐    │
│  │ 🏨  Hotel 2 nights                  │    │
│  │     Trang paid · 4 people · Shares  │    │
│  │                         ₫3,000,000  │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

**Key changes:**
- Grouped by date with sticky headers
- Category icons with colored background circles
- Subtitle shows payer name, participant count, split method
- Amount right-aligned, bold
- Hover: subtle lift with shadow increase
- Mobile: swipe left to delete, swipe right to edit

### 7.3 Balance & Settlement View

**Current:** Balance cards with color-coded left borders. Settlement list below.

**Proposed:** Summary stat cards at top, balance cards with progress bars, optimized settlement.

```
┌─────────────────────────────────────────────┐
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Total   │ │ You owe  │ │ Owed to  │   │  ← Stat cards
│  │ ₫4,650K  │ │  ₫450K   │ │  ₫750K   │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ Simplified Settlement (2 transfers)     ││
│  │                                         ││
│  │ ┌──┐ Trang ──────── ₫450,000 ──→ Anh ┌──┐│
│  │ └──┘                     [Mark Paid ✓]└──┘│
│  │                                         ││
│  │ ┌──┐ Linh ──────── ₫300,000 ──→ Edward┌──┐│
│  │ └──┘                     [Mark Paid ✓]└──┘│
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ Member Balances                         ││
│  │                                         ││
│  │ ┌──┐ Edward   +₫300,000  ████████░░ +  ││  ← Balance bar
│  │ └──┘                                    ││
│  │ ┌──┐ Anh      +₫450,000  ██████████ +  ││
│  │ └──┘                                    ││
│  │ ┌──┐ Trang    -₫450,000  ░░░░░░░░░░ -  ││
│  │ └──┘                                    ││
│  │ ┌──┐ Linh     -₫300,000  ██░░░░░░░░ -  ││
│  │ └──┘                                    ││
│  └─────────────────────────────────────────┘│
│                                             │
└─────────────────────────────────────────────┘
```

**Key changes:**
- Summary stat cards at top (total, you owe, owed to you)
- "Simplified Settlement" clearly labeled with transfer count
- Directional arrows show money flow
- "Mark Paid" button inline with each settlement
- Balance bars show relative share of spending
- Color-coded badges: green (+), red (-), neutral (settled)

### 7.4 Trip Settings / Members

**Current:** Trip name input + member form + member list all in one section.

**Proposed:** Trip name moved to topbar. Members section focuses on member management.

```
┌─────────────────────────────────────────────┐
│  ← Da Nang 3N2D ✏️          [Share] [Menu] │  ← Trip name in topbar
├─────────────────────────────────────────────┤
│                                             │
│  Members (4)                    [+ Add]     │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ┌──┐ Edward Pham                   │    │
│  │ │EP│ VCB · ****1234                │    │
│  │ └──┘ Balance: +₫300,000    [Edit]  │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ ┌──┐ Anh Nguyen                    │    │
│  │ │AN│ Techcombank · ****5678        │    │
│  │ └──┘ Balance: +₫450,000    [Edit]  │    │
│  └─────────────────────────────────────┘    │
│  ...                                        │
│                                             │
└─────────────────────────────────────────────┘
```

**Key changes:**
- Trip name in topbar (inline editable on click)
- Member cards show balance indicator
- Add member is a button, not an always-visible form
- Progressive disclosure: form appears on "Add" click

### 7.5 Share / Export

**Current:** Share link, JSON export, CSV export, JSON import all visible.

**Proposed:** Organized into clear action cards.

```
┌─────────────────────────────────────────────┐
│  Share Trip                                 │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 🔗 Share Link                       │    │
│  │ Copy a link with all trip data.     │    │
│  │ Anyone with the link can view.      │    │
│  │                                     │    │
│  │ [Copy Link]                         │    │
│  │ ⚠️ Contains all expense details     │    │  ← Privacy warning BEFORE action
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 📥 Export                           │    │
│  │ ┌──────────┐ ┌──────────┐          │    │
│  │ │  JSON    │ │  CSV     │          │    │
│  │ └──────────┘ └──────────┘          │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 📤 Import                           │    │
│  │ Drop a JSON file or click to browse.│    │
│  │                                     │    │
│  │ [Choose File]                       │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

**Key changes:**
- Privacy warning shown BEFORE copy action (not after)
- Export and import are separate, clearly labeled cards
- Import shows preview before overwriting
- Single CSV download (not 3 separate files)

---

## 8. Interaction Patterns

### 8.1 Amount Input

**Hero treatment:**
```css
.amountInput {
  font-size: var(--text-3xl);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  text-align: center;
  border: none;
  border-bottom: 2px solid var(--color-border);
  border-radius: 0;
  background: transparent;
  padding: var(--space-4) 0;
}
.amountInput:focus {
  border-bottom-color: var(--color-primary);
  box-shadow: none;
}
```

**Inline currency symbol:**
```css
.amountInputWrap::before {
  content: "₫";
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--color-text-muted);
}
```

### 8.2 Split Method Selection — Pill Style

Replace cramped segmented control with pill-style toggle group.

```css
.splitMethodGroup {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.splitMethodPill {
  background: var(--color-bg);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-label);
  font-size: var(--text-sm);
  font-weight: 600;
  padding: var(--space-2) var(--space-4);
  transition: all 0.2s ease;
}
.splitMethodPill.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
```

### 8.3 Card Hover Lift

```css
.expenseItem,
.balanceCard {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.expenseItem:hover,
.balanceCard:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

@media (prefers-reduced-motion: reduce) {
  .expenseItem:hover,
  .balanceCard:hover {
    transform: none;
  }
}
```

### 8.4 Balance Badge

```css
.balanceBadge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.balanceBadge.positive {
  background: var(--color-success-light);
  color: var(--color-success-text);
}
.balanceBadge.negative {
  background: var(--color-danger-light);
  color: var(--color-danger-text);
}
```

### 8.5 Skeleton Loading

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-100) 25%,
    var(--color-gray-200) 50%,
    var(--color-gray-100) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 8.6 Toast with Undo

```css
.toast {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-gray-800);
  color: white;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  z-index: 1000;
}
.toast button {
  color: var(--color-action);
  font-weight: 600;
  text-decoration: underline;
}
```

### 8.7 Number Animation

```css
@keyframes countUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animatedValue {
  animation: countUp 0.3s var(--ease-out) forwards;
}
```

---

## 9. Responsive Strategy

### Breakpoints (unchanged)

| Breakpoint | Layout |
|------------|--------|
| ≥1120px | Sidebar (292px) + workspace + summary rail |
| 760-1119px | Icon-only sidebar (72px) + workspace |
| <760px | Full-width content + bottom nav |

### Key Responsive Changes

**Tablet (760-1119px) — Icon-only sidebar:**
```css
@media (min-width: 760px) and (max-width: 1120px) {
  .app {
    grid-template-columns: 72px 1fr;
  }
  .sidebar {
    padding: var(--space-4) var(--space-2);
    align-items: center;
  }
  .navItem {
    justify-content: center;
    padding: var(--space-3);
  }
  .navItem small { display: none; }
  .brand span { display: none; }
}
```

**Mobile (<760px) — Bottom nav with proper touch targets:**
```css
.bottomNav button {
  min-height: 48px;  /* up from ~32px */
  padding: var(--space-2) var(--space-1);
}

/* Active indicator pill */
.bottomNav button.active::after {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: var(--color-primary);
  border-radius: 0 0 var(--radius-full) var(--radius-full);
}
```

**Mobile — Summary Rail as bottom sheet:**
Instead of `display: none`, show a collapsible summary bar at the bottom of the content area.

### Bento Grid for Summary (Desktop)

```css
.bentoGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
.bentoGrid .span-2 { grid-column: span 2; }
.bentoGrid .span-4 { grid-column: span 4; }

@media (max-width: 760px) {
  .bentoGrid {
    grid-template-columns: 1fr 1fr;
  }
}
```

---

## 10. Dark Mode

### Implementation

Use CSS custom properties with `[data-theme="dark"]` selector.

```css
[data-theme="dark"] {
  /* Surfaces — avoid pure black */
  --color-bg: #0f1117;
  --color-surface: #1a1d27;
  --color-border: #2a2d3a;
  --color-border-light: #232636;
  --color-border-input: #353849;

  /* Text — off-white, never pure white */
  --color-text: #e8eaf0;
  --color-text-secondary: #c8ccd6;
  --color-text-muted: #8891a5;
  --color-text-label: #a0a8bc;

  /* Semantic — desaturated for dark backgrounds */
  --color-primary: #3ec9c4;
  --color-primary-light: rgba(62, 201, 196, 0.1);
  --color-primary-bg: rgba(62, 201, 196, 0.08);
  --color-action: #6b9aff;
  --color-action-hover: #8db3ff;
  --color-danger: #ff7b72;
  --color-danger-light: rgba(255, 123, 114, 0.1);
  --color-danger-text: #ffa098;
  --color-success: #56d6a0;
  --color-success-light: rgba(86, 214, 160, 0.1);
  --color-success-text: #7ee8c0;
  --color-warning: #fbbf24;

  /* Shadows — use opacity, not dark colors */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3),
               0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);

  /* Images */
  --image-filter: brightness(0.85) contrast(1.1);
}
```

### Auto-detect OS preference

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* apply dark tokens */
  }
}
```

### React toggle

```ts
const [theme, setTheme] = useState(() => {
  const stored = localStorage.getItem('theme');
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
});

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}, [theme]);
```

### Dark Mode Pitfalls

- ❌ Do not invert shadows — use opacity layering
- ❌ Do not use pure black (#000) — use off-black (#0f1117)
- ❌ Do not use pure white (#fff) for text — use off-white (#e8eaf0)
- ❌ Do not use bright saturated colors — desaturate accents
- ✅ Reduce image brightness: `filter: brightness(0.85) contrast(1.1)`
- ✅ Test border visibility — lighter in dark mode

---

## 11. Accessibility

### Fixes Required

| Issue | Current | Fix |
|-------|---------|-----|
| Focus indicators | Subtle `box-shadow` ring | `outline: 2px solid var(--color-action); outline-offset: 2px` |
| Bottom nav touch targets | ~32px height | 48px minimum |
| Muted text contrast | `#66758c` (3.8:1) | `#5a6b82` (4.6:1) |
| Success color contrast | `#20a064` (3.2:1) | `#1a8a56` (4.0:1) |
| No `aria-current` on active nav | Missing | Add `aria-current="page"` |
| Emoji in form headers | `💰`, `👥`, `📊` | Lucide icons (`Banknote`, `Users`, `PieChart`) |
| File input label | No `aria-label` | Add `aria-label="Upload payment QR image"` |
| No `prefers-reduced-motion` | Missing | Respect user preference for all animations |

### Screen Reader Support

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Modernize design tokens, fix critical UX issues

| Task | Effort | Impact |
|------|--------|--------|
| Migrate to OKLCH color tokens | Medium | High |
| Extend spacing scale (10, 12, 16) | Low | Medium |
| Upgrade border radius scale | Low | Medium |
| Implement layered shadows | Low | Medium |
| Add fluid typography with `clamp()` | Medium | High |
| Fix amount input default (empty) | Low | Critical |
| Add delete confirmation | Low | Critical |
| Fix focus-visible indicators | Low | Critical |
| Increase bottom nav touch targets | Low | High |

### Phase 2: Component Refresh (Week 3-4)

**Goal:** Redesign key components

| Task | Effort | Impact |
|------|--------|--------|
| Redesign expense form (amount-first) | High | High |
| Implement pill-style split selector | Medium | High |
| Replace emoji with Lucide icons | Low | Medium |
| Category dropdown (not free-text) | Low | High |
| Inline payer validation | Medium | High |
| Date-grouped expense list | Medium | Medium |
| Balance badge component | Low | Medium |
| Stat cards for settlement view | Medium | High |
| Move trip name to topbar | Medium | High |

### Phase 3: Polish & Dark Mode (Week 5-6)

**Goal:** Dark mode, animations, responsive improvements

| Task | Effort | Impact |
|------|--------|--------|
| Implement dark mode tokens | Medium | High |
| Theme toggle in settings | Low | Medium |
| Skeleton loading states | Low | Medium |
| Card hover lift animations | Low | Medium |
| Toast with undo pattern | Medium | High |
| Icon-only sidebar for tablet | Medium | Medium |
| Summary bottom sheet for mobile | High | High |
| Number animation for balances | Low | Medium |

### Phase 4: Advanced (Week 7-8)

**Goal:** Data visualization, gestures, accessibility

| Task | Effort | Impact |
|------|--------|--------|
| Donut chart for category spending | Medium | Medium |
| Bento grid for summary view | Medium | Medium |
| Swipe gestures on mobile expense items | High | Medium |
| LZ-string compression for share URLs | Low | Medium |
| Import preview/confirmation dialog | Medium | High |
| Receipt image upload UI | Medium | Medium |
| Date range filter for expenses | Medium | Medium |
| Comprehensive accessibility audit | Medium | High |

### Effort Legend

- **Low:** < 2 hours
- **Medium:** 2-8 hours
- **High:** 1-3 days

---

## Appendix: Sources

- **Splitwise** — 2019 redesign blog, API documentation, Dribbble/Behance showcases, app store reviews
- **Tricount** — tricount.com features, help center, AlternativeTo reviews
- **Settle Up** — settleup.io, AlternativeTo, app store listings
- **Design Trends** — Tailwind CSS v4, Open Props, CSS-Tricks dark mode guide, OKLCH specification, WCAG 2.2
- **Current App** — Full codebase audit of `src/`, `styles.css`, `App.tsx`, all components
