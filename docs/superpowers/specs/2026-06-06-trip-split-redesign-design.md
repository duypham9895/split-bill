# Trip Split Bill — Redesign & Refactor Design

**Date:** 2026-06-06
**Status:** Approved design, ready for implementation planning
**Owner:** Duy (Edward Pham)

---

## 1. Goal & Scope

Refactor and redesign the existing client-only Trip Split Bill app so it is **correct, beautiful, and simple** — a personal tool the host and their friends genuinely enjoy using on a real trip.

**Ambition level: Personal tool.** Make what exists work flawlessly and look premium. Explicitly *out of scope*: analytics, growth onboarding, marketing, accounts, server/database, multi-currency, real-time collaboration.

**The four pains being fixed** (user named all four):
1. 🔧 Feels unfinished / buggy → fix correctness & honesty
2. 🎨 Looks dated → new visual identity
3. 🧭 Confusing → simplify the core flows
4. 🧩 Missing features → add the four the user will actually use

**Features in scope** (user-selected): receipt photos, better sharing, quick-add templates, PWA install. **Not building:** multiple trips, natural-language entry.

**Unchanged differentiators to protect:** formula transparency, multiple payers, payer ≠ participant, 4 split methods, VietQR, no-account/offline, bilingual EN/VN.

---

## 2. Execution Approach

**Approach 3 — Themed phases, fix-as-you-touch** (approved). Four shippable phases, each visible and valuable on its own. Refactor only files we are already working in (no refactor-for-its-own-sake). The app is better after every phase; the user could stop after any phase and have gained.

Order is deliberate: **Trust → Beauty → Simplicity → Delight.** Correctness first (it's a money tool), then the look, then the flows, then the new capabilities.

---

## 3. Design System — "Ink & Amber Receipt" (locked)

The visual identity, chosen after rejecting AI-default palettes (purple gradients, pastel chips) and warm coral/orange directions. Anchored in a real-world metaphor: a **Vietnamese ledger / receipt**.

### Tokens
| Token | Value | Use |
|---|---|---|
| `--ink` | `#1c1a16` | Primary text, primary buttons |
| `--paper` | `#fbf8f1` | App background |
| `--card` | `#fffdf8` | Card / surface |
| `--amber` | `#b06a1e` | Single accent — totals, links, active states |
| `--amber-deep` | `#8f5314` | Accent text on light |
| `--amber-bg` | `#fbf0dd` | Accent fill (hints, help) |
| `--faint` | `#a59a82` | Metadata, labels |
| `--line` | `#e7ddc9` | Hairlines, dashed rules |
| `--good` | `#3f6b3a` | Paid / positive / valid |
| `--bad` | `#b3401f` | Error / invalid |

### Rules
- **Monospace** (`SF Mono`/ui-monospace) for ALL money and metadata; system sans for UI text.
- **Strong type scale contrast** — hero amounts ~38px, labels ~11px uppercase. Never everything at one size.
- **Dashed hairline rules** evoke the receipt; crisp radii (3–10px), not bubbly.
- **One accent, used sparingly** (amber). No gradients, no extra hues.
- **Intentional focus/selected states** — amber focus ring on inputs; ink-filled selected tags.
- **Icon-only nav** (no ①②③④ numbering — explicitly rejected).
- 4px spacing grid.
- **No dark mode** (removed — see Phase 1).

Replaces the current teal/blue token set and eliminates the magic numbers the audit found (`height:60`, `width:72`, inline `style={{color:...}}` → tokens/classes).

---

## 4. Phase 1 — Trust 🔧

*Goal: a money tool you can believe. Correctness and honesty before anything visual.*

### 4.1 Fix settlement rounding bug `[correctness]`
- **Problem:** `src/domain/calculations.ts:135` uses `Math.floor` per-payer in direct settlement, silently dropping 1–5 VND so balances don't sum to zero.
- **Fix:** allocate each payer's share with the **largest-remainder method** already proven in `split.ts` (floor all, distribute leftover đồng by largest fractional part).
- **Test (currently missing):** multi-payer mixed-split expense that asserts settlement sums to **exactly zero**.

### 4.2 True offline VietQR `[correctness + offline promise]`
- **Problem:** `src/payment/qr.ts:88` fetches the QR image from `img.vietqr.io`. Offline, this fails and falls back to `buildTransferContent` — a `TRIP_SPLIT_BILL|BANK=...` string **no banking app can scan.** The single most important offline moment (friends scanning to pay) is broken.
- **Fix:** generate the **VietQR EMVCo payload client-side** (TLV encoding + CRC-16/CCITT, building blocks partly exist per `vietqr.test.ts`), render locally with the `qrcode` lib. No network dependency.
- **Test:** with DevTools offline, generate a settlement QR and confirm it's a valid, scannable VietQR (decode the EMV payload to verify).

### 4.3 Kill English leaks (finish bilingual) `[honesty]`
Move every hardcoded user-facing string into `translations.ts`:
- Delete/Import confirmation dialogs (`App.tsx:660–689`)
- Split-method labels (`ExpensesSection.tsx:510`)
- Expense-form validation errors (`ExpensesSection.tsx:119–127`)
- Share/Export labels (`SharingSection.tsx`)
- "View all N transfers" (`SummaryRail.tsx:72`)
- Add a dev-only guard flagging hardcoded user-facing strings so leaks can't return.

### 4.4 Remove dark mode `[honesty]`
Delete the toggle, theme state, `data-theme` handling, and any dark tokens. The toggle currently does little/nothing visible; ship nothing dead.

### 4.5 Cut QA / "Release" section `[honesty]`
Remove from nav and codebase. CLAUDE.md lists it out-of-scope; it shouldn't ship.

### 4.6 Delete dead code `[hygiene]`
- Duplicated `parseAmount()` (`ExpensesSection.tsx:200–202` & `239–242`)
- Duplicated `cleanOptional()` (`App.tsx` & `ExpensesSection.tsx`)
- Unused `loading` prop (`SummaryRail`/`PaymentCard`)
- Keep the `receiptImageDataUrl` type field — Phase 4 wires it up.

**Verification:** all existing unit + E2E tests green, plus new settle-to-zero and offline-QR tests; a manual VN-language pass with zero visible English.

---

## 5. Phase 2 — Beauty 🎨

*Goal: opening the app feels like a vacation, not a spreadsheet.*

- Rebuild the `styles.css` token layer to **Ink & Amber Receipt** (§3).
- Apply receipt structure across all sections: dashed rules, centered headers with mono metadata, right-aligned mono numbers, running totals, perforated edges where appropriate.
- Unify the button system (audit found teal toggles fighting blue primaries → one ink/amber system).
- Convert hardcoded category hex colors and inline styles to tokens/classes.
- Fix typography: kill the micro-`clamp()` that renders nav hints at ~11px on mobile; establish clear hierarchy.
- Icon-only nav; active item = amber highlight + ink edge bar.
- **No logic changes** — all tests stay green throughout.

---

## 6. Phase 3 — Simplicity 🧭

*Goal: the core flows stop being confusing. This is the heart of the UX work.*

### 6.1 Rebuilt expense form (Treatment A — "Refined card")
Top-to-bottom, calm, but crafted. Field order: **Amount → What was it? → Category + Date → Who paid? → Split how? → Between who?**

- **Hero amount** in a soft header, large monospace — the number is the star.
- **Focus glow** (amber ring) on active fields; pill avatars on name tags; iOS-style segmented control for split method.
- **Who paid?** — single payer is the default (tap one name). A dashed **"+ split payers"** tag reveals multi-payer inputs *only when needed* — hides complexity for the 95% single-payer case.
- **"Between who?" has an "All" toggle** leading the row, tri-state: `✓` everyone / `–` partial / empty none. One tap selects or clears all. (Label may be "All"/"Tất cả".)
- **Live running-total / "each owes" line** — derived continuously, green when valid, red with a reason when not. **Validation moves from submit-time to edit-time** — you never save-then-error. Save button disabled with an explanatory label ("Fix 50,000₫ to save") until valid.
- **Component extraction happens here** (as a side effect of the rewrite): `PayerInputs`, `ParticipantSelector`, `SplitMethodPicker` split out of the 658-line `ExpensesSection`.

### 6.2 Split-method explanations (locked)
When a method is selected, show three layers: **bilingual one-sentence summary → formula → live worked example** (on the current amount). Reinforces the formula-transparency differentiator. Only the active language shows by default.

| Method | EN summary | VN summary | Formula |
|---|---|---|---|
| Equal · Chia đều | Everyone selected pays the same amount. | Mọi người được chọn trả số tiền bằng nhau. | `each = total ÷ n` (odd đồng → first members) |
| Shares · Theo phần | Each person pays by weight — more shares means a bigger portion. | Mỗi người trả theo số phần — nhiều phần hơn thì trả nhiều hơn. | `each = total × (yourShares ÷ allShares)` |
| Exact · Số tiền cụ thể | You type the exact amount each person owes. | Bạn nhập chính xác số tiền mỗi người phải trả. | `each = amount you type` (Σ must = total) |
| Percent · Phần trăm | Each person pays a percentage of the total. | Mỗi người trả theo phần trăm của tổng số tiền. | `each = total × (yourPercent ÷ 100)` (Σ = 100) |

*(VN phrasing to be confirmed/finalized by the user during build — they are the native speaker.)*

### 6.3 Settlement made readable
- Plain-language captions under the mode toggle: **Simplified** = "fewest transfers"; **Direct** = "pay back whoever actually paid." No bare jargon.
- Settled members visually recede (✓); people who owe stand out.

### 6.4 Member form — progressive disclosure
- Show only **Name** by default; a **"+ Add payment details (bank, QR)"** link expands the rest. Adding a person takes one field, not eight.

### 6.5 Honest onboarding
- Mark the sample trip clearly as a sample with a one-tap **"Start fresh."** New users no longer mistake sample data for real data.

---

## 7. Phase 4 — Delight 😊

*Goal: the four chosen features, done cleanly.*

### 7.1 Receipt photos
Wire up the existing `receiptImageDataUrl` field. "📷 Add photo" on the expense form; **resize/compress before storing** as a data URL (protect localStorage quota); tap to view full-size. Fully offline, no upload.

### 7.2 Better sharing (the share view)
Read-only friend-facing summary opened via the share link — the payoff screen:
- Dark header (trip name + dates), **huge "You owe X to Y"**, scannable **VietQR** + bank line.
- **"How this was calculated"** breakdown — formula transparency in the shared view too.
- Footer: "Read-only · no app needed · 🔒 stays on your device" + an **"as of [date]" stamp**.

**Sharing model (no-backend reality):** the trip is base64-encoded into the link (existing `?trip=` mechanism). The link is a **snapshot** at copy-time.
- **Link style: one link for everyone** (approved). The shared page asks "Who are you?" → tap name → see that person's amount + QR.
- **Snapshot handling: just resend** a fresh link if the trip changes (approved). Add the lightweight "as of [date]" stamp; no nagging/outdated-link logic.

### 7.3 Quick-add templates
Recent expenses become one-tap templates (e.g. "Grab", "Cà phê", "Seafood"). Tap → form pre-fills title/category/last split → adjust amount → save.

### 7.4 PWA install
`vite-plugin-pwa` — manifest + service worker so it installs to the home screen, opens fullscreen, works fully offline. Offline *correctness* already locked in Phase 1; this makes it launchable and "feel real."

---

## 8. Architecture Notes

- **Keep** the no-backend, localStorage, single-`App.tsx`-state, base64 share-URL architecture. These are deliberate and serve the personal-tool goal.
- **Targeted refactors only**, triggered by the work: split `ExpensesSection` during the form rewrite (§6.1); extract handlers/state into hooks only where a phase already touches them. No standalone refactor phase.
- **Domain layer** (`split.ts`, `calculations.ts`) stays pure and fully tested; Phase 1 adds the missing settlement and offline-QR tests.

---

## 9. Verification Per Phase

| Phase | Done when… |
|---|---|
| 1 Trust | All tests green + new settle-to-zero test + offline-QR test pass; manual VN pass shows zero English; no dark mode / QA section / dead code remains. |
| 2 Beauty | Ink & Amber system applied across all 4 sections; no magic-number inline styles; tests still green. |
| 3 Simplicity | Rebuilt expense form with edit-time validation, "+ split payers", "All" toggle, bilingual split explanations; member form progressive disclosure; sample-trip "Start fresh"; `ExpensesSection` decomposed. |
| 4 Delight | Receipt photos store/display offline; share view with "Who are you?" + VietQR + breakdown + date stamp; quick-add templates; installable PWA that works offline. |

---

## 10. Open Items (minor, resolve during build)
- Final VN wording for split summaries (user to confirm as native speaker).
- "All" toggle label: "All" vs "Tất cả" / "Everyone".
- Whether quick-add templates are auto-derived from recent expenses or manually pinned.
