# Problem Space & Competitive Landscape Research

**Date:** 2026-06-01
**Purpose:** Deep understanding of the problem Trip Split Bill solves, who the competitors are, what works, what fails, and where the opportunity lies.

---

## Part 1: The Problem — What's Actually Broken

### The Surface Problem

After a group trip, people need to figure out who owes whom. This sounds simple. It isn't.

### Why It's Harder Than It Looks

Real trips have messy financial dynamics that most tools don't handle well:

**1. Multiple payers per expense.**
One person pays for the hotel, another pays for dinner, a third pays for the taxi. Sometimes two people split a single bill between them. Most apps assume one payer per expense.

**2. Partial participation.**
Not everyone eats the seafood dinner. Two people skip the spa. Three out of five go on the diving trip. Expenses are not universally shared — they're selectively shared.

**3. Payer ≠ participant.**
Duy pays for Alvin and HA's dinner but doesn't eat himself. The payer is not automatically a participant. This is the single most common source of calculation errors in manual spreadsheets.

**4. Unequal splits are common.**
A couple shares one room but pays half. One person drinks alcohol, others don't. A family has two adults and three kids. Equal split is the default, but it's often wrong.

**5. The math must be transparent.**
People don't trust black boxes. If the app says "Alvin owes 375,000 VND," Alvin wants to see exactly why. Every expense, every formula, every step must be auditable.

**6. Settlement is the actual goal.**
Recording expenses is means, not end. The real output is: "Here's exactly who pays whom, how much, to which bank account, with a QR code ready to scan." Anything less leaves the job half-done.

**7. Payment details are scattered.**
After calculating, someone asks "what's your bank account?" in the group chat. Then it gets buried under 50 messages. The app needs to centralize payment profiles alongside the math.

**8. The social dimension.**
Money between friends is awkward. Chasing debts feels petty. The tool should make settlement feel mechanical and neutral, not personal.

### Who Suffers Most

- **Trip hosts/organizers** — the person who "managed the money" during the trip and now has a spreadsheet nightmare
- **Large groups** (5+ people) — exponential complexity in tracking who paid for whom
- **Mixed groups** (couples, families, friends) — unequal participation is the norm
- **Vietnamese users** — VND is a high-denomination currency (300,000 VND for dinner is normal), so precision matters; VietQR is the standard payment method but most international apps don't support it

---

## Part 2: The Competitive Landscape

### Tier 1: Market Leaders

#### Splitwise (2011–present)
**The incumbent.** Largest user base globally.

| Dimension | Detail |
|-----------|--------|
| Model | Freemium — free tier heavily limited, Pro at $40/year |
| Free limits | 3–5 expense entries/day, mandatory 10-second video ads after each entry |
| Pro features | Receipt scanning, multi-currency, charts, item-level splits |
| Account required | Yes — for ALL participants |
| Split methods | Equal, exact, percentage, shares |
| Settlement | Debt simplification algorithm, Venmo/PayPal integration (US-centric) |
| Offline | Partial |
| Platforms | iOS, Android, Web |

**What works:**
- Network effects — "everyone has Splitwise" makes it the default
- Running balance tracking for long-term roommate situations
- Deep payment integration (Venmo, PayPal) in the US
- Brand recognition and trust

**What fails:**
- **Paywall alienation** — features that were free became paid; users remember
- **Video ad interruptions** — not banner ads, forced 10-second video after every expense entry
- **Account friction** — requiring every group member to sign up kills casual/one-off use
- **Core flows are over-engineered** — adding an expense and settling up both require multiple screens
- **Transaction log degrades over time** — hundreds of entries with no filtering, search is buried
- **Emotionally tone-deaf** — 2 AM notification that you owe ₹20.25 to your cousin
- **No web-first experience** — mobile app is primary, web is secondary
- **Payment loop is broken** — tracks debts but forces users to external apps to pay; platform-asymmetric (Android gets Paytm, iOS doesn't)

**Key UX insight from research:** The expense entry flow surfaces too many fields at once, hiding key elements. In social settings where users need to log quickly and return to conversation, this is particularly frustrating.

#### Tricount (2015–present)
**The European favorite.** 21M users, strong in France, Belgium, Germany, Netherlands.

| Dimension | Detail |
|-----------|--------|
| Model | Free with optional premium — no ads in core experience |
| Account required | Optional for basic use |
| Split methods | Primarily equal division |
| Multi-currency | Built into free version (~30 currencies) |
| Offline | Yes |
| Web version | Yes — a genuine differentiator |
| Platforms | iOS, Android, Web |

**What works:**
- No artificial entry limits
- Free multi-currency for travelers
- Low-friction onboarding (accounts optional)
- Web accessibility for desktop review
- Strong European network effects

**What fails:**
- **Limited split logic** — primarily equal division; poor for weighted/unequal splits
- **No running balance** — can't track month-to-month roommate situations
- **Dated interface** — functional but visually behind competitors
- **~30 currencies only** — insufficient for global travelers

**Key insight:** Tricount occupies the middle ground — more feature-rich than barebones tools, less complex than Splitwise. Its web version fills a gap competitors ignore.

### Tier 2: Niche Specialists

#### Splid
**The offline-first traveler's choice.**

| Dimension | Detail |
|-----------|--------|
| Model | Free for 1 group / $5 one-time for unlimited |
| Account required | Optional |
| Multi-currency | 150+ currencies, free |
| Offline | Full — syncs on reconnect |
| Split methods | Basic |

**What works:** Zero-barrier entry, 150+ currencies, full offline with background sync. Perfect for international travel in areas with poor connectivity.

**What fails:** Too barebones for detailed accounting. Single-group limitation in free tier. UI is functional but not polished.

**Key insight:** The "no account, no internet, no cost" trifecta creates a defensible niche. The $5 one-time payment is the cheapest premium upgrade in the category.

#### Settle Up
**The technical powerhouse nobody's heard of.**

| Dimension | Detail |
|-----------|--------|
| Model | Free with banner ads |
| Account required | Yes |
| Split methods | Percentage, custom ratios, weighted — most flexible |
| Multi-currency | Yes, free |
| Running balance | Yes |

**What works:** Arguably the most flexible splitting engine. Percentage, custom ratios, weighted splits — handles complex family/group scenarios better than anyone.

**What fails:** Very low brand awareness. Requires all members to install the app. Dated UI doesn't inspire confidence.

**Key insight:** Technical capability without adoption is a chicken-and-egg problem. The best algorithm doesn't matter if nobody opens the app.

#### Tab
**The restaurant receipt scanner.**

| Dimension | Detail |
|-----------|--------|
| Model | Free |
| Account required | No |
| Key feature | Photo receipt scanning → item assignment → settlement |
| Currency | USD only |

**What works:** Laser-focused on one scenario (restaurant bills). Snap receipt → scan → assign items to people → done. Handles tax and tip elegantly.

**What fails:** USD only. No history persistence. Struggles with wrinkled receipts and non-English text. Single-purpose.

**Key insight:** Extreme focus creates an unmatched experience for one use case. But single-currency support means most of the world can't use it.

### Tier 3: Open-Source Alternatives

#### Spliit (spliit.app)
**The self-hostable Splitwise replacement.**

| Dimension | Detail |
|-----------|--------|
| Model | MIT licensed, self-hostable or use hosted instance |
| Account required | No — group-level identity model |
| Tech stack | Next.js + PostgreSQL + Tailwind + shadcn/UI |
| AI features | Optional receipt scanning via GPT-4 Vision |
| i18n | Community-driven via Weblate |
| Deploy | Vercel one-click, Docker, or local |

**What works:**
- No account required — "tell the app who you are within a group"
- Self-hostable for full data sovereignty
- AI receipt scanning as opt-in, not requirement
- Community translation infrastructure
- 2.7k GitHub stars, active development

**What fails:** No recurring expenses yet. No Splitwise import yet. Smaller community means fewer integrations.

**Key insight:** The group-level identity model (no global account) is the right pattern for one-off trip use. Spliit proves this works at scale.

#### SplitPro (splitpro.app)
**The free, full-featured Splitwise clone.**

| Dimension | Detail |
|-----------|--------|
| Model | Free, open-source, self-hostable |
| Tech stack | Next.js, PWA |
| Split methods | Shares, percentage, exact amounts |
| Key features | Multi-currency, receipt uploads, Splitwise import, push notifications |
| PWA | Yes — installable on mobile |

**What works:**
- Free is the headline — explicit counter to Splitwise's freemium
- Splitwise import makes switching frictionless
- PWA means native-like experience without app store
- "Open source makes it hard to become evil"

**What fails:** Single developer (bus factor). Smaller community than Spliit.

**Key insight:** Import-from-Splitwise is a powerful migration tool. Lowering switching costs captures dissatisfied Splitwise users.

### Tier 4: Vietnamese Market

#### Rảnh Không (ranhkhong.com)
**Vietnamese web-based bill splitter.**

- Free, no sign-up required
- Supports VND, JPY, USD
- Group creation → add expenses → auto-calculate who owes whom
- Web-based, no app installation

**Key insight:** Exists but appears basic. No VietQR integration. No advanced split methods. The Vietnamese market has room for a purpose-built tool.

#### ShareBill (GitHub student project)
**Vietnamese travel expense splitter with VietQR.**

- Go backend + Next.js frontend + PostgreSQL
- VietQR integration via vietqr.io API
- "Collection Leader" model — centralizes settlement through one person
- Bidirectional QR: debtors pay leader, leader refunds overpayers
- Flexible split ratios (1, 1, 1.5, 3…)

**Key insight:** The Collection Leader model is interesting — it simplifies the payment graph from N×N to N×1. VietQR via vietqr.io API is the proven integration path for Vietnamese payment settlement.

---

## Part 3: Patterns That Work (Learn From Winners)

### 1. Zero-Friction Onboarding
**Who does it well:** Splid, Spliit, Tab, web-based tools
**Pattern:** No account required. Create a group, share a link, start logging. The "please download this app" conversation is the #1 adoption killer.
**Application to Trip Split Bill:** Already aligned — no backend, no login, share via URL. This is a core strength.

### 2. Progressive Disclosure
**Who does it well:** Spliit (opt-in AI features), splittalo (smart wizard)
**Pattern:** Show only what's needed. Advanced features exist but don't clutter the default experience. The expense form should be simple for simple expenses, complex only when needed.
**Application to Trip Split Bill:** The redesign proposal's card-based form grouping is the right approach. Tier 1 (name + amount) visible by default, tier 2 (payment details, split details) on demand.

### 3. Formula Transparency
**Who does it well:** This is Trip Split Bill's unique differentiator
**Pattern:** No other app in the landscape emphasizes showing the math. Splitwise shows balances but not per-expense formulas. Tricount shows totals but not breakdowns.
**Application to Trip Split Bill:** Double down on this. The formula preview is the trust-building element. Make it prominent, not buried.

### 4. Settlement as the Primary Output
**Who does it well:** ShareBill (VietQR), Splitwise (Venmo integration)
**Pattern:** Recording expenses is a means. The end is: "Here's exactly who pays whom, with payment details ready." Apps that stop at "you owe X" leave the job half-done.
**Application to Trip Split Bill:** Already strong — bank details, QR upload, VietQR generation, transfer notes, payment status tracking. The settlement flow is the product's strongest competitive position.

### 5. Debt Simplification
**Who does it well:** Splitwise, Settle Up, web-based tools
**Pattern:** Minimize the number of transfers. If A owes B 100 and B owes C 100, just have A pay C 100. The greedy algorithm is standard.
**Application to Trip Split Bill:** Already implemented (simplified + direct payback modes). Keep both — different groups have different preferences.

### 6. PWA Over Native
**Who does it well:** SplitPro, Spliit
**Pattern:** Progressive Web Apps provide native-like experience without app store friction. Install on home screen, works offline, push notifications.
**Application to Trip Split Bill:** Browser-only SPA is already close to PWA. Adding a service worker and manifest would make it installable.

---

## Part 4: Patterns That Fail (Learn From Losers)

### 1. Mandatory Account Creation
**Who does it poorly:** Splitwise (all participants must sign up)
**Why it fails:** For one-off trips, asking 6 people to create accounts before they can see expenses is absurd. Most won't do it. The organizer ends up doing everything alone.
**Lesson:** Group-level identity (Spliit's model) or no identity at all (Splid's model) is superior for trip-based use.

### 2. Paywalling Core Features
**Who does it poorly:** Splitwise (multi-currency, receipt scanning, charts behind $40/yr)
**Why it fails:** Users feel punished for using the app more. The daily entry cap + video ad combo is uniquely punishing.
**Lesson:** Core splitting functionality should be free and unlimited. Monetize convenience features (AI, integrations), not essentials.

### 3. Over-Engineered Core Flows
**Who does it poorly:** Splitwise (multi-screen expense entry)
**Why it fails:** The most-used action (adding an expense) should be the fastest. Every extra screen, tap, or field is friction in a social context where users need to log quickly and return to conversation.
**Lesson:** Amount + who paid + who shared — three inputs, one screen, done.

### 4. Information Overload Without Filtering
**Who does it poorly:** Splitwise (transaction log degrades over time)
**Why it fails:** Without search, filters, or visual hierarchy, a 50-expense trip becomes an unscannable wall of text.
**Lesson:** Category icons, date grouping, search/filter, and visual weight differences (amount size, color coding) are essential for lists beyond 10 items.

### 5. Broken Payment Loop
**Who does it poorly:** Splitwise (tracks debts, doesn't resolve them)
**Why it fails:** Users leave the app to pay, then forget to mark it as paid. The tool becomes a record of what happened, not a facilitator of what should happen.
**Lesson:** Payment details (bank account, QR code, transfer note) must live alongside the settlement instruction. One-tap "mark as paid" closes the loop.

### 6. Treating Money as Purely Transactional
**Who does it poorly:** Splitwise (2 AM notification about owing ₹20.25)
**Why it fails:** Money between friends is emotionally charged. Aggressive nudges feel like debt collection, not friendly reminders.
**Lesson:** Keep notifications neutral and batched. The tool should feel like a calculator, not a bill collector.

---

## Part 5: Trip Split Bill's Competitive Position

### What Makes This Project Unique

| Differentiator | Current State | Competitors |
|---------------|---------------|-------------|
| **Formula transparency** | Per-expense formula preview showing exact math | Nobody else does this |
| **Multiple payers per expense** | Fully supported with contribution validation | Splitwise: 1 payer only |
| **Payer ≠ participant** | Explicit checkbox, never auto-assumed | Most apps assume payer participates |
| **4 split methods** | Equal, exact, percentage, shares | Tricount: equal only; others: 2-3 methods |
| **VietQR generation** | Client-side via bank details | ShareBill uses API; others don't support |
| **No backend required** | Pure client-side, localStorage | All competitors require servers |
| **Shareable URL** | Base64-encoded trip in query param | Spliit: server-hosted; others: app-only |
| **Bilingual EN/VN** | Native Vietnamese with proper diacritics | No competitor has Vietnamese support |
| **Payment status tracking** | Mark settlement as paid, track locally | Splitwise: yes; others: basic or none |

### Where Trip Split Bill Is Weaker

| Gap | Impact | Competitors Who Do It Better |
|-----|--------|------------------------------|
| **No receipt scanning** | Manual entry for every expense | Tab (free), Splitwise (Pro), Spliit (opt-in AI) |
| **No multi-currency** | VND only | Splid (150+), Splitwise (100+), Tricount (30+) |
| **No recurring expenses** | Can't track monthly subscriptions | Splitwise, Tricount |
| **No search/filter in expense list** | Hard to find specific expenses in large trips | Spliit (search), Splitwise (partial) |
| **No offline sync** | Works offline (localStorage) but no cross-device sync | Splid (background sync), Tricount (web) |
| **No PWA installability** | Browser-only, no home screen icon | SplitPro, Spliit |
| **No Splitwise import** | Can't capture dissatisfied Splitwise users | SplitPro |
| **30% strings hardcoded** | Incomplete i18n | Spliit (Weblate community translations) |

### The Strategic Opportunity

Trip Split Bill occupies a unique position that no competitor matches:

**"The transparent, Vietnamese-first, no-backend trip expense splitter with payment-ready settlement."**

This is not a Splitwise replacement (that's SplitPro's game). This is not a traveler's companion (that's Splid's game). This is a **trip settlement tool** — designed for the specific workflow of: record expenses during trip → calculate who owes whom → generate payment instructions with bank/QR → track who's paid.

The Vietnamese angle is particularly defensible:
- VietQR is the standard payment method in Vietnam
- No international competitor supports it natively
- VND's high denominations (100K, 200K, 500K notes) make precision important
- Vietnamese diacritics in UI show local commitment
- The "Collection Leader" pattern (from ShareBill) matches Vietnamese group dynamics where one person typically organizes and collects

---

## Part 6: Recommendations for Product Direction

### Highest-Impact Improvements (Based on Competitive Analysis)

1. **Make formula transparency the hero feature.** No competitor does this. Position it as "the app that shows you exactly why you owe what you owe." This builds trust, which is the #1 emotional barrier in money-between-friends scenarios.

2. **Complete the i18n.** The 30% hardcoded strings undermine the Vietnamese-first positioning. Use proper diacritics everywhere. This is table-stakes for the target market.

3. **Add expense list search/filter.** As trips grow past 15-20 expenses, the list becomes unscannable. Category icons from the redesign help, but search-by-member and filter-by-category are essential.

4. **Consider PWA manifest + service worker.** The app is already browser-only. Adding installability (home screen icon, offline caching) is low effort for meaningful UX improvement.

5. **Keep the no-backend constraint as a feature, not a limitation.** Frame it as "your data never leaves your device." This is increasingly valuable as privacy concerns grow. Spliit and Splid prove this resonates.

6. **Don't chase Splitwise's feature set.** Receipt scanning, multi-currency, recurring expenses — these are Splitwise's game. Trip Split Bill should be the best at trip settlement, not a worse version of a general-purpose tool.

### What NOT to Build

- **Don't add user accounts.** The no-account model is a competitive advantage. Spliit proves group-level identity works.
- **Don't add real-time collaboration.** The share-URL model is sufficient for trip use cases. Real-time sync requires a backend, which breaks the core constraint.
- **Don't add payment processing.** Settlement instructions with bank details + QR codes is the right abstraction. Actual payment happens in banking apps, where it belongs.
- **Don't add AI receipt scanning.** It's a nice-to-have that requires external API dependencies. The core value is in the calculation engine and settlement flow, not data entry convenience.

---

## Part 7: UX Design Patterns from Splitwise Redesign Case Studies

### Key Findings from 4 Independent UX Redesign Projects

#### 1. The Mid-Journey Friction Problem (Vanessa Moreno, 2023)
- **User journey mapping** revealed the emotional curve "dips during expense entry and splitting, confirming that these two stages carry the highest cognitive load"
- Start and end of the journey showed positive sentiment
- **Implication:** The expense form is the single highest-impact redesign target

#### 2. Terminology Confusion (Vanessa Moreno, 2023)
- Competitive analysis of Splittr, Tricount, and Settle Up found three major pain points:
  1. **Confusing terminology** — users struggled with language throughout the app
  2. **Unintuitive split configuration** — setting up how expenses were divided was cumbersome
  3. **Fragmented navigation** — information and actions scattered across too many sections
- **Implication:** Clear labels and simplified IA are as important as visual design

#### 3. Information Architecture Consolidation (Vanessa Moreno, 2023)
- App consolidated from multi-section to **three primary areas**: Groups, Add Expense, Friends
- "Add Expense" elevated to be accessible from any screen
- Settlement integrated directly into group/friend pages (contextual, not standalone)
- **Implication:** The most common action should be reachable in 1 tap from anywhere

#### 4. Tedious Expense Entry (Aubergine Solutions)
- Adding an expense surfaces multiple input fields simultaneously while hiding key elements
- Quick expenses are typically created in social settings where users need to log and return to conversation fast
- The cluttered interface forces prolonged phone engagement, which works against the social context
- **Implication:** Amount-first, minimal-field entry for the common case

#### 5. Excessive Steps for Core Actions (Aubergine Solutions)
- The two flagship features — adding expense and settling up — require navigating multiple screens
- No batch settlement: users cannot settle multiple debts at once
- **Implication:** Single-screen expense entry, one-tap settle-all

#### 6. Information Overload on Group Landing Page (Aubergine Solutions)
- Transaction log packed with text, visual, and numeric elements with poor hierarchy
- Finding specific transactions requires scrolling through entire history
- Long-term usability degrades as transaction history grows
- **Implication:** Category icons, search/filter, date grouping, visual weight differences

#### 7. Emotionally Intrusive Notifications (Aubergine Solutions)
- A user received a 2 AM email about owing ₹20.25 to a cousin
- Splitwise fails to account for social sensitivity of money-related nudges
- **Implication:** Keep notifications neutral, batched, and respectful of social dynamics

#### 8. Proposed Design Patterns (Aubergine Solutions)
- **FAB button** consolidating settling up, adding expenses, and viewing drafts
- **Amount-first design:** Prioritize the amount field over description
- **Save as draft** feature for deferred entry
- **Bottom sheet** for payer selection (consolidated overlay, not new screen)
- **Filters and search** across categories, amounts, and member names
- **Icons and avatars** to reduce cognitive load from text-heavy layouts

### Design Principles Extracted

| Principle | Application |
|-----------|-------------|
| **Progressive disclosure** | Show only essential fields initially; reveal complexity on demand |
| **Bottom sheet** | Payer/participant selection consolidated into overlay rather than new screen |
| **FAB (Floating Action Button)** | Primary actions grouped for quick access |
| **Filter + search** | Managing growing data sets on the transaction log |
| **Draft/save state** | Respecting users' time in social contexts |
| **Visual indicators** | Icons and avatars replacing text-heavy displays |
| **Contextual actions** | Settlement embedded where the user's mental model lives |

---

## Part 8: Vietnamese Payment Ecosystem Deep Dive

### VietQR Standard
- **Developer:** NAPAS (National Payment Corporation of Vietnam) + Vietnam Banks Association
- **Standard:** EMVCo-based QR code format, standardized by State Bank of Vietnam (Decision 2525/QD-NHNN, Nov 2024)
- **Scope:** Bank-to-bank transfers via QR code scanning through mobile banking apps
- **Currency:** VND only
- **Min transaction:** 2,000 VND
- **Max transaction:** 3,000,000,000 VND
- **Processing:** Instant confirmation
- **Adoption:** QR Pay transaction volume grows ~40% per year in Vietnam

### How VietQR Works (User Flow)
1. Merchant/member displays a QR code
2. Consumer opens banking app (Techcombank, Vietcombank, etc.) or e-wallet (MoMo, ZaloPay)
3. Scans the QR code
4. Reviews transaction details and amount
5. Authenticates via PIN or biometric
6. Payment completes in 2-10 seconds

### QR Code Technical Format (EMVCo-based)
- Uses TLV (Tag-Length-Value) encoding
- Two-digit ID system (00-99)
- Key fields: PayloadFormatIndicator (00), MerchantAccountInformation (02-51), TransactionCurrency (53), TransactionAmount (54), CountryCode (58), MerchantName (59), CRC (63)
- Vietnamese bank accounts encoded in MerchantAccountInformation template
- Bank BIN + Account Number are the core identifiers

### Current Project QR Implementation
The project currently generates QR codes using a custom format:
```
TRIP_SPLIT_BILL|BANK=Vietcombank|BANK_CODE=970436|ACCOUNT=102345678910|NAME=DUY NGUYEN|AMOUNT=300000|NOTE=Da Nang trip
```
This is NOT a standard VietQR format. Banking apps cannot scan this as a payment QR.

**Opportunity:** Implement proper VietQR EMV payload generation client-side. The `img.vietqr.io` service provides a simple API:
```
https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact.jpg
```
This generates a standard VietQR that any Vietnamese banking app can scan and process as a payment.

### Vietnamese Payment Methods Compared

| Method | Type | Users | Key Strength |
|--------|------|-------|-------------|
| **MoMo** | Super app wallet | 40M+ | Largest user base, widest merchant reach |
| **ZaloPay** | Messenger-integrated wallet | Growing | Zalo integration, social commerce |
| **VietQR** | National QR standard | All banks | Cross-wallet, cross-bank interoperability |

### Vietnamese Bill-Splitting Culture
- Vietnamese group meals are communal — dishes placed in center, everyone takes from same plates
- The bill "doesn't always match the structure of the meal" — no direct person-to-portion mapping
- Settling up is "social before it is numerical"
- In smaller familiar groups, "people adjust without needing to define the system"
- In larger/mixed groups, different assumptions collide — some want precision, others prefer equal division
- Restaurants typically expect a single payment, adding pressure to self-organize quickly
- The "Collection Leader" pattern (one person collects all, then distributes) is common in Vietnamese group dynamics

---

## Part 9: Settlement Algorithm Analysis

### How Splitwise's Algorithm Works

**The Problem:** Naive settlement requires each person to pay every other person they owe, creating potentially many transactions.

**Graph Theory Framework:**
- Each person is a node in a directed weighted graph
- Edges represent debts between people
- Goal: produce an equivalent graph preserving net balances while minimizing edges

**Splitwise's Greedy Approach:**
1. Compute net balances for all nodes (positive = owed money, negative = owes money)
2. Iteratively match the largest creditor with the largest debtor
3. Settle as much as possible, update balances, repeat
4. Complexity: O(V²) time, O(V) space

**Three Design Principles (from Splitwise founder Marshall Weir):**
1. Net amounts remain unchanged for everyone after settlement
2. No one ends up owing someone they didn't owe before
3. No one owes more than their original amount

**Practical Trade-off:** Splitwise breaks Rule #2 in favor of computational efficiency. Strictly enforcing all three would require solving an NP-complete problem (Subset Sum Problem).

**Trip Split Bill's Current Implementation:**
- Uses the same greedy approach for simplified settlement
- Also supports direct payback (expense-level debt relationships)
- Both modes are correctly implemented with proper netting of reverse payments

---

## Part 10: Current Codebase Analysis

### Architecture Quality

**Strengths:**
- Clean domain layer (`src/domain/`) — pure functions, no React deps
- Integer minor units for money (no floating point)
- 4 split methods all correctly implemented with stable rounding
- Both simplified and direct payback settlement working
- 11 unit tests covering core logic
- 12 E2E tests covering desktop + mobile
- Proper i18n structure with EN/VN dictionaries
- Category icons already implemented in expense list

**Weaknesses (from redesign proposal):**
- `App.tsx` is ~583 lines (reduced from 1,581 in the redesign proposal — extraction already happened)
- ~30% of strings still hardcoded in components
- Vietnamese translations use ASCII-only (no diacritics)
- QR generation uses custom format, not standard VietQR
- No empty states for new trips
- No search/filter in expense list
- No PWA manifest or service worker
- Summary rail hidden on mobile

### Data Model Assessment

The data model is well-designed for the problem:
- `Trip` contains `Member[]`, `Expense[]`, `Transfer[]`
- `Expense` supports multiple `PayerContribution[]` and `ParticipantShare[]`
- `SplitMethod` enum covers all 4 methods
- `PaymentInfo` on Member stores bank details + QR
- `Transfer` has `status: "pending" | "paid"` for tracking

**One gap:** No `category` field on Expense in the type definition, but it's used in the component code. The type should be updated to include `category?: string` (it already exists in the actual type).

### Test Coverage Assessment

**Unit tests (11):** Cover money formatting, all 4 split methods, balance calculations, transfers, settlement algorithms, JSON round-trip, CSV export, validation.

**E2E tests (12):** Cover section navigation, expense CRUD, member bank edit, QR upload, share link loading. Runs on both desktop (Chromium) and mobile (Pixel 7).

**Missing:**
- No component tests (React Testing Library installed but unused)
- No E2E tests for custom split expense creation
- No E2E tests for marking payment as paid
- No E2E tests for JSON export/import round-trip
- No visual regression tests

---

## Part 11: Synthesis — What This Project Should Be

### The One-Line Position
"The transparent, Vietnamese-first, no-backend trip expense splitter with payment-ready settlement."

### The Three Core Differentiators
1. **Formula transparency** — show exactly why each person owes what they owe (no competitor does this)
2. **VietQR-native settlement** — generate standard VietQR codes that any Vietnamese banking app can scan (no competitor does this)
3. **No-backend privacy** — data never leaves the device, share via URL/file (few competitors do this)

### The Three Highest-Impact Improvements
1. **Complete i18n with proper Vietnamese diacritics** — table-stakes for target market
2. **Implement proper VietQR EMV payload** — replace custom QR format with standard banking-app-scannable codes
3. **Add expense list search/filter** — essential for trips with 15+ expenses

### What NOT to Build
- User accounts (keep no-account model)
- Real-time collaboration (breaks no-backend constraint)
- Payment processing (settlement instructions are the right abstraction)
- AI receipt scanning (external API dependency)
- Multi-currency (VND-only is a feature, not a limitation, for the target market)
- Recurring expenses (Splitwise's game, not this project's)
