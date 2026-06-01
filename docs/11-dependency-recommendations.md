# Dependency Recommendations

## Current Dependencies

- React
- Vite
- TypeScript
- Vitest
- React Testing Library
- Playwright
- lucide-react
- qrcode

## Keep Dependencies Minimal

The app handles private payment details. Prefer client-side code and avoid external services unless there is a clear benefit and user-facing disclosure.

## Storage

Current:

- `localStorage`

Recommended next:

- Add `idb` only if QR/receipt images need IndexedDB storage.

## QR

Current:

- `qrcode` for client-side QR rendering.

Recommended next:

- Implement proper VietQR EMV payload generation client-side.
- Avoid external QR APIs unless product accepts the privacy tradeoff.

## CSV

Current:

- Manual CSV generation.

Recommendation:

- Keep manual CSV unless quoting/encoding needs grow.
- Add `papaparse` only if CSV import becomes a feature.

## PDF

Current:

- Browser print/save as PDF.

Recommendation:

- Keep print-first PDF.
- Add generated PDF only if users need one-click PDF file downloads.

## Forms

Current:

- Controlled React state.

Recommended next:

- Add `react-hook-form` only if form complexity becomes hard to maintain.
- Add `zod` if runtime schema validation grows beyond import/export.

## i18n

Current:

- Dictionary helper.

Recommended next:

- Add `i18next` only when copy volume, interpolation, or pluralization becomes complex.

