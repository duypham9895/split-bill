# Engineering Architecture

## Architecture Summary

The app has no backend service and no database. Engineering should still separate responsibilities as if FE and BE work together:

- Domain engine: pure TypeScript calculation logic
- Persistence adapter: localStorage or IndexedDB, JSON import/export
- Sharing adapter: read-only HTML/PDF/CSV export and optional encoded URL
- UI layer: React components
- i18n layer: English/Vietnamese dictionaries and formatting helpers

This gives backend-style correctness without a server.

## Proposed Stack

- Vite
- React
- TypeScript
- Vitest
- React Testing Library
- Playwright
- pnpm

## Suggested File Structure

```text
src/
  app/
    App.tsx
    app-state.ts
  domain/
    money.ts
    split.ts
    settlement.ts
    transfers.ts
    types.ts
  persistence/
    local-storage.ts
    indexed-db.ts
    import-export.ts
    share-url.ts
    export-html.ts
    export-csv.ts
    export-pdf.ts
  i18n/
    en.ts
    vi.ts
    format.ts
  components/
    members/
    expenses/
    balances/
    settlement/
    share/
    ui/
  tests/
    fixtures/
```

## Domain Types

```ts
type Member = {
  id: string;
  name: string;
  active: boolean;
  payment?: PaymentInfo;
};

type PaymentInfo = {
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
  transferNoteTemplate?: string;
  qrImageDataUrl?: string;
};

type PayerContribution = {
  memberId: string;
  amountMinor: number;
};

type SplitMethod = "equal" | "exact" | "percentage" | "shares";

type ParticipantShare = {
  memberId: string;
  exactAmountMinor?: number;
  percentage?: number;
  shares?: number;
};

type Expense = {
  id: string;
  title: string;
  amountMinor: number;
  payers: PayerContribution[];
  participants: ParticipantShare[];
  splitMethod: SplitMethod;
  category?: string;
  date: string;
  note?: string;
  receiptImageDataUrl?: string;
  createdAt: string;
  updatedAt: string;
};

type Transfer = {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amountMinor: number;
  date: string;
  note?: string;
  status: "pending" | "paid";
};

type Trip = {
  id: string;
  name: string;
  currency: "VND";
  language: "en" | "vi";
  members: Member[];
  expenses: Expense[];
  transfers: Transfer[];
};
```

## Money Representation

Use integer minor units internally.

For VND, minor unit can be `1 VND`.

```text
300000 VND => 300000
```

Do not use floating point numbers for balances.

## Rounding

When an amount does not divide evenly:

```text
baseShare = Math.floor(amount / participantCount)
remainder = amount % participantCount
```

Distribute `+1` minor unit to the first `remainder` participants in a stable order.

Example:

```text
100 / 3
baseShare = 33
remainder = 1
shares = 34, 33, 33
```

The sum of shares must always equal the original expense amount.

## Split Method Calculation

Every split method must return a map of:

```text
memberId -> amountMinor
```

Invariants:

```text
sum(participant shares) = expense amount
all shares >= 0
all selected participants exist
```

### Equal

Split equally across all selected participants and resolve any remainder with stable ordering.

### Exact Amount

Validate that exact participant amounts sum to the expense amount.

### Percentage

Validate that participant percentages sum to `100%`, then round using the same stable remainder strategy.

### Shares / Weights

Validate every selected participant has a positive weight, then allocate:

```text
amount * memberWeight / totalWeight
```

Resolve remainder with stable ordering.

## Calculation Algorithm

For each expense:

1. Validate payer members exist.
2. Validate all payer contributions exist and sum to the expense amount.
3. Validate participants exist.
4. Split amount among participants using the selected split method.
5. Add each payer contribution to that payer's `totalPaid`.
6. Add calculated share to each participant's `totalOwed`.

For each transfer:

1. Add transfer amount to sender's `transferPaid`.
2. Add transfer amount to receiver's `transferReceived`.

Then:

```text
balance = totalPaid - totalOwed - transferReceived + transferPaid
```

The sum of all balances must equal `0`.

## Settlement Algorithm

Settlement should support two modes.

### Simplified Settlement

1. Build debtors from negative balances.
2. Build creditors from positive balances.
3. Sort both lists by absolute amount descending for stable, simpler output.
4. Match debtor to creditor.
5. Emit payment instruction.
6. Reduce both balances.
7. Repeat until all balances are zero.

Invariant:

```text
sum(settlement payments paid by debtor) = abs(debtor.balance)
sum(settlement payments received by creditor) = creditor.balance
```

### Direct Payback Settlement

Generate original payer-focused payment instructions from expense-level shares:

```text
for each expense participant:
  participant owes participantShare
  participant should repay payer contributions proportionally
```

This mode may produce more payments than simplified settlement, but it matches the original payer relationship more directly.

## Persistence

### LocalStorage / IndexedDB

Use localStorage for lightweight state. Use IndexedDB if QR images and receipt images make localStorage too large.

Key:

```text
split-bill:v1:trips
```

### JSON Export

Export full editable trip data.

### JSON Import

Validate schema before loading.

### HTML Export

Generate a read-only final summary. This is the best no-database sharing method when QR images are included.

### CSV Export

Export expenses, balances, and settlements for spreadsheet review.

### PDF Export

Use print-friendly HTML first. Browser "Save as PDF" is acceptable unless product requires a generated PDF file.

### Share URL

Encode trip data into URL only when payload is small. Do not include QR or receipt image data in the URL by default.

## VietQR

For Vietnamese bank transfer UX, support both:

1. Manual QR image upload.
2. Generated VietQR using bank ID, account number, amount, and transfer note when available.

Engineering must decide whether VietQR generation uses a client-side EMV QR generator, an external API, or both. If an external API is used, the app must clearly disclose that payment data is sent to that API.

## Security And Privacy

- Payment details are personal financial data.
- Because there is no backend, data stays in the user's browser unless they export/share it.
- Shared HTML/JSON files contain sensitive payment information.
- Add clear copy before export: "Anyone with this file can see payment details."
- Do not upload QR images to any app server.
- If using a third-party VietQR API, disclose exactly what data is sent.

## Engineering Debate Topics

- LocalStorage vs IndexedDB for QR and receipt image storage.
- Client-side VietQR generation vs external API generation.
- Print-friendly PDF vs generated PDF file.
- Whether direct payback settlement should allocate repayment proportionally across multiple payers or preserve payer contribution order.
- Whether to initialize Git and CI before app scaffolding.

