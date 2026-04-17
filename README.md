# Mitra

A privacy-first Indian mutual fund portfolio tracker. Import your CAMS CAS PDF, parse it entirely in the browser, and view a clean daily snapshot of your holdings. No sign-up. No cloud sync. No data leaves your device.

Single `index.html` file. No build step.

---

## What it does

- Import a password-protected CAMS CAS (Consolidated Account Statement) PDF.
- Parse it in-browser using `pdf.js` — the password and statement content never leave your device.
- Match schemes against the AMFI master list (via the public `api.mfapi.in`) to look up live NAVs.
- Render a monochrome dashboard with total value, total P&L, day's change, and per-fund cards.
- Store everything locally in IndexedDB. Optional PIN lock (salted SHA-256 via Web Crypto).

## What's NOT supported yet

- KFintech CAS — the parser rejects these upfront with a clear error.
- NSDL eCAS — same, parser support planned.
- XIRR, goal tracking, multi-portfolio, CSV export, dark mode, PWA install — all noted in [`PENDING.md`](./PENDING.md).

See [`mithra-mf-tracker.md`](./mithra-mf-tracker.md) for the full v1 spec.

---

## Running it

The simplest way — a local HTTP server so `pdf.js` and font loads work cleanly:

```bash
cd apps/mithra
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Any static host works too (GitHub Pages, Netlify, Cloudflare Pages, S3, etc.) — just upload `index.html`.

Opening `index.html` directly from `file://` will mostly work but some browsers block cross-origin worker loads for the PDF parser.

## Using it

1. **First launch** — empty state. Click **Import PDF**.
2. **Download your CAS** from [camsonline.com](https://www.camsonline.com/Investors/Statements/Consolidated-Account-Statement) → choose *Detailed* + *Password protected → Yes*. The PDF arrives by email.
3. **Import** — drop the PDF, enter the password (PAN in caps + DOB as `DDMMYYYY`, e.g. `ABCDE1234F01011990`), wait for parsing.
4. **Dashboard** — see total valuation, total gain, today's change, and a card per fund. Click a card for transaction history.
5. **Refresh NAVs** with the ↻ icon in the top-right (auto-fires on load + tab refocus if >1h stale).
6. **Settings** — name, PIN lock toggle, re-import, reset all data.

All portfolio data lives in your browser's IndexedDB. Clearing browser data wipes it — re-import the CAS to restore.

---

## Tech stack

Everything is loaded from CDN in a single HTML file:

| Layer | Library | Why |
|---|---|---|
| Reactivity | Alpine.js 3.x | Declarative data binding in HTML attributes, no build step |
| Styling | Tailwind CSS (Play CDN) | Utility-first, monochrome palette via inline config |
| PDF parsing | pdf.js 3.11 (UMD) | Mozilla's battle-tested in-browser PDF engine |
| Client storage | Dexie.js 3.x | Clean promise-based wrapper over IndexedDB |
| Icons + fonts | Material Symbols, Inter | Google Fonts |

External network calls are limited to the above CDNs and `api.mfapi.in` for NAV data. No analytics, no backend, no telemetry.

## Project structure

```
apps/mithra/
├── index.html                                # The entire app
├── mithra-mf-tracker.md                      # v1 product requirements
├── PENDING.md                                # Deferred work / known gaps
├── README.md
└── stitch_mitra_portfolio_tracker_designs/   # Stitch-generated UI mockups (reference)
```

## Privacy & security

- PDF password is held in memory only — never stored, never logged, never transmitted.
- PAN is extracted during parsing for reference but never persisted.
- All portfolio data lives in origin-sandboxed IndexedDB.
- PIN is stored as a salted SHA-256 hash via Web Crypto — never in plaintext.
- Only outbound HTTPS requests: CDN hosts (`cdn.jsdelivr.net`, `cdn.tailwindcss.com`, `fonts.googleapis.com`) and `api.mfapi.in` for NAV data.
- CAS PDFs are not committed to this repo — `.gitignore` excludes all `*.pdf`.

---

## License

No license chosen yet. Treat as "all rights reserved" until a LICENSE file is added.

---

_Personal project. Not affiliated with CAMS, KFintech, NSDL, AMFI India, or any AMC._
