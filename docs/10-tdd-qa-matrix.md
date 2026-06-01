# TDD And QA Matrix

## Automated Unit Coverage

Implemented:

- Money formatting in EN and VI.
- Equal split with rounding.
- Exact split.
- Percentage split.
- Share/weight split.
- Payer included.
- Payer excluded.
- Multiple payers.
- Transfers applied to remaining balances.
- Simplified settlement.
- Direct payback settlement.
- JSON import/export.
- CSV export.

## E2E Coverage

Implemented:

- Desktop Chromium host workflow smoke test.
- Mobile Chromium host workflow smoke test.
- Navigation across all five app sections.
- Sharing and QA screens are reachable.

## Required QA Scenarios

### Host Full Trip

1. Create trip.
2. Add members.
3. Add payment details.
4. Add equal, exact, percentage, and share split expenses.
5. Add multiple-payer expense.
6. Review formulas.
7. Mark payment paid.
8. Export summary.

### Member Review

1. Open shared summary.
2. Find own balance.
3. Check formula source.
4. Find who to pay.
5. Use bank/QR details.

### Bug Loop

```text
QA bug -> failing test -> fix -> regression test -> QA retest -> close
```

## Severity

- P0: wrong money math, data loss, app unusable.
- P1: core flow blocked, payment target wrong, import/export broken.
- P2: confusing UX, validation issue, mobile layout problem.
- P3: copy or polish issue.

## Next Test Additions

- Component tests for expense form validation.
- E2E test for adding custom split expense.
- E2E test for JSON export/import.
- E2E test for marking payment paid.
- Visual regression screenshots for desktop and mobile.

