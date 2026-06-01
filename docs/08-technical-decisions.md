# Technical Decisions

## Stack

- React + Vite + TypeScript for fast local app development.
- Vitest for unit tests.
- Playwright for desktop/mobile E2E.
- Local browser storage only; no server database.

## Storage

Current implementation uses `localStorage` for the trip store.

Decision:

- Use `localStorage` while data is text-heavy.
- Move QR images and receipt images to IndexedDB if file payloads become large.

## Money

Use integer minor units.

For VND:

```text
1 minor unit = 1 VND
```

No floating point balances.

## Split Calculation

Supported methods:

- Equal
- Exact
- Percentage
- Shares/weights

Invariant:

```text
sum(participant shares) = expense amount
```

Rounding uses stable remainder allocation.

## Settlement

Two modes:

- Simplified settlement: minimizes final payment count.
- Direct payback: preserves relationship to original payers.

Transfers reduce remaining balances:

```text
balance = totalPaid - totalOwed - transferReceived + transferPaid
```

## Sharing

Implemented:

- JSON export/import.
- CSV export.
- Browser print/PDF.
- Share link from encoded JSON.

Constraint:

- QR/receipt-heavy payloads should prefer file export over URL.

## QR / VietQR

Current implementation generates a QR from structured transfer content client-side.

Next hardening:

- Implement full VietQR EMV payload format or integrate a privacy-reviewed client-side generator.
- If using an external API, disclose exactly what data is sent.

## Security

- No payment data is sent to an app server.
- Exported files and copied links can expose payment details.
- UI must warn before sharing.

