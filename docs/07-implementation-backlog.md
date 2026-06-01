# Implementation Backlog

## Five Delivery Sections

### 1. Trips & Members

Goal: manage local trips, members, and payment profiles.

Stories:

- Create, select, duplicate, and delete local trips.
- Add, edit, and archive members.
- Add payment profile fields: bank name, bank code, account number, account holder, transfer note, QR image.
- Keep archived members available for historical calculations.

Acceptance:

- User can manage multiple trips without a backend.
- Member used in expenses is not silently deleted.
- Payment info appears in settlement instructions.

### 2. Expenses & Splits

Goal: record realistic trip expenses.

Stories:

- Add expenses with one payer.
- Add expenses with multiple payers.
- Select participants per expense.
- Support payer included or excluded.
- Support equal, exact, percentage, and share split.
- Show formula preview before saving.

Acceptance:

- Payer contributions must equal expense amount.
- Split participant shares must equal expense amount.
- Every saved expense is auditable by formula.

### 3. Balances & Settlement

Goal: calculate balances and payment instructions.

Stories:

- Show total paid, owed, transfers, and final balance per member.
- Generate simplified settlement.
- Generate direct payback settlement.
- Mark settlement as paid locally.
- Add reimbursements/transfers.

Acceptance:

- Balances always sum to zero.
- Settlement payments never show zero or negative amounts.
- Paid transfers reduce remaining balances correctly.

### 4. Sharing & Payment

Goal: let members review and transfer money.

Stories:

- Export/import editable JSON.
- Export CSV.
- Print/save PDF summary.
- Copy share link when payload is small enough.
- Show receiver bank details and QR.
- Generate QR from payment content when possible.

Acceptance:

- Shared summary is read-only.
- Payment details are visible only after explicit export/share.
- App warns users that shared files include payment details.

### 5. QA & Release

Goal: ship with real-user QA and regression tests.

Stories:

- Unit tests for money, splits, balances, settlements, import/export.
- E2E tests for desktop and mobile.
- QA scripts for host and member roles.
- Bug template and severity policy.

Acceptance:

- P0/P1 bugs are closed before release.
- Repeatable QA bugs become failing automated tests where practical.
- Build, unit tests, and E2E tests pass.

## Current Build Milestones

1. Project scaffold and docs: done.
2. Domain TDD for calculation and import/export: done.
3. Five-section React app shell: done.
4. Browser E2E smoke test: done.
5. Next: deepen UI tests, add edit/delete workflows, add QR upload, harden share URL size handling.

