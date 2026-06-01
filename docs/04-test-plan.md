# Test Plan

## Test Strategy

Build with TDD:

1. Write failing domain tests first.
2. Implement minimum logic to pass.
3. Refactor while keeping tests green.
4. Add component and E2E tests after domain behavior is reliable.

QA must then test the product as real users. QA testing does not replace automated tests; it feeds them. When QA finds a bug, engineering should reproduce it, add a failing automated test where practical, fix it, rerun regression checks, and send it back to QA for confirmation.

## Unit Test Areas

### Money Parsing And Formatting

Happy cases:

- Parse `300000` as `300000`.
- Format `300000` as `300,000 VND` in English.
- Format `300000` as `300.000 VND` in Vietnamese.

Worst cases:

- Reject negative amount.
- Reject zero amount.
- Reject empty amount.
- Reject non-numeric amount.

Edge cases:

- Large amount.
- Whitespace around input.
- Avoid `-0 VND`.

### Expense Validation

Happy cases:

- Valid expense with payer included.
- Valid expense with payer excluded.
- Valid expense shared by all members.
- Valid expense shared by one member.
- Valid expense with multiple payers.
- Valid exact amount split.
- Valid percentage split.
- Valid share/weight split.

Worst cases:

- Missing title.
- Missing amount.
- Amount is zero.
- Missing payer.
- Payer does not exist.
- Payer contributions do not sum to expense amount.
- Empty shared participant list.
- Shared participant does not exist.
- Exact split amounts do not sum to expense amount.
- Percentage split does not total `100%`.
- Share/weight split has zero or negative weight.

Edge cases:

- Duplicate shared participant IDs.
- Deleted member referenced by expense.
- Same title used twice.

### Split Calculation

Happy cases:

- Duy pays `300000` for Duy, Alvin, HA.
- Duy pays `300000` for Alvin, HA, Anh TA.
- Alvin pays `200000` for Alvin and Duy.
- Multiple payers across multiple expenses.
- Duy and Alvin both pay one `500000` expense with payer contributions of `300000` and `200000`.
- Exact split: Duy pays `600000`; Alvin owes `100000`, HA owes `200000`, Anh TA owes `300000`.
- Percentage split: Duy pays `1000000`; Duy owes `10%`, Alvin `20%`, HA `30%`, Anh TA `40%`.
- Share split: Duy pays `400000`; Duy has `1` share, Alvin has `1` share, HA has `2` shares.

Worst cases:

- Expense with no shared participants should fail validation.
- Expense with invalid amount should fail validation.

Edge cases:

- `100 / 3` should produce shares summing to `100`.
- Payer excluded from shared participants receives full amount back.
- Payer included receives amount minus own share.
- Multiple-payer expense preserves total paid and total owed invariants.
- Percentage rounding still sums to original amount.
- Share/weight rounding still sums to original amount.
- Balance sum must equal zero.

### Transfers And Payment Status

Happy cases:

- Add transfer from Alvin to Duy and balances update.
- Mark settlement instruction as paid locally.
- Paid transfer appears in summary.

Worst cases:

- Reject transfer from member to themself.
- Reject transfer with zero amount.
- Reject transfer with missing sender or receiver.

Edge cases:

- Transfer overpays a previous debt and changes who should receive/pay.
- Deleting a transfer restores previous balances.
- Payment status does not alter historical expense formulas.

### Settlement

Happy cases:

- One debtor, one creditor.
- Three debtors, one creditor.
- One debtor, three creditors.
- Multiple debtors and creditors.
- Simplified settlement minimizes payment count.
- Direct payback settlement points back to original payer relationships.
- Multiple-payer direct payback distributes reimbursement across original payers.

Worst cases:

- No members.
- No expenses.
- All balances zero.

Edge cases:

- Rounding leaves one minor unit remainder.
- Settlement should never output zero payment.
- Settlement should not output negative payment.
- Settlement should settle all debtors and creditors exactly.
- Direct payback may create more payments than simplified settlement, but totals must still match balances.

### Payment Info

Happy cases:

- Receiver has bank details.
- Receiver has QR image.
- Receiver has transfer note.
- Receiver has enough bank details to generate VietQR.

Worst cases:

- Missing bank details should not block settlement.
- Invalid QR upload should show error.
- VietQR generation failure should fall back to manual bank details/QR upload.

Edge cases:

- Very long account holder name.
- QR image too large.
- Special characters in transfer note.
- Transfer note includes payer name and amount.

### Import And Export

Happy cases:

- Export trip JSON.
- Import same JSON.
- Imported trip calculates same balances.
- Export CSV for expenses, balances, and settlements.
- Export print-friendly summary for PDF.

Worst cases:

- Invalid JSON.
- Wrong schema version.
- Missing members array.
- Expense references missing member.

Edge cases:

- Export includes payment details.
- Export includes QR image data.
- Export includes receipt image data when configured.
- Import preserves language.
- Share URL excludes QR/receipt images when payload is too large.

### Language

Happy cases:

- Switch from English to Vietnamese.
- Switch from Vietnamese to English.
- Data remains unchanged after switching language.

Worst cases:

- Missing translation key should be detectable in tests.

Edge cases:

- Long Vietnamese labels fit buttons and forms.
- Formula text uses localized number formatting.

## E2E Test Cases

### Full Trip Happy Path

1. Open app.
2. Add trip name.
3. Add Duy, Alvin, HA, Anh TA.
4. Add Duy payment info.
5. Add expense: Duy paid `300000` for Alvin, HA, Anh TA.
6. Review formula.
7. Review balances.
8. Confirm settlement:

```text
Alvin pays Duy 100000
HA pays Duy 100000
Anh TA pays Duy 100000
```

### Payer Included Path

1. Add expense: Duy paid `400000` for Duy, Alvin, HA, Anh TA.
2. Confirm each share is `100000`.
3. Confirm Duy receives `300000`.

### Mixed Payers Path

1. Duy pays for 3 people.
2. Alvin pays for 2 people.
3. HA pays for all people.
4. Confirm final settlement balances sum to zero.

### Multiple Payers Same Expense Path

1. Add expense: Duy paid `300000`, Alvin paid `200000`, total `500000`.
2. Shared by Duy, Alvin, HA, Anh TA.
3. Confirm payer contributions sum to total.
4. Confirm formulas and balances remain correct.

### Custom Split Path

1. Add exact split expense.
2. Add percentage split expense.
3. Add share/weight split expense.
4. Confirm each formula shows the selected method.
5. Confirm final balances sum to zero.

### Transfer And Payment Status Path

1. Generate settlement.
2. Mark one instruction as paid.
3. Confirm remaining settlement updates or status is visible.
4. Add manual transfer and confirm balances update.

### Rounding Path

1. Add expense: Duy paid `100` for Duy, Alvin, HA.
2. Confirm shares are `34`, `33`, `33`.
3. Confirm no money disappears.

### Read-Only Share Path

1. Build trip.
2. Export read-only summary.
3. Open summary.
4. Confirm no edit controls exist.
5. Confirm bank/QR info is visible for receivers.
6. Confirm custom split formulas, transfers, and payment statuses are visible when configured.

### Validation Path

1. Try to save expense without title.
2. Try to save expense with amount `0`.
3. Try to save expense without shared participants.
4. Confirm clear error messages are displayed.

## QA Real-User Test Pass

QA should test from the point of view of two roles:

- Host: creates and edits the trip.
- Member: reviews the shared summary and transfers money.

### QA Scenario: New Host Completes A Trip

1. Open the app with no saved data.
2. Add trip name.
3. Add members: Duy, Alvin, HA, Anh TA.
4. Add payment information and QR for Duy.
5. Add one expense where Duy is excluded from shared participants.
6. Add one expense where Duy is included.
7. Add one expense paid by Alvin for only two people.
8. Add one multiple-payer expense.
9. Add one exact split expense.
10. Add one percentage split expense.
11. Add one share/weight split expense.
12. Add one transfer.
13. Review formula details.
14. Review balances.
15. Review simplified and direct payback settlement instructions.
16. Export shared summary.

Expected result:

- The host can finish without hidden instructions.
- The balances are understandable.
- The settlement matches the formula details.
- Receiver payment details are visible.
- Custom split methods are understandable.
- Multiple-payer expense is auditable.

### QA Scenario: Member Reviews Shared Summary

1. Open exported/read-only summary.
2. Find own name.
3. Find own owed/receive amount.
4. Inspect at least one formula that affects own balance.
5. Find transfer target and QR/bank details.
6. Check payment status if the host shared it.

Expected result:

- The member knows exactly who to pay.
- The member can verify why they owe that amount.
- No edit controls appear in read-only summary.

### QA Scenario: Vietnamese User

1. Switch language to Vietnamese.
2. Repeat add member, add expense, balance review, and settlement review.
3. Check long Vietnamese strings on mobile.

Expected result:

- Copy is natural and understandable.
- No major text overflow.
- Formula text remains clear.

### QA Scenario: Mistake Recovery

1. Enter invalid amount.
2. Try to save an expense without participants.
3. Add the wrong payer, then edit it.
4. Delete an expense.
5. Import previously exported JSON.
6. Switch settlement mode between simplified and direct payback.

Expected result:

- Errors explain how to fix the issue.
- User data is not lost unexpectedly.
- Import restores the trip correctly.

### QA Scenario: Full Feature Regression

1. Create multiple trips.
2. Add member payment details with manual QR and generated VietQR.
3. Add equal, exact, percentage, and share split expenses.
4. Add a multiple-payer expense.
5. Add a transfer.
6. Export JSON, CSV, and print-friendly summary.
7. Re-import JSON in a clean browser profile.

Expected result:

- Imported data matches exported data.
- All formulas remain intact.
- Balances and settlements match before and after import.
- No full-app feature silently downgrades to equal-only behavior.

## QA Bug Lifecycle

Every QA bug report should include:

- Title
- Severity
- Environment
- Steps to reproduce
- Expected result
- Actual result
- Screenshot or screen recording when visual
- Whether it reproduces in English, Vietnamese, or both

Severity:

- `P0`: data loss, impossible to calculate, settlement wrong
- `P1`: core flow blocked, major formula/payment issue
- `P2`: confusing UX, validation issue, layout issue
- `P3`: polish, copy, minor visual issue

Engineering response:

1. Reproduce the bug.
2. Add a failing automated test when practical.
3. Fix the bug.
4. Run relevant regression tests.
5. Ask QA to retest.

Close condition:

```text
Bug is closed only after QA confirms the original issue no longer reproduces.
```

## Visual QA Checklist

- Desktop layout has no overlap.
- Mobile layout has no horizontal scroll.
- Vietnamese copy fits controls.
- QR images do not cover text.
- Long member names wrap cleanly.
- Balance status is understandable without relying only on color.
