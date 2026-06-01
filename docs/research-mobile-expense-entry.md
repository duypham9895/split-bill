# Research: Mobile Expense Entry UX Optimization

**Date:** 2026-06-01
**Scope:** Optimize the expense entry flow for mobile touch devices (current breakpoint: 760px)

## Current State

The expense form uses 4 visual cards stacked vertically:

1. **"What was the expense?"** — title, category, amount, date
2. **"Who paid?"** — payer select dropdown + amount input + add/remove payers
3. **"Who shared this?"** — participant checkbox grid (3-col on desktop, 2-col on mobile) + split method segmented control
4. **"Split details"** — conditional table for non-equal splits

Below the cards: note textarea, formula preview, and save button.

On mobile (<760px), the form requires significant scrolling. The bottom tab bar occupies ~56px + safe-area-inset. The `inputGrid` collapses to single column. The participant grid becomes 2 columns. Payer rows collapse to stacked layout. The sticky action bar is NOT actually sticky — it's a regular `display: grid` div.

---

## 1. Splitwise's Mobile Expense Entry

**Finding:** Splitwise's mobile flow follows a progressive-disclosure model. The primary add-expense flow centers on:

- **Amount is the first and most prominent field.** Large numeric input at the top.
- **Group/friend context is pre-selected** before entering the form (you tap into a group first, then tap "+").
- **Payer defaults to "you"** — the logged-in user is pre-selected as payer with a single tap to change.
- **Participants default to all group members** — equal split is the default, no selection needed for the common case.
- **Split method is hidden by default.** Only surfaced when user taps "split options."
- **Category is optional** and tucked away — most users skip it.

**Estimated taps for the common case (equal split, you paid):**
1. Tap "+" in group
2. Type amount
3. Type description
4. Tap "Save"

That's essentially 3 taps + 2 keyboard inputs. The payer/participant selection is zero-interaction for the default case.

**Key insight:** Splitwise optimizes for the 80% case (equal split, one payer) and buries complexity behind progressive disclosure.

**Source:** App Store listing, Splitwise blog (high-level redesign notes mentioning "new layout that speeds up task completion" and "better interface for unequally splitting an expense").

---

## 2. Tricount's Mobile UX

**Finding:** Tricount (by bunq, 21M users) uses a similar mental model:

- Amount + description are the primary inputs.
- Payer selection is a simple list tap (not a dropdown).
- Participants default to all members with equal split.
- The app supports equal, by-parts, and custom amounts.
- bunq bank users get automatic expense import — zero manual entry.

**Key difference from Splitwise:** Tricount's UX is simpler because it has fewer split methods (no percentage, no shares). The reduced feature set makes the form shorter.

**Key insight:** Fewer split methods = less cognitive load on mobile. The "shares" and "percentage" methods are rarely used on mobile and could be hidden behind a "more options" affordance.

**Source:** tricount.com/en/

---

## 3. Bottom Sheet Patterns for Payer/Participant Selection

**Finding:** NNGroup research on bottom sheets provides clear guidance:

**When to use bottom sheets:**
- Short, quick interactions (selecting from a list)
- When users need to reference background content
- Better than full-page navigation for selection tasks

**When NOT to use:**
- Complex multi-step flows
- Lengthy content that requires scrolling
- Never stack bottom sheets on top of each other

**Best practices:**
- Always include a visible Close (X) button — don't rely solely on swipe-to-dismiss
- Support the back button/gesture for dismissal
- Modal sheets are better for blocking selection tasks
- The "reachability" argument (bottom = easier to tap) is a myth — middle of screen is most tappable area

**Recommendation for this app:**
- **Payer selection:** Bottom sheet with member list + avatars. Tap to select, tap "Done." Better than a `<select>` dropdown on mobile because it shows avatars and allows visual scanning.
- **Participant selection:** Bottom sheet with checkbox grid. Shows who's selected with checkmark overlays on avatars. More space than inline 2-column grid, and dismisses cleanly.
- **Do NOT use bottom sheets for:** The entire expense form, split details editing, or anything with multiple sequential steps.

**Source:** NNGroup, "Bottom Sheet" (2025)

---

## 4. Amount-First vs. Title-First Entry

**Finding:** Amount-first is faster for the common case. Rationale:

1. **Amount is the only truly required field for a split calculation.** Title is descriptive metadata.
2. **Numeric keyboards are faster than text keyboards.** One tap per digit vs. hunting for letters.
3. **Financial apps universally lead with amount** (Venmo, Revolut, Wise, Splitwise).
4. **Title can be auto-suggested** from category + recent history (e.g., "Dinner" if category is Food).

**Current app order:** Title → Category → Amount → Date

**Recommended order:** Amount → Title (optional/suggested) → Category (chips, not text input) → Date (defaulted to today, collapsed)

**The critical insight:** If amount is entered first, the formula preview can start computing immediately, giving the user feedback that they're on the right track.

**Source:** Pattern analysis of Venmo, Revolut, Wise, Splitwise mobile flows; NNGroup mobile UX research emphasizing "show users what they need as soon as possible."

---

## 5. Smart Defaults

The app already has some defaults but could go further:

| Field | Current Default | Recommended Default |
|-------|----------------|---------------------|
| Amount | 300,000 (hardcoded) | 0 (empty, show placeholder) |
| Payer | First member in list | **Last used payer** (persist in localStorage) |
| Participants | All active members, selected | All active members, selected (keep) |
| Split method | Equal | **Last used method** (persist in localStorage) |
| Date | Today | Today (keep) |
| Category | "Food" | **Last used category** (persist in localStorage) |
| Title | Empty | Empty, but show quick-pick chips from recent titles |

**Implementation note:** Store `lastPayerId`, `lastSplitMethod`, `lastCategory` in `localStorage` under `split-bill:v1:last-expense-prefs`. Update on every expense save.

**Impact:** Reduces taps for repeat users. A person who always pays for food with equal split gets a near-ready form on open.

---

## 6. Quick-Add Pattern (3-Tap Expense)

**Target flow for the common equal-split case:**

```
Tap 1: Amount (large numeric keypad, auto-focused)
Tap 2: Confirm payer (avatar row, pre-selected, tap to change)
Tap 3: Save button (sticky at bottom)
```

**Wireframe description:**

```
┌─────────────────────────────┐
│  New Expense          [X]   │
├─────────────────────────────┤
│                             │
│     ₫ 0                     │  ← Large amount input, auto-focused
│     ─────────────────       │     with numeric keyboard open
│                             │
│  Quick description...       │  ← Optional, can skip
│                             │
│  ─── Paid by ────────────   │
│  [Avatar: You ✓] [A] [B]   │  ← Horizontal avatar row
│                             │     last payer pre-selected
│  ─── Split equally ───────  │
│  [✓A] [✓B] [✓C] [✓D]      │  ← All selected, compact
│  Tap to change split →      │     link to expand split options
│                             │
├─────────────────────────────┤
│  [     Save Expense     ]   │  ← Sticky at bottom, above tab bar
│  300,000 → 75,000 each      │  ← Live preview
└─────────────────────────────┘
```

**How it works:**
1. User opens expense form. Amount field is auto-focused, numeric keyboard appears.
2. User types amount. Formula preview updates live.
3. Payer row shows all trip members as avatars. Last-used payer has a checkmark. Tap to change.
4. All participants are pre-selected with equal split. A subtle "Tap to change split" link expands to show split method options.
5. Save button is sticky at the bottom, always visible.

**For the uncommon case (unequal split):**
- Tapping "Tap to change split" expands a bottom sheet or inline section with the 4 split methods.
- Selecting non-equal reveals the split details inputs inline.
- This is progressive disclosure — hide complexity until requested.

---

## 7. Sticky Save Button

**Current problem:** The save button is in `.stickyActionBar` which is `display: grid` with no `position: sticky` or `position: fixed`. On mobile, users must scroll past all 4 cards to reach it.

**Recommendation:** Make the action bar truly sticky on mobile:

```css
@media (max-width: 760px) {
  .stickyActionBar {
    position: fixed;
    bottom: calc(56px + env(safe-area-inset-bottom, 0px)); /* above bottom tab bar */
    left: 0;
    right: 0;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    padding: var(--space-3) var(--space-4);
    z-index: 90; /* below bottom nav (100) */
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  }
}
```

**Also:** The formula preview should be included in the sticky bar — it provides real-time feedback and is always relevant.

**Caveat:** The bottom tab bar is `z-index: 100`. The sticky action bar should be `z-index: 90` so it sits below the tab bar but above the form content.

**Alternative (simpler):** Use `position: sticky; bottom: 0;` inside a scrollable container. This avoids z-index layering issues but requires the parent to be the scroll container.

---

## 8. Camera/Receipt Scanning

**Finding:** Splitwise Pro offers receipt OCR. The user takes a photo, and the app extracts line items for itemized splitting.

**Is it worth it for this app?**

**No, for these reasons:**
1. **Complexity.** Requires OCR integration (Tesseract.js is ~2MB, or a cloud API with latency + cost).
2. **Niche use case.** Receipt scanning matters for itemized restaurant bills. The target user (trip host managing group expenses) usually enters aggregated amounts, not line items.
3. **No backend.** A client-only app would need to bundle an OCR library or use a browser API (not reliable across devices).
4. **Diminishing returns.** The 3-tap quick-add pattern solves 90% of the speed problem without any new dependencies.

**If it were pursued later:**
- Use the browser's `camera` input type: `<input type="file" accept="image/*" capture="environment">`
- Process with a lightweight client-side OCR library
- Extract amount + merchant name only (not full line items)
- Position as a "nice to have" behind a camera icon, not as the primary entry method

**Verdict:** Skip for now. The ROI doesn't justify the complexity for a no-backend, no-auth app.

---

## 9. 4-Card Layout on Mobile — Collapsible/Accordion?

**Current problem:** 4 cards stacked vertically = ~800-1000px of form content on mobile. Users scroll past cards they don't need to edit.

**Options analyzed:**

### Option A: Accordion Cards (expand/collapse)
- Each card header is tappable to expand/collapse its body.
- Default state: Card 1 (amount) expanded, others collapsed.
- Pro: Reduces visible content, focuses attention.
- Con: Extra taps to access payer/participant selection. Hides context.

### Option B: Multi-Step Wizard (one card per screen)
- Step 1: Amount + title
- Step 2: Who paid? (bottom sheet)
- Step 3: Who shared? (bottom sheet)
- Step 4: Review + save
- Pro: Maximum focus per step.
- Con: More taps, harder to go back and edit, feels slow for power users.

### Option C: Inline Collapse + Smart Ordering (RECOMMENDED)
- Reorder cards: Amount first, then payer, then participants, then split details.
- On mobile, cards 2-4 start collapsed with a summary line:
  - "Who paid? → You" (tappable to expand)
  - "Who shared? → All 4 members, equally" (tappable to expand)
  - Split details: only appears if non-equal method selected
- Pro: Shows the full story at a glance. One tap to edit any section. No navigation steps.
- Con: Slightly more complex CSS/JS for collapse state.

### Option D: Single-Page with Sections (current approach, improved)
- Keep the 4 cards but reorder and collapse by default on mobile.
- Add `position: sticky` to the save bar.
- This is the minimum-viable improvement with the least code change.

**Recommendation:** Option C (Inline Collapse + Smart Ordering) for the full optimization. Option D as a quick win if time is limited.

---

## Summary of Recommendations

### Priority 1 — Quick Wins (CSS + small JS changes)

| Change | Impact | Effort |
|--------|--------|--------|
| Make save bar truly sticky on mobile | Eliminates scroll-to-save frustration | Low (CSS) |
| Reorder: amount field first | Faster mental model | Low (JSX reorder) |
| Default amount to empty (not 300,000) | Less confusion, clearer placeholder | Trivial |
| Add `padding-bottom` to form for sticky bar clearance | Prevents content hidden behind sticky bar | Trivial |

### Priority 2 — Smart Defaults (localStorage)

| Change | Impact | Effort |
|--------|--------|--------|
| Remember last payer | One fewer tap per expense | Low |
| Remember last split method | One fewer tap for non-equal users | Low |
| Remember last category | One fewer input for repeat users | Low |
| Quick-pick title chips from recent expenses | Faster title entry | Medium |

### Priority 3 — Mobile Layout Improvements

| Change | Impact | Effort |
|--------|--------|--------|
| Collapsible cards on mobile (accordion) | Reduces scrolling, focuses attention | Medium |
| Avatar-based payer row (instead of `<select>`) | Faster visual selection | Medium |
| Bottom sheet for participant selection | More space, better touch targets | Medium |
| Hide split method details behind "change split" link | Progressive disclosure for the 80% case | Medium |

### Priority 4 — Advanced (if warranted)

| Change | Impact | Effort |
|--------|--------|--------|
| Quick-add mode: amount → payer → save (3 taps) | Maximum speed for common case | High |
| Camera/receipt scanning | Low ROI for this app | High — Skip |

---

## Wireframe: Recommended Mobile Expense Form

### Default State (collapsed cards)

```
┌──────────────────────────────────────┐
│  Expenses                   [+ Add]  │  ← Panel header
├──────────────────────────────────────┤
│                                      │
│         ₫ 300,000                    │  ← Amount, large, centered
│         ──────────────────           │     auto-focused on form open
│                                      │
│  Dinner at seafood restaurant...     │  ← Title input
│                                      │
│  [Food] [Transport] [Hotel] [More]   │  ← Category chips
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 💰 Paid by: You ✓            │    │  ← Collapsed payer summary
│  │    Tap to change             │    │     tappable to expand
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 👥 4 members, split equally  │    │  ← Collapsed participant summary
│  │    Tap to change             │    │     tappable to expand
│  └──────────────────────────────┘    │
│                                      │
│  📝 Add note...                      │  ← Collapsed note
│                                      │
├──────────────────────────────────────┤  ← Sticky action bar
│  300,000 → 75,000 each               │  ← Formula preview
│  [        Save Expense          ]    │  ← Sticky save button
└──────────────────────────────────────┘
│  [Trip] [Expenses✓] [Settle] [Share] │  ← Bottom tab bar
```

### Payer Expanded State

```
┌──────────────────────────────────────┐
│  💰 Who paid?                    [X] │
├──────────────────────────────────────┤
│                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │  👤  │ │  👤  │ │  👤  │  ...    │  ← Avatar grid
│  │  You │ │  An  │ │  Binh│         │     tap to select
│  │  ✓   │ │      │ │      │         │     last payer pre-checked
│  └──────┘ └──────┘ └──────┘         │
│                                      │
│  Amount: ₫ 300,000                   │  ← Payer amount (auto-filled)
│                                      │
│  [+ Add another payer]               │
│                                      │
│  [        Done                 ]     │
└──────────────────────────────────────┘
```

### Participant Expanded State

```
┌──────────────────────────────────────┐
│  👥 Who shared?                  [X] │
├──────────────────────────────────────┤
│                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │  👤  │ │  👤  │ │  👤  │         │  ← Avatar grid with checkboxes
│  │  You │ │  An  │ │  Binh│         │     all pre-selected
│  │  ✓   │ │  ✓   │ │  ✓   │         │
│  └──────┘ └──────┘ └──────┘         │
│  ┌──────┐                           │
│  │  👤  │  [Select all] [Clear all] │
│  │  Cuong│                          │
│  │  ✓   │                           │
│  └──────┘                           │
│                                      │
│  Split: [Equal] [Exact] [%] [Shares]│  ← Segmented control
│                                      │
│  [        Done                 ]     │
└──────────────────────────────────────┘
```

---

## Key Principles Applied

1. **Progressive disclosure** — Show the summary, expand on demand. Reduces cognitive load.
2. **Amount-first** — The most important field gets the most prominent position and auto-focus.
3. **Smart defaults** — Last payer, all participants, equal split, today's date. Zero-interaction for the common case.
4. **Sticky actions** — Save button and formula preview always visible. No scroll-to-save.
5. **Touch targets** — 44px minimum (already met). Avatar-based selection is more thumb-friendly than dropdowns.
6. **No stacked bottom sheets** — Payer and participant selection use inline expansion or single bottom sheets, never nested.
7. **Category chips** — Replace free-text category input with tappable chips. Faster, fewer errors.
