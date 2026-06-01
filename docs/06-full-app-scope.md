# Full App Scope

## Product Direction

This is not an MVP. The target is a complete no-database web app for trip expense splitting, settlement, payment instructions, bilingual review, and QA-backed release quality.

Engineering can still deliver in phases internally, but the product requirement is the full app.

## Complete Feature Set

### Trip Management

- Create multiple trips.
- Edit trip name.
- Set default currency.
- Archive/delete local trips.
- Import/export trips.

### Members

- Add/edit/archive members.
- Store payment details for every member.
- Store bank name, bank code, account number, account holder, transfer note template.
- Upload QR image.
- Generate VietQR when possible.

### Expenses

- Add/edit/delete expenses.
- Support one payer.
- Support multiple payers on one expense.
- Select shared participants per expense.
- Support payer included or excluded.
- Support categories, dates, notes, and optional receipt image.

### Split Methods

- Equal split.
- Exact amount split.
- Percentage split.
- Share/weight split.

### Transfers

- Add reimbursements/transfers.
- Mark settlement instructions as pending or paid locally.
- Show remaining amount after transfers.

### Calculation

- Show total paid.
- Show total owed.
- Show transfer paid/received.
- Show final balance.
- Guarantee balances sum to zero after rounding.
- Show formulas for every expense.

### Settlement

- Simplified settlement: minimize number of payments.
- Direct payback settlement: pay original payers based on expense-level debts.
- Include receiver payment details and QR.
- Make account number and transfer note copyable.

### Sharing And Export

- Read-only shared summary.
- JSON export/import.
- CSV export.
- Print-friendly HTML/PDF.
- Optional share URL when data is small enough.

### Language

- English.
- Vietnamese.
- Language switch without data loss.
- Localized number/currency formatting.

### QA And Release

- Unit tests for calculation.
- Component tests for user interactions.
- E2E tests for main flows.
- QA real-user test pass.
- Bug-fix loop where practical QA bugs become failing automated tests before fixes.

## Still Not Included Unless Product Changes Constraint

- Server-side database.
- Required user account.
- Real-time cloud collaboration.
- Automatic bank transaction confirmation.
- In-app payment processing.
- Native iOS/Android apps.

