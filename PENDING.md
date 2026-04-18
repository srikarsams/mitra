# Mitra — Pending Work

Tracking what's deferred from the v1 implementation in `index.html`. Sorted by priority / likely order of attack.

---

## Parser coverage

### Deferred registrars
- [ ] **KFintech CAS** — different scheme-line layout and section headers. Detection stub already rejects KFintech PDFs with a clear error (`UNSUPPORTED_KFINTECH`). Write a parallel parser branch and route by header keywords (`CAMSCAS` → CAMS, `KFINCAS` / `KFINTECH` → KFintech).
- [ ] **NSDL eCAS** — completely different tabular format. Most comprehensive of the three (covers CAMS + KFintech in one statement), worth doing well once started. Rejected today with `UNSUPPORTED_NSDL`.

### CAMS edge cases not yet validated
Tested against exactly one real CAMS CAS (`CAS_01042025-17042026_*_unlocked.pdf`). Likely gaps, in rough order of incidence:

- [x] **Dividend payouts** — *closed via 4-shape transaction cascade in v1.2 (`tryExtractTxn` accepts 3-col rows; `DIVIDEND_RE` distinguishes payout vs reinvest).*
- [x] **STT / Stamp duty / TDS rows** — *closed via 1-col shape; previously misclassified as `OTHER`.*
- [x] **Segregated portfolio (side-pocket) rows** — *closed via 2-col shape.*
- [x] **Joint / minor / PoA holders** — *closed: `nameCandidateRe` now accepts `MR/MRS/SMT/MS/SHRI/DR/M\/S` titles and `(MINOR)/(HUF)/(KARTA)/(POA)` suffixes.*
- [x] **Pre-2022 CAMS layouts** — *partial: `marketRe` now accepts both "Market Value on" and "Valuation on". Format detection still relies on the `CAMSCAS` footer marker.*
- [~] **NFO allotments** — *partial: 3-col shape now catches some allotment rows; "Allotment" description still classifies as `PURCHASE`. Still untested against an actual NFO CAS.*
- [~] **IDCW / Dividend option schemes** — *parsing closed; AMFI fuzzy-match collision with growth variants is unchanged (separate concern from parser).*
- [ ] **Bonus units / stock splits** — unit count changes with no invested amount.
- [ ] **SIP registration / SIP cancellation** — often no numeric columns; still classified `OTHER` and ignored.
- [ ] **Folio-level switches across AMCs** — requires linking a `SWITCH_OUT` in one fund to a `SWITCH_IN` in another.
- [ ] **Statements with 20+ funds** — multi-page transaction tables, tighter y-band packing. Should be more robust now that x-gap column detection no longer relies on `mergeOrphanNumbers`, but unverified.

### Parser hardening
- [ ] Proper AMFI-matching quality metric: currently falls through to a name-token-overlap score ≥ 0.7 with no tie-breaker. Ambiguous matches should be flagged, not silently picked.
- [x] ~~Cleaner orphan-number heuristic~~ — *closed in v1.2: `extractLines` now emits `\t\t` column separators based on x-gaps, so transaction rows arrive intact and `mergeOrphanNumbers` was deleted.*
- [ ] Format autodetection should look at more than just the header — some CAMS statements are relayed via KFintech or vice versa. (Summary CAS is now rejected upfront via `CAS_TYPE_RE`.)
- [x] **Diagnostic export** — *closed: Settings → About → "Export Diagnostic" downloads a sanitized JSON of the last parse (PAN/folio/name redacted; scheme names + amounts retained) to help diagnose parser issues against real CAS PDFs without sharing PII.*
- [x] **Fixture harness** — *closed: `?debug=parser` runs in-browser fixtures (`runParserFixtures`) covering 4-col purchase, 3-col dividend payout, and Registrar line-wrap. Result logged to console as `[Mitra fixtures] N/M passed`.*

---

## App features deferred from v1

### Explicit PRD §13 items (out of scope for v1, carried forward)
- [ ] **XIRR** per fund and portfolio-level.
- [ ] **Goal tracking** — tag funds to goals (retirement, house, etc).
- [ ] **Multi-portfolio support** — family-member portfolios via in-app switcher.
- [ ] **PWA install** — Service Worker + Add to Home Screen. App currently works from cache after first load; not true offline.
- [ ] **CORS proxy fallback** — Cloudflare Worker for `amfiindia.com/spages/NAVAll.txt` when `api.mfapi.in` is down.
- [ ] **CSV / PDF export** of current portfolio snapshot.
- [ ] **Category-wise breakdown** — pie chart (Equity / Debt / Hybrid / etc).
- [ ] **Manual fund entry** for purchases not yet in CAS.
- [ ] **Dividend tracking view.**
- [ ] **Dark mode** — invert monochrome palette; honor `prefers-color-scheme`.
- [ ] **Scheme comparison** — two or more funds side-by-side over time.
- [ ] **Encrypted backup / restore** — export IndexedDB as JSON file.
- [ ] **Keyboard shortcuts** — `R` refresh, `/` search, `Esc` close modals (Esc works today, rest pending).
- [ ] **Native mobile apps.**

### UX / polish gaps
- [ ] **Fund categorisation** — `fund.category` is always empty; CAS doesn't expose it. Could be derived from the AMFI master scheme name (e.g. "Equity: Flexi Cap") once that field is populated in `matchScheme`.
- [ ] **Empty-state illustration** uses inline monochrome divs (matches Stitch mock); a dedicated SVG would be cleaner.
- [ ] **Import summary screen** shows warnings but no way to drill into them.
- [ ] **Re-import behavior** — preserves PIN but wipes everything else; users have no review step to compare old vs new parse.
- [ ] **Hourly auto-refresh** — currently refreshes on load + tab-refocus (if >1h stale). No `setInterval`-driven polling; trivially added if requested.
- [ ] **Refresh indicator** — while refreshing, the `↻` icon spins. No persistent "last updated X min ago" label on the dashboard (`NAV as of` shows it, but only after a successful refresh).
- [ ] **Toast / confirmation feedback** — import success and NAV refresh currently lack post-action confirmation toasts.
- [ ] **Fund detail screen** — lists all transactions chronologically; no grouping (SIPs vs lump-sum), no filter, no XIRR.

### Security hardening
- [ ] **PIN attempt throttling** — no rate-limit on wrong PIN guesses. Web Crypto hash is fast enough that an attacker with local DB access could brute-force a 4-digit PIN offline. Fine for v1; add PBKDF2 with high iteration count before claiming PIN as a real security feature.
- [ ] **Passkey / WebAuthn alternative** — PRD §5.5 mentions it, not yet implemented.
- [ ] **Password field clearing** — password lives in Alpine state during import; cleared after parse, but kept in DOM node value briefly. Acceptable for v1, document in a security pass.

### Browser / runtime
- [ ] **Service Worker** — not registered; the app needs network for the first visit. CDN libraries are cached by the browser but not explicitly offline-available.
- [ ] **pdf.js version** — using 3.11.174 (UMD) for `file://` compatibility; 4.x ESM would be smaller. Switch once hosted on HTTPS.
- [ ] **Tailwind CDN** — production warning shows in console. Swap to Tailwind CLI build once v1 stabilizes and we tolerate a tiny build step.

---

## Known quirks to be aware of

- On dashboard entry the NAV refresh fires regardless of staleness — intentional for now to make the mfapi calls visible during debugging. Revert to "only if >1h old" before shipping.
- The `console.log('[Mitra] ...')` lines are left in place for visibility. Remove or gate behind a debug flag for release.
- After a reset, the AMFI scheme master is retained in IndexedDB (`schemeMaster` table survives `wipe()`). This is deliberate — the master is generic, not user data — but worth documenting.

---

_Last updated: 2026-04-17_
