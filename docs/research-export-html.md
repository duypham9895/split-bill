# Research: Standalone HTML Export for Trip Summary

## Problem Statement

The app currently exports JSON and CSV, and has a "Print summary" button that uses `window.print()`. Neither produces a shareable, self-contained document that trip members can open on their phone via Zalo/Messenger/email and see everything: expenses, balances, settlement instructions with bank details and QR codes.

Goal: Generate a single `.html` file entirely client-side that works offline, looks good on mobile and desktop, prints cleanly, and includes all trip data.

---

## 1. Self-Contained HTML Generation

### Strategy: Template Literal + Blob Download

The HTML file is built as a single string in TypeScript, then downloaded via `Blob` + `URL.createObjectURL` (same pattern the app already uses in `downloadText()`).

```
src/
  export/
    generate-html.ts     # main export function
    html-template.ts     # the HTML template (string builder)
    inline-styles.ts     # extracted subset of styles.css for the export
```

**No external libraries needed.** The template is a TypeScript function that takes `Trip` + `MemberBalance[]` + `SettlementPayment[]` and returns an HTML string.

### What "self-contained" means here

| Resource | Strategy |
|----------|----------|
| CSS | Inline `<style>` block — only the tokens and component styles needed for the summary layout (~200 lines, not the full 1370-line styles.css) |
| Fonts | Use system font stack only (`Inter, ui-sans-serif, system-ui, -apple-system, sans-serif`). No web font download. Inter is pre-installed on Apple devices; system-ui covers Android/Windows. |
| Images (QR) | Already `data:image/png;base64,...` data URLs from `qrcode` library. Inline directly in `<img src="...">`. |
| JavaScript | Minimal vanilla JS for collapsible sections (`<details>` elements need zero JS). No framework. |
| Data | Trip JSON embedded as `<script type="application/json">` for potential future use, but the HTML is pre-rendered (server-side rendering equivalent — all content is in the DOM already). |

### Why pre-rendered, not JS-rendered

- Works with JavaScript disabled
- No framework dependency (React is ~45KB gzipped)
- Instant rendering on any device
- Print CSS works immediately without waiting for JS hydration
- Smaller file size

---

## 2. Making It Work Offline

The HTML file has zero external dependencies. Every resource is inline:

- **No CDN links** (no Google Fonts, no icon fonts, no external CSS)
- **No fetch() calls** (no VietQR API calls — QR images are pre-generated and embedded)
- **No service worker** (not needed — it is a single file, not a web app)

### QR Image Strategy

Currently `PaymentCard.tsx` calls `generatePaymentQr()` which either:
1. Fetches from `img.vietqr.io` and converts to data URL, or
2. Falls back to local `QRCode.toDataURL()`

For the HTML export, we need all QR images resolved *before* generating the HTML. The export function should:

```typescript
// In generate-html.ts
async function resolveQrImages(trip: Trip, payments: SettlementPayment[]): Promise<Map<string, string>> {
  const qrMap = new Map<string, string>();

  // 1. Member payment QRs (from qrImageDataUrl if already stored)
  for (const member of trip.members) {
    if (member.payment?.qrImageDataUrl) {
      qrMap.set(`member-${member.id}`, member.payment.qrImageDataUrl);
    }
  }

  // 2. Settlement payment QRs (generate on the fly)
  for (const payment of payments) {
    const receiver = trip.members.find(m => m.id === payment.toMemberId);
    if (receiver) {
      const qr = await generatePaymentQr(receiver, payment);
      qrMap.set(`payment-${payment.fromMemberId}-${payment.toMemberId}`, qr);
    }
  }

  return qrMap;
}
```

This means the export is an `async` function (because of network fetches for VietQR). If the network is unavailable, the fallback `QRCode.toDataURL()` works entirely offline.

---

## 3. Print-Friendly CSS

### @media print Rules

```css
@media print {
  /* Remove interactive/irrelevant elements */
  .export-actions { display: none; }        /* download/save buttons */
  .privacy-toggle { display: none; }        /* show/hide bank details toggle */

  /* Page setup */
  @page {
    size: A4;
    margin: 16mm 12mm;
  }

  /* Prevent orphaned rows in tables */
  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Prevent orphaned headers */
  h2, h3 {
    break-after: avoid;
    page-break-after: avoid;
  }

  /* Keep sections together */
  .section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Ensure QR codes print */
  img {
    max-width: 120px;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* Force background colors to print (for balance cards) */
  .balance-card--receive,
  .balance-card--pay,
  .balance-card--settled {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* Avoid blank page after last section */
  .export-container::after {
    display: none;
  }
}
```

### Key Print CSS Techniques

1. **`break-inside: avoid`** on table rows prevents a row from splitting across pages.
2. **`break-after: avoid`** on headings keeps them attached to their content.
3. **`print-color-adjust: exact`** forces background colors and QR codes to print (browsers strip backgrounds by default).
4. **`@page { margin }`** controls page margins independently of screen layout.
5. **Avoid `overflow: hidden`** on containers — it can clip content in print mode.

### What the current app's print CSS does

The existing `@media print` in `styles.css` (line 1378) hides the sidebar, topbar, bottomNav, and buttons, then forces single-column layout. This is fine for printing the in-app view, but for the HTML export we need a purpose-built print stylesheet since the exported HTML has none of those elements.

---

## 4. Including QR Images in Exported HTML

QR images are already data URLs (`data:image/png;base64,...`). They go directly into `<img src="...">` tags.

### Data URL Size Reference

| QR Code | Typical Size |
|---------|-------------|
| `QRCode.toDataURL()` with `width: 180, margin: 1` | ~1.5–3 KB |
| VietQR API image (fetched as data URL) | ~5–15 KB |
| User-uploaded QR (`qrImageDataUrl` on Member) | ~10–50 KB (depends on source) |

For a trip with 6 members and 6 settlement payments, total QR size: ~50–200 KB. Acceptable.

### HTML Embedding Pattern

```html
<div class="payment-card">
  <h3>Payment to Duy</h3>
  <div class="bank-info">
    <span class="bank-name">Vietcombank</span>
    <span class="account-number">102345678910</span>
    <span class="account-holder">DUY NGUYEN</span>
  </div>
  <img class="qr-code" src="data:image/png;base64,iVBOR..." alt="Payment QR for Duy" />
  <span class="amount">300,000 VND</span>
</div>
```

---

## 5. Content Structure for the Shared Summary

Based on the existing app sections and what trip members need:

### Sections (top to bottom)

1. **Header** — Trip name, date range (derived from expense dates), currency, member count
2. **Members** — Name list with bank details (togglable for privacy)
3. **Expense Summary Table** — All expenses with title, date, amount, payer(s), split method, participant count
4. **Balance Cards** — Per-member: total paid, total owed, net balance (positive/negative/settled)
5. **Settlement Instructions** — Simplified settlement payments with arrows (A -> B: amount), bank details, and QR codes for each payment
6. **Transfer Status** — Which transfers have been marked as paid
7. **Footer** — Generated date, app name, privacy note

### What NOT to include

- Individual expense formulas (too detailed for a summary — the expense table with split method is enough)
- The full balance breakdown table (available in the app, not needed in the export)
- Edit/delete buttons or any interactive controls
- The QA section

### Bilingual Support

The export function should accept `language: Language` and use the existing `t()` function for all labels. The HTML `<html lang="en">` or `<html lang="vi">` attribute should be set correctly.

---

## 6. Responsive Design for the Exported HTML

The exported HTML should use a simple responsive layout that works on both mobile and desktop when opened in a browser.

### Layout Strategy

```
Mobile (<600px):   Single column, full width, stacked cards
Desktop (>=600px): Max-width 680px, centered, slightly more padding
```

No sidebar, no navigation, no complex grid. Just a clean, linear document.

### Key Responsive CSS

```css
.export-container {
  max-width: 680px;
  margin: 0 auto;
  padding: 16px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
  color: #162033;
  line-height: 1.5;
}

@media (min-width: 600px) {
  .export-container {
    padding: 32px 40px;
  }
}

/* Expense table: horizontal scroll on small screens */
.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Balance cards: 2-col on desktop, 1-col on mobile */
.balance-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 600px) {
  .balance-grid {
    grid-template-columns: 1fr 1fr;
  }
}
```

### Touch Targets

All tap targets (if we add collapsible sections) should be at least 44px height, matching the app's `--input-height` token.

---

## 7. How Other Apps Handle Shared Summaries

| App | Approach | Pros | Cons |
|-----|----------|------|------|
| **Splitwise** | Email summary (HTML email), PDF export, share link | Polished, familiar | Requires account, server-side |
| **Tricount** | Public web link (read-only) | No install needed | Requires server, expires |
| **Settle Up** | PDF export, CSV | Clean PDF | Server-side generation |
| **Splid** | PDF export, share link | Offline-capable | PDF only, no interactive QR |
| **Tab** | Share link with web view | Modern UX | Requires server |

### What We Can Do Without a Server

- **Standalone HTML file** — unique advantage. No other app does this. It is a "web page in a file" that can be shared via any messaging app.
- **QR codes are scannable directly from the file** — receivers can open the HTML on their phone and tap/scan the QR to pay. This is better than PDF (which requires a PDF viewer) and better than email (which strips images).
- **No account, no server, no expiry** — the file is the product.

---

## 8. File Size Considerations

### Size Budget

| Component | Size Estimate |
|-----------|--------------|
| HTML structure (10 expenses, 4 members) | ~8–15 KB |
| Inline CSS | ~5–8 KB |
| Member QR images (4 members) | ~6–20 KB |
| Settlement QR images (3 payments) | ~4–15 KB |
| User-uploaded QR images (variable) | ~10–50 KB |
| **Total (typical trip)** | **~30–100 KB** |
| **Total (worst case: 50 expenses, 10 members, all QRs)** | **~150–300 KB** |

### Worst Case Analysis

50 expenses add ~30 KB of HTML (each row is ~200 bytes). 10 members with uploaded QRs add ~200 KB. Total: ~300 KB.

This is well within limits for:
- Email attachments (Gmail: 25 MB)
- Messenger file sharing (no practical limit for small files)
- Zalo file sharing (no practical limit)
- WhatsApp (100 MB limit)

### Optimization Opportunities

1. **Compress QR images** — Use JPEG quality 80 instead of PNG for VietQR images. Saves ~50% per image.
2. **Lazy section rendering** — Not applicable since we pre-render everything.
3. **Omit the raw JSON embed** — If we embed `<script type="application/json">` for re-import, that adds the full trip JSON (~5–20 KB). Optional.

---

## 9. Client-Side PDF Generation

### Option A: Browser Print-to-PDF (Current Approach)

- `window.print()` with `@media print` CSS
- Pros: Zero dependencies, already implemented
- Cons: User must manually select "Save as PDF", inconsistent across browsers, no programmatic control

### Option B: html2pdf.js (Recommended if PDF is needed)

```bash
pnpm add html2pdf.js
```

- Wraps html2canvas + jsPDF
- Renders the HTML to a canvas, then converts to PDF
- Client-side, no server needed
- File size: ~200 KB gzipped (adds to bundle)
- Works well for simple layouts

```typescript
import html2pdf from 'html2pdf.js';

function exportPdf(htmlElement: HTMLElement, filename: string) {
  html2pdf()
    .set({
      margin: [10, 10],
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(htmlElement)
    .save();
}
```

### Option C: jsPDF Direct (Manual PDF Building)

- Lower-level, more control
- Must manually position text, draw tables, embed images
- More work but smaller bundle (~150 KB gzipped)
- Better print quality (native PDF text, not rasterized)

### Recommendation

**Do HTML export first. PDF can be a follow-up.** The HTML file is:
- Smaller to implement (no new dependency)
- Better UX on mobile (opens in browser, QR codes are tappable)
- More useful (can be re-imported if we embed the JSON)
- Print-to-PDF from browser is "good enough" for users who want PDF

If PDF becomes a hard requirement later, add `html2pdf.js` and render the same HTML template into PDF. The template is shared.

---

## 10. Security Considerations

### What Sensitive Data Is Exposed

| Data | Sensitivity | Present In |
|------|------------|------------|
| Bank name | Low | Member profiles |
| Bank code | Low | Member profiles |
| Account number | **High** | Member profiles, settlement QR |
| Account holder name | Medium | Member profiles |
| Transfer note template | Low | Settlement QR |
| User-uploaded QR image | **High** | Member profiles |
| Expense amounts | Medium | Expense table |
| Member names | Low | Everywhere |

### Mitigation Strategies

1. **Privacy toggle in the export HTML** — Add a JavaScript toggle that hides/shows bank details. Default: hidden. User clicks "Show payment details" to reveal. This uses vanilla JS (10 lines), and the data is still in the HTML (just hidden via CSS). Not truly secure, but prevents casual shoulder-surfing.

2. **Explicit consent in the app UI** — Before generating the export, show a confirmation dialog:

   > "This file contains bank account numbers and payment QR codes for: Duy, Alvin, HA. Only share it with your trip group."

   The existing `privacyNotice` in `SharingSection.tsx` already warns about this. The export function should show a similar warning.

3. **No encryption** — Encrypting the HTML file would require a password mechanism, which adds complexity and hurts UX. Not worth it for a trip expense splitter. The threat model is "accidental sharing with wrong person," not "targeted attack."

4. **File naming** — Name the file `TripName-summary.html` (not `TripName-bank-details.html`) to reduce accidental exposure.

### Recommendation

Implement the privacy toggle (show/hide bank details) as a `<details>` element with a warning. This is the best UX-security tradeoff for a client-side tool.

---

## Concrete Implementation Plan

### New Files

```
src/export/
  generate-html.ts        # Main async function: Trip -> HTML string
  html-template.ts        # HTML template builder (pure function)
  inline-styles.ts        # CSS string for the export (subset of styles.css)
```

### Function Signatures

```typescript
// src/export/generate-html.ts
import type { Trip, Language } from "../domain/types";

export async function generateTripHtml(trip: Trip): Promise<string>;
// Returns a complete HTML document as a string.
// Internally: calls calculateTrip(), resolves QR images, builds template.

export function downloadTripHtml(trip: Trip): Promise<void>;
// Triggers browser download of the HTML file.
// Uses the same Blob + createObjectURL pattern as downloadText().
```

### Template Structure (html-template.ts)

```html
<!DOCTYPE html>
<html lang="{language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{trip.name} — Trip Summary</title>
  <style>
    /* ~150 lines: tokens, reset, layout, components, print rules */
  </style>
</head>
<body>
  <div class="export-container">

    <!-- Header -->
    <header>
      <h1>{trip.name}</h1>
      <p class="subtitle">{memberCount} members · {expenseCount} expenses · {dateRange}</p>
    </header>

    <!-- Privacy toggle for bank details -->
    <details class="privacy-section">
      <summary>🔒 Payment details (tap to show)</summary>
      <div class="member-payments">
        <!-- Per member: name, bank, account, QR -->
      </div>
    </details>

    <!-- Expenses -->
    <section class="expenses-section">
      <h2>Expenses</h2>
      <table>
        <thead><tr><th>#</th><th>Title</th><th>Date</th><th>Amount</th><th>Paid by</th><th>Split</th></tr></thead>
        <tbody>
          <!-- Per expense row -->
        </tbody>
        <tfoot>
          <tr><td colspan="3">Total</td><td>{totalAmount}</td><td colspan="2"></td></tr>
        </tfoot>
      </table>
    </section>

    <!-- Balances -->
    <section class="balances-section">
      <h2>Balances</h2>
      <div class="balance-grid">
        <!-- Per member: name, paid, owed, balance (color-coded) -->
      </div>
    </section>

    <!-- Settlement -->
    <section class="settlement-section">
      <h2>Settlement — Fewest Transfers</h2>
      <!-- Per payment: "A → B: amount" with bank info and QR -->
    </section>

    <!-- Transfers (if any) -->
    <section class="transfers-section">
      <h2>Transfers</h2>
      <!-- Per transfer: from, to, amount, date, status -->
    </section>

    <!-- Footer -->
    <footer>
      <p>Generated by Trip Split Bill · {date}</p>
      <p class="privacy-note">⚠️ This file contains payment details. Share only with your trip group.</p>
    </footer>

  </div>
</body>
</html>
```

### Integration with App.tsx

Add a new button in `SharingSection`:

```tsx
<button className="primaryButton" onClick={onExportHtml} type="button">
  <Download size={18} />
  {t(language, "exportHtml")}  // New i18n key
</button>
```

The handler in `App.tsx`:

```typescript
async function exportHtml() {
  await downloadTripHtml(activeTrip);
}
```

### New i18n Keys

```typescript
// English
exportHtml: "Export summary",
exportHtmlDesc: "Download a self-contained HTML file you can share via chat or email.",

// Vietnamese
exportHtml: "Xuất tổng kết",
exportHtmlDesc: "Tải file HTML có thể chia sẻ qua chat hoặc email.",
```

### Tests

1. **Unit test** (`generate-html.test.ts`): Verify the output contains expected sections (header, expenses table, balances, settlement), correct member names, correct amounts formatted with `formatMoney()`, and valid HTML structure.
2. **Unit test**: Verify QR images are embedded as data URLs (not external URLs).
3. **Unit test**: Verify the `lang` attribute matches the trip language.
4. **E2E test**: Click export, verify file download, open the HTML, verify content matches the app view.

---

## Decision Summary

| Question | Decision |
|----------|----------|
| Self-contained HTML | Template literal string, Blob download, no framework |
| Offline support | All resources inline (CSS, QR as data URLs, no external fetches) |
| Print CSS | `@media print` with `break-inside: avoid`, `print-color-adjust: exact` |
| QR images | Pre-resolve all QRs as data URLs, embed in `<img src>` |
| Content | Header, members, expenses table, balances, settlement with QRs, transfers, footer |
| Responsive | Max-width 680px, single column, responsive grid for balance cards |
| PDF generation | Defer. HTML export first. Browser print-to-PDF is sufficient. |
| File size | ~30–100 KB typical, ~300 KB worst case. Well within sharing limits. |
| Security | Privacy toggle (show/hide bank details), consent dialog, no encryption |
| i18n | Use existing `t()` function, add 2 new keys |
