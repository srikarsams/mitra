# Mitra

A privacy-first Indian mutual fund portfolio tracker. Import your CAS PDF, parse it entirely in the browser, and view a clean daily snapshot of your holdings. No sign-up. No cloud sync. No data leaves your device.

Single `index.html` file. No build step.

**Live:** https://mitra.srikarsams.workers.dev/

---

## Why this exists

Kuvera got acquired by CRED and the revamped app wasn't for me. I wanted something that didn't try to own my data in the first place, so I built this for my own use over a weekend with [Claude Code](https://claude.com/claude-code). It's an MVP; I'll keep improving it as and when I feel like it.

---

## What it does

- Import a password-protected CAMS CAS, CDSL eCAS, or NSDL eCAS.
- Parse it in-browser using `pdf.js`. The password and statement content never leave your device.
- Match schemes against the AMFI master list (via the public `api.mfapi.in`) to look up live NAVs.
- Render a monochrome dashboard with total value, total P&L, day's change, and per-fund cards.
- Store everything locally in IndexedDB. Optional PIN lock (salted SHA-256 via Web Crypto).

## Status

| Format | Status |
|---|---|
| **CAMS CAS (Detailed)** | Works well. Tested against multiple real statements; numbers match the PDF to the rupee. |
| **CAMS CAS (Summary)** | Rejected upfront with a clear error. Download the Detailed variant from camsonline.com instead. |
| **CDSL eCAS** | Parser exists but has not been validated against a real PDF. Grammar ported from [codereverser/casparser](https://github.com/codereverser/casparser). Mutual-fund holdings only; equities and bonds are silently filtered. First real statement to come through may need fixes. |
| **NSDL eCAS** | Same as CDSL. Blind implementation, mutual-fund-only. |
| **KFintech CAS** | Not supported yet. Rejected upfront. |

Deferred features (XIRR, goal tracking, multi-portfolio, CSV export, dark mode, PWA install) are tracked in [`PENDING.md`](./PENDING.md).

---

## Running it

Local HTTP server so `pdf.js` and font loads work cleanly:

```bash
cd apps/mithra
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Any static host works too (GitHub Pages, Netlify, Cloudflare Pages, S3, Cloudflare Workers) — just serve `index.html`.

Opening `index.html` directly via `file://` mostly works, but some browsers block cross-origin worker loads for the PDF parser.

## Using it

1. **First launch** — empty state. Click **Import PDF**.
2. **Download your CAS** from [camsonline.com](https://www.camsonline.com/Investors/Statements/Consolidated-Account-Statement) → choose *Statement Type → **Detailed*** (not Summary) and *Password protected → Yes*. The PDF arrives by email.
3. **Import** — drop the PDF, enter the password (PAN in caps + DOB as `DDMMYYYY`, e.g. `ABCDE1234F01011990`), wait for parsing.
4. **Dashboard** — total valuation, total gain, today's change, and a card per fund. Click a card for transaction history.
5. **Refresh NAVs** with the ↻ icon in the top-right (auto-fires on load + tab refocus if >1h stale).
6. **Settings** — name, PIN lock toggle, re-import, reset all data, export diagnostic.

All portfolio data lives in your browser's IndexedDB. Clearing browser data wipes it; re-import the CAS to restore.

---

## Reporting a parse issue

If your import fails or the numbers look wrong, the fastest way to help is the diagnostic export:

1. Open **Settings → About → Export Diagnostic**.
2. A JSON file downloads to your machine. PAN, email, mobile, address, folio numbers, nominee names, DP/Client Ids, and bank-account suffixes are all redacted before export. Scheme names, amounts, ISINs, and dates are kept so the parser can be replayed against your exact layout.
3. Open an issue on [GitHub](https://github.com/srikarsams/mitra/issues) and attach the JSON.

Drop-in regression testing against real fixtures works via `node scripts/test-parser.js` with the JSON copied into `apps/mithra/fixtures/` (gitignored by default).

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
├── scripts/test-parser.js                    # Node regression harness
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
- Diagnostic exports are sanitised before download; they are not auto-uploaded anywhere. You choose whether to share.

---

## License

[The Unlicense](./LICENSE) — released into the public domain. Do whatever you want with it.

---

_Personal project. Not affiliated with CAMS, KFintech, NSDL, CDSL, AMFI India, CRED, Kuvera, or any AMC._
