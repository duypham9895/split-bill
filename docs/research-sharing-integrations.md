# Research: Sharing from Web App to Zalo, Messenger, and SMS

**Date:** 2026-06-01
**Constraint:** No backend, no server. Everything must work client-side.
**Target users:** Vietnamese trip members sharing expense summaries.

---

## 1. Zalo Share URL Format

### Does `https://zalo.me/share?url=...&text=...` work?

**Partially, but it's undocumented and unreliable.**

The Zalo developer documentation (`developers.zalo.me/docs/social-api/tham-khao/huong-dan-tao-lien-ket-de-chia-se`) does NOT document a `zalo.me/share` endpoint. The official docs only discuss OG tags for link previews — Zalo's sharing model is "paste a URL in chat, Zalo crawler reads OG tags, generates preview card."

**What actually happens with `zalo.me/share?url=...`:**
- On desktop browser: redirects to `id.zalo.me/account/login` (requires Zalo web login)
- On mobile with Zalo installed: may trigger the Zalo app via deep link, but behavior is inconsistent
- No official parameter documentation exists for `url`, `text`, or other query params

### Zalo's Official Sharing Approach

Zalo's developer portal shows these Social Plugins:
- **Nut Quan tam** (Follow Button)
- **Widget Quan tam** (Follow Widget)
- **Widget cap tuong tac** (Interactive Widget) — NEW
- **Widget Chat** (Chat Widget)

**There is NO official "Share Button" plugin.** Zalo's sharing model relies entirely on:
1. User copies a URL
2. Pastes it into Zalo chat
3. Zalo's crawler reads OG tags from the URL
4. A preview card is generated

### OG Tags Zalo Reads

From the official documentation:

| Tag | Description |
|-----|-------------|
| `og:url` | The page URL |
| `og:title` | Article title |
| `og:description` | Short description (2-4 sentences) |
| `og:image` | Image URL shown when shared on Zalo |

```html
<meta property="og:url" content="https://your-app.com/trip/abc123" />
<meta property="og:title" content="Da Nang 3N2D - Trip Summary" />
<meta property="og:image" content="https://your-app.com/og/abc123.png" />
<meta property="og:description" content="Total: 4,500,000 VND. 3 members. Settlement: An pays Binh 1,200,000 VND." />
```

### Zalo Link Cache Duration

Not officially documented. The debug-sharing tool at `developers.zalo.me/tools/debug-sharing` can force a re-scrape, but requires Zalo developer login. In practice, Zalo caches link previews similarly to Facebook (24-48 hours). Changing the `og:image` URL (e.g., appending a timestamp query param) forces a refresh.

### Recommended Approach for Zalo

**Use the Web Share API** (see Section 3). This is the only reliable client-side method that works on mobile Zalo users' devices. There is no dependable `zalo.me/share` URL format.

---

## 2. Facebook Share Dialog (Without JS SDK)

### Method 1: `/dialog/share` (Official, Requires app_id)

```
https://www.facebook.com/dialog/share?
  app_id=YOUR_APP_ID
  &display=page
  &href=ENCODED_URL_TO_SHARE
  &redirect_uri=ENCODED_REDIRECT_URL
  &hashtag=%23TripSummary
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `app_id` | Yes | Facebook App ID (must register at developers.facebook.com) |
| `display` | Yes | `page` for URL redirect method |
| `href` | Yes | URL to share (URL-encoded) |
| `redirect_uri` | Yes | Where to redirect after share |
| `hashtag` | No | e.g., `#TripSummary` (user can remove) |

**Problem:** Requires registering a Facebook App, which means a backend/app review process. Not suitable for pure client-side.

### Method 2: `/sharer/sharer.php` (Legacy, No app_id needed)

```
https://www.facebook.com/sharer/sharer.php?u=ENCODED_URL
```

**This still works as of 2026** and does NOT require an `app_id`. It opens Facebook's share dialog pre-filled with the URL. Facebook's crawler reads OG tags from the shared URL to generate the preview.

```typescript
function shareToFacebook(url: string): void {
  const encoded = encodeURIComponent(url);
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    '_blank',
    'width=600,height=400'
  );
}
```

### Facebook OG Tags

Same 4 basic tags as Zalo:
- `og:url` — canonical URL
- `og:title` — title without branding
- `og:description` — 2-4 sentence description
- `og:image` — preview image URL

Additional optional tags:
- `og:type` — defaults to `website`
- `og:locale` — defaults to `en_US` (use `vi_VN` for Vietnamese)
- `fb:app_id` — for analytics (not required for sharing)

**Image caching:** Facebook caches images by URL. To force refresh, change the image URL (append `?v=2` etc.).

---

## 3. Web Share API — The Best Client-Side Option

### How `navigator.share()` Works

The Web Share API delegates to the **OS-level native share sheet**. It does NOT control which apps appear — the operating system shows all apps registered as share targets.

```typescript
async function shareTripSummary(tripName: string, summary: string, url: string) {
  if (!navigator.share) {
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(`${summary}\n${url}`);
    return;
  }

  try {
    await navigator.share({
      title: tripName,
      text: summary,
      url: url,
    });
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('Share failed:', err);
    }
  }
}
```

### What Apps Appear as Share Targets

| Platform | What appears |
|----------|-------------|
| **Android Chrome** | System share sheet shows ALL installed apps: Zalo, Messenger, WhatsApp, Telegram, SMS, Email, Copy, etc. |
| **iOS Safari** | iOS share sheet shows all apps: Messages, Mail, Zalo, Messenger, WhatsApp, AirDrop, Copy, etc. |
| **Desktop Chrome** | Limited — typically OS share dialog or "Copy to clipboard" |

**Key finding:** On Vietnamese users' phones, Zalo and Messenger will appear as share targets because they register as share intent handlers on both Android and iOS. This is the most reliable client-side approach.

### Browser Support

| Browser | Support |
|---------|---------|
| Android Chrome | 75+ (2019) |
| iOS Safari | 12.2+ (2019) |
| Desktop Chrome | Limited |
| Firefox | Limited |

### Web Share API Level 2 — Sharing Images

You can share generated images (e.g., a trip summary card) as files:

```typescript
async function shareTripImage(canvas: HTMLCanvasElement, tripName: string) {
  // Convert canvas to blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });

  const file = new File([blob], `${tripName}.png`, { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: tripName,
      text: `Trip summary for ${tripName}`,
      files: [file],
    });
  }
}
```

**File sharing support:**
- Android Chrome: 128+
- iOS Safari: 14+ (with `canShare` check)
- Always check with `navigator.canShare({ files: [...] })` first

---

## 4. How Vietnamese Apps Implement "Share to Zalo"

### Native Apps (Momo, ZaloPay, Shopee)

These apps use **deep links** to trigger Zalo's share intent directly:

```
zalo://share?url=ENCODED_URL&text=PRE_FILLED_TEXT
```

However, this only works when:
1. The calling app is a native app (not a web app)
2. Zalo is installed on the device
3. The deep link format is correct (and Zalo doesn't change it)

**This is NOT available to web apps.** Web apps cannot reliably invoke `zalo://` deep links from a browser.

### What Web Apps Can Do

Vietnamese web apps typically use one of:
1. **Web Share API** — shows Zalo in the native share sheet (recommended)
2. **Copy to clipboard** — user manually pastes into Zalo
3. **Custom share modal** — show icons for Zalo, Messenger, etc. with copy-link fallback

---

## 5. Pre-filling Messages in Zalo/Messenger

### Can you pre-fill a message?

| Platform | Pre-fill support | How |
|----------|-----------------|-----|
| **Zalo** | NO | Zalo does not expose a URL parameter to pre-fill message text. The Web Share API's `text` parameter may appear as a suggested message, but Zalo doesn't guarantee it. |
| **Messenger** | NO | Facebook's Share Dialog (`/sharer/sharer.php`) only shares a URL. You cannot pre-fill the chat message text. |
| **Web Share API** | PARTIAL | The `text` and `title` parameters are passed to the target app, but each app decides how to use them. Zalo and Messenger may show them as editable pre-filled text, or ignore them. |
| **SMS (Android)** | YES | `sms:?body=ENCODED_TEXT` works on Android |
| **SMS (iOS)** | UNRELIABLE | Apple's official `sms:` scheme does NOT support `?body=`. In practice, `sms:&body=TEXT` sometimes works but is not guaranteed. |

### Web Share API Text Behavior

```typescript
await navigator.share({
  title: 'Da Nang 3N2D',           // May appear as subject/title
  text: 'Total: 4,500,000 VND\nAn owes Binh 1,200,000 VND',  // May appear as message body
  url: 'https://your-app.com/trip/abc123',  // Always attached
});
```

On Android, the share sheet shows these values as preview text. When the user selects Zalo or Messenger, the text may or may not be pre-filled — it depends on the receiving app's implementation.

---

## 6. OG Tags — What Zalo's Crawler Reads

### Zalo's Required OG Tags

From the official Zalo developer documentation:

```html
<!-- Required -->
<meta property="og:url" content="https://your-app.com/trip/TRIP_ID" />
<meta property="og:title" content="Trip Name - Expense Summary" />
<meta property="og:description" content="Total: X VND. N members. Settlement details." />
<meta property="og:image" content="https://your-app.com/og/TRIP_ID.png" />

<!-- Recommended for Vietnamese users -->
<meta property="og:locale" content="vi_VN" />
<meta property="og:type" content="website" />
```

### Zalo Cache Duration

**Not officially documented.** Based on behavior:
- Zalo caches link previews for approximately 24-48 hours
- The debug-sharing tool (`developers.zalo.me/tools/debug-sharing`) can force re-scrape
- Changing the `og:image` URL forces a new fetch (append `?v=TIMESTAMP`)

### Problem for Client-Only Apps

OG tags require the URL to be **publicly accessible** with the tags in the HTML. For a client-only SPA:
- The URL must be publicly hosted (e.g., Vercel, Netlify, GitHub Pages)
- The HTML must include dynamic OG tags based on the trip data
- Since there's no server to render OG tags dynamically, you need one of:
  - **Static hosting with build-time OG generation** (if trips are created at build time)
  - **URL-based trip data** (encode trip data in URL, render OG tags at build time)
  - **Pre-built OG image** (generic image that doesn't include trip-specific data)
  - **Accept generic previews** (same OG tags for all trips)

### Recommended Approach

For a client-only app, use **generic OG tags** in `index.html`:

```html
<meta property="og:title" content="Trip Split Bill" />
<meta property="og:description" content="Split expenses easily with friends. No signup required." />
<meta property="og:image" content="https://your-app.com/og-default.png" />
<meta property="og:url" content="https://your-app.com" />
```

When sharing via Web Share API, include trip-specific details in the `text` parameter — the receiving app may show it alongside the OG preview.

---

## 7. Generating a Shareable Trip Summary Image (Canvas-Based)

### Approach: Canvas to Blob to File to Web Share

```typescript
function generateTripSummaryImage(trip: Trip): Promise<File> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Social media optimal: 1200x630 (OG standard)
  canvas.width = 1200;
  canvas.height = 630;

  // Background
  ctx.fillStyle = '#087f7b'; // Teal brand color
  ctx.fillRect(0, 0, 1200, 630);

  // White card
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 40, 40, 1120, 550, 20);
  ctx.fill();

  // Trip name
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
  ctx.fillText(trip.name, 80, 130);

  // Summary stats
  ctx.font = '24px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#666666';
  const total = trip.expenses.reduce((sum, e) => sum + e.amountMinor, 0);
  ctx.fillText(`Total: ${formatMoney(total, trip.currency)}`, 80, 200);
  ctx.fillText(`Members: ${trip.members.filter(m => m.active).length}`, 80, 240);
  ctx.fillText(`Expenses: ${trip.expenses.length}`, 80, 280);

  // Settlement summary
  const settlements = calculateTrip(trip).settlements;
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#087f7b';
  ctx.fillText('Settlement:', 80, 350);

  ctx.font = '24px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#1a1a1a';
  settlements.slice(0, 4).forEach((s, i) => {
    const from = trip.members.find(m => m.id === s.fromMemberId)?.name;
    const to = trip.members.find(m => m.id === s.toMemberId)?.name;
    ctx.fillText(
      `${from} → ${to}: ${formatMoney(s.amountMinor, trip.currency)}`,
      80,
      390 + i * 40
    );
  });

  // Footer
  ctx.font = '18px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#999999';
  ctx.fillText('Generated by Trip Split Bill', 80, 560);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], `${trip.name}.png`, { type: 'image/png' }));
    }, 'image/png');
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
```

### Sharing the Generated Image

```typescript
async function shareTripSummaryImage(trip: Trip) {
  const file = await generateTripSummaryImage(trip);
  const url = window.location.href;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: trip.name,
      text: `Trip summary for ${trip.name}`,
      files: [file],
    });
  } else {
    // Fallback: download the image
    const downloadUrl = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${trip.name}-summary.png`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  }
}
```

### Image Dimensions for Social Platforms

| Platform | Recommended size |
|----------|-----------------|
| Facebook/Messenger | 1200 x 630 px |
| Zalo | 1200 x 630 px (follows OG standard) |
| Twitter | 1200 x 600 px |
| General OG | 1200 x 630 px |

---

## 8. SMS URI Scheme for iMessage

### Apple's Official `sms:` Scheme

From Apple's documentation (`developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/SMSLinks/SMSLinks.html`):

**Format:** `sms:<phone>`

**Allowed characters in phone number:** digits 0-9, plus (+), hyphen (-), period (.)

**Critical limitation:** Apple's documentation explicitly states: "The URL string must not include any message text or other information."

This means `sms:?body=...` is **NOT officially supported** on iOS.

### What Actually Works

| URI | iOS Behavior | Android Behavior |
|-----|-------------|-----------------|
| `sms:` | Opens Messages app | Opens SMS app |
| `sms:1234567890` | Opens Messages with recipient | Opens SMS with recipient |
| `sms:?body=Hello` | **Unreliable** — may or may not work | Works |
| `sms:&body=Hello` | **Unreliable** — may or may not work | N/A (use `?`) |
| `sms:1234567890?body=Hello` | **Unreliable** | Works |

### Recommended SMS Implementation

```typescript
function shareViaSMS(tripName: string, summary: string, url: string) {
  const message = `${summary}\n${url}`;
  const encoded = encodeURIComponent(message);

  // Detect platform
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isIOS) {
    // iOS: sms: doesn't officially support body, but try anyway
    // Fallback to Web Share API which shows Messages as a target
    if (navigator.share) {
      navigator.share({ title: tripName, text: message });
    } else {
      window.open('sms:');
    }
  } else if (isAndroid) {
    // Android: sms:?body= works reliably
    window.open(`sms:?body=${encoded}`);
  } else {
    // Desktop: copy to clipboard
    navigator.clipboard.writeText(message);
  }
}
```

**Best practice for iOS:** Use the Web Share API instead of `sms:` URI. The Web Share API shows Messages as a share target on iOS, and the `text` parameter is reliably passed to Messages as the pre-filled body.

---

## Summary: Recommended Implementation for Trip Split Bill

### Priority 1: Web Share API (All Platforms)

This is the single best approach for a client-side Vietnamese expense app:

```typescript
async function shareTrip(trip: Trip) {
  const summary = generateTextSummary(trip);
  const url = window.location.href;

  if (navigator.share) {
    await navigator.share({
      title: `${trip.name} - Trip Summary`,
      text: summary,
      url: url,
    });
    // This shows: Zalo, Messenger, SMS, WhatsApp, Email, Copy, etc.
  } else {
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(`${summary}\n${url}`);
  }
}
```

**Why this works:**
- Shows Zalo, Messenger, SMS, and all other apps on the user's phone
- No app_id or registration required
- Works on Android Chrome (75+) and iOS Safari (12.2+)
- The `text` parameter may be pre-filled in the target app
- Zero backend required

### Priority 2: Facebook sharer.php (Direct Share to Facebook)

```typescript
function shareToFacebook(url: string) {
  const encoded = encodeURIComponent(url);
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    '_blank',
    'width=600,height=400'
  );
}
```

**Use when:** User explicitly wants to share to Facebook (not Messenger). This opens Facebook's share dialog pre-filled with the URL and OG preview.

### Priority 3: Copy Link (Universal Fallback)

```typescript
async function copyShareLink(url: string, summary: string) {
  await navigator.clipboard.writeText(`${summary}\n${url}`);
}
```

**Use when:** Web Share API is not available, or user prefers manual sharing.

### Priority 4: Canvas-Generated Image (Enhanced Sharing)

Generate a trip summary image and share it via Web Share API Level 2:

```typescript
const file = await generateTripSummaryImage(trip);
if (navigator.canShare?.({ files: [file] })) {
  await navigator.share({ files: [file], title: trip.name });
}
```

**Use when:** You want rich previews in Zalo/Messenger. The image can be shared alongside the URL.

### What NOT to Do

1. **Do NOT use `zalo.me/share?url=...`** — undocumented, requires Zalo web login, inconsistent behavior
2. **Do NOT register a Facebook App** just for `/dialog/share` — use `/sharer/sharer.php` instead
3. **Do NOT rely on `sms:?body=`** on iOS — use Web Share API which shows Messages as a target
4. **Do NOT try to deep-link into Zalo/Messenger** from a web app — `zalo://` and `fb-messenger://` schemes are unreliable from browsers

---

## Code: Complete Share Implementation

```typescript
// src/sharing/share.ts

interface ShareOptions {
  tripName: string;
  summary: string;
  url: string;
  imageFile?: File;
}

export async function shareTrip(options: ShareOptions): Promise<boolean> {
  const { tripName, summary, url, imageFile } = options;

  // Try Web Share API with image first
  if (imageFile && navigator.canShare?.({ files: [imageFile] })) {
    try {
      await navigator.share({
        title: tripName,
        text: summary,
        files: [imageFile],
      });
      return true;
    } catch (e) {
      if (isAbortError(e)) return false;
    }
  }

  // Try Web Share API without image
  if (navigator.share) {
    try {
      await navigator.share({
        title: tripName,
        text: summary,
        url: url,
      });
      return true;
    } catch (e) {
      if (isAbortError(e)) return false;
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(`${summary}\n${url}`);
    return true;
  } catch {
    return false;
  }
}

export function shareToFacebook(url: string): void {
  const encoded = encodeURIComponent(url);
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    '_blank',
    'width=600,height=400'
  );
}

function isAbortError(e: unknown): boolean {
  return e instanceof Error && e.name === 'AbortError';
}
```

---

## Sources

- Zalo Developer Docs: `developers.zalo.me/docs/social-api/tham-khao/huong-dan-tao-lien-ket-de-chia-se`
- Facebook Share Dialog: `developers.facebook.com/docs/sharing/reference/share-dialog`
- Facebook OG Tags: `developers.facebook.com/docs/sharing/webmasters`
- Web Share API: `developer.mozilla.org/en-US/docs/Web/API/Navigator/share`
- Web Share Level 2: `web.dev/articles/web-share`
- Canvas API: `developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL`
- Apple SMS Scheme: `developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/SMSLinks/SMSLinks.html`
