# Product Requirements Document
## **Mitra** — Indian Mutual Fund Portfolio Tracker

**Version:** 1.0  
**Last Updated:** April 17, 2026  
**Author:** Product  
**Platform:** Web (Next.js SPA — desktop & mobile responsive)

---

## 1. Problem Statement

Indian mutual fund investors receive transaction statements from two registrars — CAMS and KFintech — as password-protected PDFs. There is no simple, privacy-first way to consolidate these into a single portfolio view without handing data to a third-party cloud service. Existing apps (Groww, Kuvera, INDmoney) require linking bank accounts or email access, which many investors are uncomfortable with.

**Mitra** is a minimal, offline-capable web app that lets users import their CAS (Consolidated Account Statement) PDFs, parses them entirely in the browser, and shows a clean daily snapshot of their mutual fund holdings — no sign-up, no cloud sync, no data leaving the browser.

---

## 2. Target User

- **Primary:** Self-directed Indian mutual fund investors (25–45 years) who invest via multiple AMCs and want a single consolidated view without sharing credentials with yet another app.
- **Secondary:** Financially aware individuals who track family members' portfolios (spouse, parents) using separate browser profiles or re-importing different CAS files.

---

## 3. Design Philosophy

| Principle | Implementation |
|---|---|
| **Black & white UI** | Monochrome palette. No gradients, no color except red/green for loss/profit indicators. |
| **Data stays in browser** | PDF parsing, storage, and computation happen client-side using IndexedDB. Only outbound call is NAV fetch from public AMFI endpoint. No backend server. |
| **Zero sign-up** | No accounts, no email, no phone number. App is ready to use on first visit. |
| **Single-purpose** | Track mutual fund portfolio value. No news, no recommendations, no social features. |

---

## 4. Information Architecture

```
App Load (browser)
│
├── [If PIN lock enabled] → PIN Entry Gate
│
├── Home (Portfolio Dashboard)
│   ├── Total Portfolio Summary Bar
│   ├── Fund List (scrollable)
│   └── Refresh button
│
├── Import
│   ├── File upload (drag & drop + browse)
│   ├── Password entry
│   └── Import progress + result summary
│
└── Settings
    ├── User Name
    ├── PIN Lock toggle
    ├── Reset All Data
    └── About / Version
```

---

## 5. Screen-by-Screen Specification

### 5.1 First Launch / Empty State

**Trigger:** No portfolio data exists in local storage.

| Element | Detail |
|---|---|
| Illustration | Minimal line-art of a document with an upload arrow. Monochrome. |
| Headline | **"Import your mutual fund statement to get started"** |
| Subtext | "Download your Consolidated Account Statement (CAS) from CAMS or KFintech as a PDF, then import it here." |
| CTA | **[Import PDF]** — full-width black button, white text |
| Secondary link | "How do I get my CAS?" → opens a modal with step-by-step instructions for downloading CAS from camsonline.com and kfintech.com |

**UX Note:** No onboarding carousel. No name prompt on first visit — name is extracted from the PDF. If extraction fails, the app prompts once after import.

---

### 5.2 Import Flow

**Entry points:** Empty state CTA, Home screen "Import" button in header, Settings → "Import Statement"

#### 5.2.1 File Selection

- Drag-and-drop zone with a dashed border, plus a **[Browse Files]** button as fallback. Accepts only `.pdf` files (validated via MIME type and extension).
- On selection, immediately show the file name and size in a confirmation card below the drop zone.
- On mobile browsers, the browse button opens the native file picker.

#### 5.2.2 Password Entry

- Modal dialog with a single password field.
- Helper text: *"Usually your PAN (in caps) followed by date of birth in DDMMYYYY format. Example: ABCDE1234F01011990"*
- **[Unlock & Import]** button.
- If decryption fails → inline error: *"Incorrect password. Please check your PAN and date of birth format."* Field is cleared and refocused.

#### 5.2.3 Parsing & Import

- Full-screen progress state with a thin progress bar and status text:
  - "Decrypting PDF…"
  - "Reading transactions…"
  - "Matching fund schemes…"
  - "Computing holdings…"
- On completion → **Import Summary** card:
  - Number of funds found
  - Number of transactions parsed
  - Date range of transactions (earliest → latest)
  - Total invested amount
  - Any funds that could not be matched (with ISIN displayed for debugging)
- **[View Portfolio]** button navigates to Home.

#### 5.2.4 Re-Import / Merge Behaviour

When data already exists and a new PDF is imported:

- **Full replace strategy.** The new CAS is treated as the source of truth. Previous local data is overwritten entirely.
- Before replacing, show a confirmation: *"This will replace your existing portfolio data with the new statement. Continue?"*
- Rationale: CAS statements are cumulative (they contain all historical transactions), so the latest statement is always the most complete. Merge logic introduces complexity and error surface for v1.

---

### 5.3 Home — Portfolio Dashboard

This is the primary screen. Every element is designed for a single glanceable read.

#### 5.3.1 Portfolio Summary Header (sticky)

```
┌─────────────────────────────────────┐
│  Good morning, Srikar               │
│                                     │
│  ₹12,45,230                         │  ← Current portfolio value (large)
│  ₹10,00,000 invested                │  ← Total invested (muted, smaller)
│                                     │
│  +₹2,45,230  (+24.52%)         ▲    │  ← Total P&L (green)
│  Today: +₹3,420  (+0.27%)      ▲    │  ← Daily change (green)
│                                     │
│  NAV as of: 10 Apr 2026, 11:30 PM   │  ← Last refresh timestamp
└─────────────────────────────────────┘
```

**Rules:**
- Profit values and the arrow (▲) use `#16A34A` (green).
- Loss values and the arrow (▼) use `#DC2626` (red).
- Zero change is displayed in the default text colour (black/dark grey) with a `—` instead of an arrow.
- Currency formatting: Indian numbering system (lakhs, crores) with commas. Example: `₹12,45,230`.
- Greeting is time-aware: Good morning / afternoon / evening.

#### 5.3.2 Fund List

Scrollable list below the header. Each fund is a card.

```
┌─────────────────────────────────────┐
│  Axis Bluechip Fund - Direct Growth │  ← Scheme name (truncate with …)
│                                     │
│  Current   ₹2,34,500                │
│  Invested  ₹2,00,000                │
│                                     │
│  +₹34,500  (+17.25%)           ▲    │  ← Total P&L
│  Today: +₹580  (+0.25%)        ▲    │  ← Daily change
│                                     │
│  12.345 units @ ₹189.92 NAV         │  ← Units held, latest NAV
└─────────────────────────────────────┘
```

**Sorting:** Default sort by current value (highest first). User can click a sort icon in the list header to cycle through: Value ↓, P&L % ↓, Daily change % ↓, Alphabetical.

**Fund Detail View (click a card):**

| Section | Content |
|---|---|
| Fund header | Full scheme name, AMFI code, ISIN, fund category |
| Value summary | Current value, invested amount, total P&L (₹ and %), XIRR if feasible |
| Holdings | Total units, latest NAV, NAV date |
| Transaction history | Chronological list of all transactions from the CAS — date, type (Purchase / Redemption / Switch In / Switch Out / Dividend Reinvestment), amount, units, NAV |

---

### 5.4 NAV Refresh

#### 5.4.1 Automatic Refresh

- On page load or tab regain focus (if last refresh was >1 hour ago), silently fetch latest NAVs.
- Source: `api.mfapi.in` (CORS-enabled, JSON) called directly via `fetch()`. If the API is unreachable, serve last-cached NAV data from IndexedDB and show a banner.
- Match via AMFI scheme code (extracted during PDF parsing and stored locally).
- If fetch fails (no network), show a subtle inline banner: *"Could not refresh NAVs. Showing data from [last refresh date]."* Banner is dismissible.

#### 5.4.2 Manual Refresh

- Refresh icon button (↻) in the top-right of the Portfolio Summary Header.
- During refresh, show a small spinner replacing the refresh icon. No full-screen loader.
- On success, update the "NAV as of" timestamp.

#### 5.4.3 Daily Change Calculation

```
daily_change_per_fund = (today_NAV - previous_day_NAV) × units_held
daily_change_% = ((today_NAV - previous_day_NAV) / previous_day_NAV) × 100
daily_change_portfolio = sum(daily_change_per_fund for all funds)
```

If today's NAV is not yet available (market hours, holiday), use the most recent available NAV and indicate the date.

---

### 5.5 Settings

Accessible via a gear icon in the top-right corner of Home.

| Setting | Behaviour |
|---|---|
| **Name** | Displays current name (extracted from CAS or manually entered). Clickable → inline text field to edit. Saved on blur / enter. |
| **PIN Lock** | Toggle switch. When enabled, the user sets a 4–6 digit PIN. On every page load or tab regain focus after 5 minutes of inactivity, the app shows a full-screen PIN entry gate before revealing portfolio data. PIN is stored as a salted hash in IndexedDB — never in plaintext. If the browser supports the Web Authentication API (passkeys/biometrics), offer that as an alternative unlock method alongside PIN. |
| **Import Statement** | Opens the Import flow (5.2). |
| **Reset All Data** | Destructive action. Clicking shows a confirmation dialog: *"This will permanently delete all your portfolio data. This cannot be undone."* with **[Cancel]** and **[Reset]** (red text). On confirm, clear all IndexedDB stores and return to the Empty State (5.1). |
| **About** | App version, open-source licenses link, data source attribution (AMFI India). |

---

## 6. PDF Parsing Specification

### 6.1 Supported Formats

| Source | Format | Notes |
|---|---|---|
| CAMS CAS | Password-protected PDF | Password = PAN + DOB (DDMMYYYY) |
| KFintech CAS | Password-protected PDF | Same password convention |
| NSDL CAS | Password-protected PDF | Consolidated statement across CAMS + KFintech. Preferred if user has it. |

### 6.2 Data Extraction

The parser must extract:

| Field | Source in PDF | Storage |
|---|---|---|
| Investor name | Header section of CAS | `user.name` (used for greeting) |
| PAN | Header section | Not stored (used only for validation) |
| Fund house / AMC name | Section headers | `fund.amc` |
| Scheme name | Sub-section headers | `fund.schemeName` |
| AMFI code / Scheme code | Folio details or derived from scheme name via AMFI master | `fund.amfiCode` (primary key for NAV lookup) |
| ISIN | Folio details | `fund.isin` (fallback key) |
| Folio number | Folio header | `fund.folioNumber` |
| Transaction date | Transaction table | `transaction.date` |
| Transaction type | Transaction table (Purchase, Redemption, Switch In, etc.) | `transaction.type` |
| Amount (₹) | Transaction table | `transaction.amount` |
| Units | Transaction table | `transaction.units` |
| NAV at transaction | Transaction table | `transaction.nav` |
| Unit balance | Running balance column | Used to validate parsing; final row = current holding |

### 6.3 Scheme Matching

After extracting scheme names, match each to an AMFI scheme code:

1. Fetch the AMFI master list via `api.mfapi.in` — cache in IndexedDB, refresh weekly.
2. Match by ISIN (exact match, most reliable).
3. If ISIN not available in PDF, fuzzy-match scheme name against the AMFI master using Levenshtein distance with a confidence threshold.
4. Unmatched schemes are flagged in the import summary and stored without NAV tracking until manually resolved in a future version.

### 6.4 In-Browser Processing

- PDF decryption and text extraction must run entirely client-side in the browser.
- Use Mozilla's `pdf.js` loaded from CDN (`cdn.jsdelivr.net/npm/pdfjs-dist`). It supports password-protected PDFs natively.
- The `pdf.js` `<script>` tag is lazy-loaded only when the user initiates an import — not on initial page load — to keep first paint fast.
- For heavy CAS files (50+ pages), show a progress indicator with status updates. The pdf.js worker (loaded from CDN) handles decryption off the main thread automatically.
- No PDF content is transmitted to any server.

---

## 7. Data Model (IndexedDB via Dexie.js)

Use Dexie.js for structured IndexedDB access. Define stores with versioned schema:

```
User
├── id: string (browser-generated UUID)
├── name: string
├── pinHash: string (nullable — salted SHA-256 hash of PIN, null if lock disabled)
└── lastNavRefresh: ISO datetime

Fund
├── id: string (UUID)
├── amfiCode: string (primary key for NAV lookup)
├── isin: string (nullable)
├── schemeName: string
├── amc: string
├── folioNumber: string
├── category: string (nullable — Equity Large Cap, Debt Short Duration, etc.)
├── currentNav: number
├── previousNav: number
├── navDate: ISO date
├── totalUnits: number (computed from transactions)
└── totalInvested: number (computed from transactions)

Transaction
├── id: string (UUID)
├── fundId: FK → Fund.id
├── date: ISO date
├── type: enum (PURCHASE, REDEMPTION, SWITCH_IN, SWITCH_OUT, DIVIDEND_REINVEST, DIVIDEND_PAYOUT, SIP)
├── amount: number
├── units: number
├── nav: number
└── balance: number (running unit balance)
```

**Computed at query time (not stored):**
- `currentValue = totalUnits × currentNav`
- `totalPnL = currentValue - totalInvested`
- `totalPnLPercent = (totalPnL / totalInvested) × 100`
- `dailyChange = totalUnits × (currentNav - previousNav)`
- `dailyChangePercent = ((currentNav - previousNav) / previousNav) × 100`

---

## 8. Tech Stack

**Architecture: Single `index.html` file. No build step, no bundler, no Node.js. All libraries loaded via CDN.**

| Layer | Choice | CDN | Rationale |
|---|---|---|---|
| Reactivity | Alpine.js 3.x | `cdn.jsdelivr.net/npm/alpinejs` | Declarative data binding in HTML attributes (`x-data`, `x-show`, `x-for`). No virtual DOM, no build step. Perfect for state-driven UI like fund lists, modals, sort toggles. |
| Styling | Tailwind CSS (CDN play) | `cdn.tailwindcss.com` | Utility-first, enforces monochrome palette via config. CDN play version works without a build step. |
| PDF parsing | pdf.js (Mozilla) | `cdn.jsdelivr.net/npm/pdfjs-dist` | Battle-tested, runs in-browser, supports password-protected PDFs. Worker loaded from same CDN. |
| Client storage | Dexie.js | `cdn.jsdelivr.net/npm/dexie` | Clean Promise-based wrapper over IndexedDB. Structured queries, versioned schema, ~20 KB. |
| Icons | Lucide (optional) | `cdn.jsdelivr.net/npm/lucide` | Lightweight icon set. Only need ~5 icons (refresh, settings, sort, upload, lock). |

### 8.1 Why Single-File

- **Zero tooling** — no `npm install`, no `node_modules`, no webpack/vite config. Open the file in a browser and it works.
- **Portable** — can be hosted on any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3) or even run from `file://` for local use (except NAV fetch which needs HTTPS).
- **Hackable** — a single motivated developer can read, understand, and modify the entire app in one sitting.
- **No framework lock-in** — Alpine.js is 15 KB and can be swapped out without rewriting business logic.

### 8.2 File Structure

```
index.html          ← Entire app: HTML + Alpine components + Tailwind + inline JS modules
```

All application logic (PDF parser, NAV fetcher, IndexedDB operations, portfolio computations) lives in `<script>` blocks within the single HTML file, organized as clearly commented sections:

```html
<!-- ====== STYLES & TAILWIND CONFIG ====== -->
<!-- ====== ALPINE STORES (global state) ====== -->
<!-- ====== DB LAYER (Dexie / IndexedDB) ====== -->
<!-- ====== PDF PARSER ====== -->
<!-- ====== NAV FETCHER ====== -->
<!-- ====== PORTFOLIO MATH ====== -->
<!-- ====== UI COMPONENTS (Alpine x-data blocks) ====== -->
```

### 8.3 State Management

Alpine.js `$store` for global reactive state shared across components:

```
Alpine.store('portfolio')
├── user: { name, pinHash, lastNavRefresh }
├── funds: [ { amfiCode, schemeName, amc, units, invested, currentNav, previousNav, ... } ]
├── summary: { totalValue, totalInvested, totalPnL, totalPnLPercent, dailyChange, dailyChangePercent }
├── ui: { currentView, sortBy, isRefreshing, isImporting, showSettings, showPinGate }
└── methods: loadFromDB(), refreshNavs(), importPdf(file, password), resetAll()
```

State is hydrated from IndexedDB on page load via Dexie, and written back on every mutation. Alpine's reactivity handles all DOM updates automatically.

### 8.4 CORS Fallback Without a Backend

Since there is no server-side component in a single HTML file, the CORS fallback strategy is adjusted:

- **Primary:** `api.mfapi.in` — CORS-enabled, call directly from `fetch()`.
- **Fallback:** If `api.mfapi.in` is down, show a banner: *"NAV update temporarily unavailable. Showing last available data."* No proxy, no edge function.
- **Future option:** If a custom domain is added later, a Cloudflare Worker or Vercel edge function can be deployed separately as a CORS proxy. This is not required for v1.

---

## 9. API Dependencies

| Endpoint | Purpose | Rate / Auth | Role |
|---|---|---|---|
| `api.mfapi.in/mf/{scheme_code}` | Historical + latest NAV per scheme (JSON) | Public, no auth, CORS-enabled, community-maintained | **Primary** — called directly from browser |
| `api.mfapi.in/mf/{scheme_code}/latest` | Latest NAV only | Public, no auth, CORS-enabled | **Primary** — lightweight check for daily refresh |
| `amfiindia.com/spages/NAVAll.txt` | Bulk daily NAV for all MF schemes | Public, no auth, no CORS, updates ~11 PM IST | **Not used in v1** — reserved for future CORS proxy fallback |

No other external APIs are used. No analytics SDKs. No server-side code. No crash reporting in v1.

---

## 10. Non-Functional Requirements

| Dimension | Target |
|---|---|
| **First paint** | < 2 seconds to Largest Contentful Paint on a 4G connection (CDN-loaded libs) |
| **PDF parse time** | < 10 seconds for a 50-page CAS (tested on Chrome/mid-range Android) |
| **NAV refresh** | < 3 seconds on a 4G connection |
| **IndexedDB size** | < 5 MB for a portfolio with 30 funds and 5 years of transactions |
| **Offline capability** | Portfolio data persists in IndexedDB across sessions. App loads from browser cache on revisit. Only NAV refresh requires network. Full Service Worker offline support is deferred to v2. |
| **Browser support** | Chrome 90+, Safari 15+, Firefox 90+, Edge 90+ (desktop & mobile) |
| **Responsive** | Fully usable from 320px (iPhone SE) to 1440px+ (desktop). Single-column layout on mobile, comfortable card grid on desktop. |
| **Accessibility** | Minimum contrast ratio 4.5:1 (WCAG AA). Keyboard navigable. Screen reader labels on all interactive elements. Respects `prefers-reduced-motion`. |
| **CDN payload** | Alpine (~15 KB) + Dexie (~20 KB) + Tailwind CDN (~100 KB) loaded on first visit, cached by browser. pdf.js (~400 KB) loaded on-demand only during import. |
| **Single file** | Entire application must remain in one `index.html` file. No external JS/CSS files authored by us. All third-party code via CDN `<script>` tags. |

---

## 11. Edge Cases & Error Handling

| Scenario | Handling |
|---|---|
| PDF is not a CAS (random PDF uploaded) | After parsing attempt, show: *"This doesn't look like a mutual fund statement. Please import a CAS from CAMS, KFintech, or NSDL."* |
| CAS has zero transactions | Show: *"No transactions found in this statement."* Return to empty state. |
| Fund scheme no longer exists (merged/closed) | Store with last known NAV. Display with a subtle "Scheme closed" label. Units still counted in portfolio total at last NAV. |
| NAV API returns stale data (weekend/holiday) | Display the NAV date prominently. No error — this is expected behaviour. |
| Device has no internet on first visit after import | Show portfolio with invested amounts only. NAV columns show "—". Banner: *"Connect to the internet to fetch latest NAVs."* |
| Extremely large CAS (100+ pages) | Show a progress indicator with page count. If parsing exceeds 30 seconds, show a "Still working…" reassurance message. |
| Multiple folios for the same scheme | Consolidate into a single fund card. Sum units and invested amounts. Show folio numbers in the detail screen. |
| SIP/STP/Switch transactions | Parse as distinct transaction types. Switch Out reduces units; Switch In adds units (potentially to a different fund). |

---

## 12. Security & Privacy

| Concern | Mitigation |
|---|---|
| PDF password handling | Password is used in-memory for decryption only. Never stored, never logged, never transmitted. Cleared from memory after parsing completes. |
| PAN exposure | PAN is extracted for validation during import but not persisted in IndexedDB. |
| Client-side storage | All data lives in IndexedDB within the browser's origin-sandboxed storage. PIN is stored as a salted SHA-256 hash using the Web Crypto API — never in plaintext. No sensitive data in `localStorage` or cookies. |
| Network traffic | Only outbound HTTPS GET to `api.mfapi.in` and CDN hosts (`cdn.jsdelivr.net`). No POST requests. No user data ever leaves the browser. Zero server-side code. |
| App lock | PIN entry gate on page load / tab refocus after inactivity timeout. Optionally Web Authentication API (passkey/biometric) where supported. |
| Data portability risk | Browser storage can be cleared by the user or browser policies. Display a subtle note in Settings: *"Your data is stored in this browser. Clearing browser data will erase your portfolio. Re-import your CAS to restore."* |
| CORS | `api.mfapi.in` is CORS-enabled — browser calls it directly. No proxy or edge function needed. If the API is unreachable, the app gracefully degrades to last-cached NAV data from IndexedDB. |

---

## 13. Future Scope (Not in v1)

These are explicitly out of scope for the initial release but noted for future planning:

- **XIRR calculation** per fund and portfolio-level
- **Goal tracking** — assign funds to goals (retirement, house, education)
- **Multi-portfolio support** — track family members' portfolios separately via in-app profile switcher
- **PWA install** — Service Worker for full offline support + Add to Home Screen prompt on mobile
- **CORS proxy fallback** — Cloudflare Worker to proxy `amfiindia.com/spages/NAVAll.txt` when `api.mfapi.in` is unreachable
- **Export** — CSV/PDF export of current portfolio snapshot
- **Category-wise breakdown** — pie chart of allocation across Equity, Debt, Hybrid, etc.
- **Manual fund entry** — add funds not in CAS (e.g., direct purchases not yet reflected)
- **Dividend tracking** — separate view for dividend income
- **Dark mode** — invert the monochrome palette (white on black), respect `prefers-color-scheme`
- **Scheme comparison** — compare two or more funds' NAV performance over time
- **Data backup/restore** — export IndexedDB as encrypted JSON file, re-import on another browser/device
- **Keyboard shortcuts** — R to refresh, / to search funds, Esc to close modals
- **Native mobile apps** — React Native / Flutter wrapper reusing the core parsing and computation logic

---

## 14. Success Metrics

| Metric | Target (3 months post-launch) |
|---|---|
| Successful PDF imports (no errors) | > 90% of attempts |
| Weekly active users | > 50% of users who completed an import return at least 3 days/week |
| PIN Lock adoption | > 30% of users enable PIN lock |
| Lighthouse Performance score | > 90 on mobile audit |
| Average LCP | < 2 seconds |
| PDF parse success rate across browsers | > 95% (Chrome, Safari, Firefox, Edge) |

---

## 15. Open Questions

1. **`api.mfapi.in` reliability** — Community-maintained API with no SLA. Cache every successful NAV response in IndexedDB with a 24-hour TTL so the app always has data to show. If the API is down for extended periods, evaluate adding a standalone CORS proxy (Cloudflare Worker) as a v1.1 enhancement.
2. **NSDL CAS format** — NSDL's eCAS is the most comprehensive (covers both CAMS and KFintech). Parser coverage for this format should be prioritised but needs sample PDFs for testing.
3. **Folio-level vs scheme-level consolidation** — Should multiple folios under the same scheme always be merged, or should users have the option to view folio-wise? v1 proposes auto-merge.
4. **IndexedDB storage limits** — Most browsers allow 50 MB+ per origin, well above our needs. However, Safari in private browsing mode may evict data. Display a warning if private browsing is detected.
5. **pdf.js CDN load** — The full `pdf.js` library is ~400 KB gzipped. Lazy-load the `<script>` tag only when the user initiates an import, not on initial page load. Use `pdfjs-dist` slim build if available on CDN.
6. **Hosting** — Since this is a single HTML file, it can be hosted anywhere: GitHub Pages (free, zero config), Netlify, Cloudflare Pages, or even shared as a downloadable file. No server-side compute needed.
7. **Single-file scalability** — If the codebase grows beyond ~3000 lines, consider splitting into `index.html` + a few `<script src="...">` files hosted alongside it, while keeping the zero-build-step philosophy.

---

*This document is the single source of truth for the Mitra v1 product scope. Any feature not listed here is out of scope.*
