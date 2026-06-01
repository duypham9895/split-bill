# PRD: Trip Split Bill Full App

## Product Summary

Trip Split Bill is a full browser-only web app that helps a travel group record shared expenses, calculate who owes whom, show formulas clearly, and generate transfer-ready settlement instructions with bank account and QR details.

The app is designed for real trip behavior: different people pay at different times, one expense can have one or multiple payers, and an expense may be for everyone or only some members.

## Target Users

### Trip Host

The person who creates the trip, adds members, records expenses, checks formulas, manages payment details, and shares the final settlement.

### Trip Member

The person who reviews the final summary, checks their own balance, verifies formulas, and transfers money to the correct receiver.

## Problem

After a trip, groups often argue or get confused because:

- One person did not pay everything.
- Some expenses were only for some members.
- The payer may or may not be included in the shared expense.
- One bill can be paid by multiple people.
- Some expenses are not equal split.
- Manual spreadsheets are hard to verify.
- Final payment instructions are unclear.
- People still need bank account or QR details after calculation.
- People need to track whether settlement payments are done.

## Product Goals

- Make expense entry flexible enough for real trips.
- Make the math transparent with formulas.
- Minimize the number of final transfers when users choose simplified settlement.
- Support direct payback to original payers when users prefer that.
- Let receivers provide bank account and QR information.
- Support generated VietQR where practical and manual QR upload as fallback.
- Let the host share a read-only final summary.
- Let members track transfer status locally.
- Support equal, exact amount, percentage, and share-based splits.
- Support one or multiple payers for one expense.
- Support reimbursements/transfers as first-class records.
- Support English and Vietnamese.
- Work without a backend or database.

## Product Constraints

- No server-side database.
- No required login.
- No server-side payment processing.
- No automatic bank transaction confirmation.
- No sensitive payment details are uploaded to an app server.
- Shared files/links can expose payment details to anyone who receives them, so the app must warn users before sharing.

## Full App Scope

This is not an MVP. The product requirement is the complete local-first web app.

Engineering may still deliver in internal phases for quality, but the target product includes:

- Multiple trips stored locally.
- Full trip editor.
- Member profiles with payment details.
- Manual QR upload.
- VietQR generation when bank details are sufficient and the user chooses to generate it.
- One or multiple payers per expense.
- Equal split.
- Exact amount split.
- Percentage split.
- Share/weight split.
- Expense categories.
- Expense date.
- Notes.
- Optional receipt image stored locally.
- Reimbursements/transfers.
- Formula breakdown for every expense.
- Balance table.
- Simplified settlement mode.
- Direct payback settlement mode.
- Payment status tracking for settlement instructions.
- Read-only shared summary.
- Export/import JSON.
- Export CSV.
- Export print-friendly HTML/PDF.
- English and Vietnamese UI.

## Not Included Unless Product Changes The Constraint

- Server-side database.
- Required user accounts.
- Real-time cloud collaboration.
- Automatic bank transaction confirmation.
- In-app payment processing.
- Native iOS/Android apps.

## Core User Stories

### Trips

As a host, I can create and manage multiple trips locally so separate trips do not mix data.

As a host, I can export and import a trip so I can back it up or move it between browsers.

### Members

As a host, I can add team members so expenses can be assigned to people.

As a host, I can edit a member name so mistakes can be fixed.

As a host, I can archive a member who is already used in expenses so old calculations stay valid.

As a host, I can add payment information for each member so settlement instructions are transfer-ready.

As a host, I can upload a QR image or generate a VietQR for a receiver so other members can transfer money quickly.

### Expenses

As a host, I can add an expense with title, amount, one or multiple payers, and shared participants.

As a host, I can select only some members for an expense so partial participation is handled correctly.

As a host, I can exclude the payer from the shared participants so cases like "Duy paid for Alvin and HA only" calculate correctly.

As a host, I can split an expense equally, by exact amount, by percentage, or by shares/weights.

As a host, I can add category, date, note, and optional receipt image for record keeping.

As a host, I can see the formula for each expense so the result is auditable.

### Transfers

As a host, I can add a reimbursement/transfer so already-paid settlements are reflected in balances.

As a host or member, I can mark a settlement instruction as paid locally so the remaining payment plan is clear.

### Balances

As a host, I can see each member's total paid, total owed, transfer paid/received, and final balance.

As a member, I can see why I owe or receive money.

### Settlement

As a host, I can generate a simplified settlement plan so fewer transfers are needed.

As a host, I can view direct payback instructions when the group wants each person to repay original payers.

As a member, I can see who to pay, how much to pay, and the receiver's payment details.

### Sharing

As a host, I can share a read-only final summary so everyone can review the math.

As a member, I can open the summary without needing an account.

## Functional Requirements

### Trip

- User can create multiple trips.
- User can set trip name.
- User can set currency, default `VND`.
- User can duplicate a trip.
- User can archive/delete a trip locally.
- App supports English and Vietnamese.
- Data is saved locally in the browser.
- App can export/import trip data.

### Members

Each member has:

- ID
- Display name
- Optional bank name
- Optional bank code/BIN for VietQR generation
- Optional bank account number
- Optional account holder name
- Optional transfer note template
- Optional QR image
- Optional default payment preference
- Active/inactive status

Validation:

- Name is required.
- Duplicate names should be warned against.
- Bank fields are optional.
- QR image should be limited by file size.
- A member referenced by expenses cannot be hard-deleted without resolving those expenses; they can be archived/inactive.

### Expenses

Each expense has:

- ID
- Title
- Amount
- One or multiple payers
- Shared participant member IDs
- Split method: equal, exact amount, percentage, or shares/weights
- Category
- Date
- Optional note
- Optional receipt image
- Created/updated timestamp

Validation:

- Title is required.
- Amount must be greater than `0`.
- At least one payer is required.
- Sum of payer contributions must equal expense amount.
- At least one shared participant is required.
- Participants must exist.
- Exact split participant amounts must equal expense amount.
- Percentage split must total `100%`.
- Share/weight split must have positive shares.

### Transfers And Reimbursements

Each transfer has:

- ID
- From member ID
- To member ID
- Amount
- Date
- Optional note
- Status: pending or paid

Transfers reduce the sender's debt and reduce the receiver's credit.

Validation:

- From and to members are required.
- From and to cannot be the same member.
- Amount must be greater than `0`.

### Calculation

For each expense:

```text
memberShare = calculated from selected split method
```

For each member:

```text
totalPaid = sum(member payer contribution in all expenses)
totalOwed = sum(member share in all expenses)
transferPaid = sum(transfers from member)
transferReceived = sum(transfers to member)
balance = totalPaid - totalOwed - transferReceived + transferPaid
```

Balance meaning:

```text
balance > 0 => member should receive money
balance < 0 => member should pay money
balance = 0 => member is settled
```

All balances must sum to zero after applying rounding.

### Split Methods

#### Equal Split

```text
share = amount / numberOfSharedParticipants
```

Rounding remainder is distributed using a stable order so shares always sum to the original amount.

#### Exact Amount Split

Each selected participant has a fixed owed amount.

```text
sum(participant exact amounts) = expense amount
```

#### Percentage Split

Each selected participant has a percentage.

```text
participantShare = amount * participantPercentage
sum(percentages) = 100%
```

Rounding must be resolved so final shares sum to the original amount.

#### Share/Weight Split

Each selected participant has a positive share count.

```text
participantShare = amount * participantWeight / totalWeight
```

### Settlement

The app should support two settlement modes.

#### Simplified Settlement

The app should simplify settlement by matching debtors with creditors:

```text
payment = min(abs(debtor.balance), creditor.balance)
```

Then create:

```text
debtor pays creditor payment
```

Repeat until all balances are near zero.

#### Direct Payback Settlement

The app should also support a direct payback view based on original expense-level debts, useful when a group wants each person to pay the original payer instead of a simplified creditor.

### Formula Transparency

Each expense must show:

```text
Expense amount
Selected participants
Split method
Formula
Each person's share
Payer contribution amount
Payer's own share if included
Net effect
```

Example:

```text
Duy paid 300,000 VND for Alvin, HA, Anh TA.
300,000 / 3 = 100,000 each.
Duy is not included, so Duy receives 300,000.
Alvin owes 100,000, HA owes 100,000, Anh TA owes 100,000.
```

### Payment Details

Settlement instructions should include receiver payment details when available:

```text
Alvin pays Duy 100,000 VND
Bank: Techcombank
Account: 123456789
Account holder: DUY NGUYEN
QR: visible QR image
Transfer note: Trip payment - Alvin
```

Payment details should support:

- Manual bank details.
- Manual QR upload.
- Generated VietQR when possible.
- Copyable account number.
- Copyable transfer note.
- Payment status: unpaid, paid, confirmed locally.

### Sharing

The full app should support:

- Export JSON for backup/edit later.
- Import JSON to continue editing.
- Export read-only HTML summary for sharing.
- Export CSV for spreadsheet review.
- Print/save PDF from the read-only summary.
- Shareable URL with encoded data when payload is small enough.

Important constraint:

- QR images should not be placed into a share URL by default because base64 images can make URLs too large.
- For full summaries with QR or receipt images, exported HTML/JSON is preferred over URL-only sharing.

## Bilingual Requirement

Languages:

- English
- Vietnamese

The app should allow switching language without losing entered data.

All visible UI text must come from translation keys, including:

- Buttons
- Labels
- Empty states
- Error messages
- Formula text
- Settlement instructions

## Success Metrics

- A user can create a full trip settlement without reading instructions.
- A member can understand why they owe money from the shared summary.
- Final balances sum to zero after rounding.
- Settlement instructions include enough bank/QR info to transfer manually.
- Core calculation tests cover full, partial, payer-included, payer-excluded, multiple-payer, exact, percentage, share-based, transfer, and rounding cases.
- A QA user can complete full-trip, member-review, Vietnamese, import/export, and payment-status scenarios without a P0/P1 bug.

## Open Questions

- Should generated VietQR be implemented using an external API, a client-side EMV generator, or both?
- Should receipt images be allowed in exported summaries, or only in local editable trip data?
- Should the app support non-VND currencies with manual exchange rates from the first full release?
- Should payment status be visible in shared read-only summaries, or only in the host's local editable copy?

