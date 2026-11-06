# Changelog

All notable changes to this project. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed (real Chrome negative-control test, 2026-11-06)
- “Wants you to continue by phone” fired on WhatsApp bank-detail requests because “bank account number” was read as a
  phone number. The phone-lure rule now ignores account/card/ID numbers; a new, accurate indicator — “Requests sensitive
  financial information through an informal messaging channel” — covers bank details requested over WhatsApp/SMS/DM
  (same off-the-record category and points, so the reported 70/100 High is unchanged).
- Extension popup “Checks performed”: rows showed only name + outcome; explanations, evidence and recommendations were
  never rendered. Rows now come from a shared, tested `checkRows()` model (with fallbacks so no row can be blank) and
  expand to show full detail.

### Added / fixed (final verification, 2026-11-06)
- Real MP4 brand intro (1920×1080 and 1080×1920, 9 s, H.264, silent) rendered from the official emblem with
  scripts/render-intro.swift (CoreGraphics/CoreText/CoreImage) + ffmpeg; code animation kept as automatic fallback.
  Fixed: React didn't set the `muted` attribute, so first-visit autoplay was refused.
- Lanczos @2x/@3x emblem upscales served via srcset for large renders.
- Analyzer: new indicators “Job promised without any assessment” (+20) and “Unexpected request for bank-account
  details” (+20, not applied when the request points to an official onboarding/payroll portal). M26 and L01 now pass
  for these reasons; M05 restored to its original High expectation; added M42/M43 legitimate counter-cases.
  Test Lab: 73/73. Unit tests: 101.
- PWA: precaching was broken (duplicate, conflicting entries for favicons and the emblem) — fresh installs cached
  nothing. Fixed; brand images in /assets now carry revisions so they update.

### Fixed / changed (product polish, 2026-11-06)
- Navigation: tabs wrapped onto two lines and jumped when clicked. Cause: at 1280–1440 px the six links had only
  ~588 px, list items could shrink, labels could wrap, and the active-underline layout animation redistributed the
  shrunk widths on every click. Fix: no-wrap labels, non-shrinking items, single-button theme toggle in the header,
  `scrollbar-gutter: stable`. Verified identical tab widths on every route.
- Landing: editorial hero (no form at the centre) with real counts; new "How CUSTODI decides" ledger rendered from
  `DEFAULT_SCORING`; new "Privacy & limitations" section; hero emblem capped near native resolution.
- Intro remains a code-based animation (no MP4: no video file and no ffmpeg on the build machine).

### Changed (official CUSTODI emblem, 2026-11-06)
- Official supplied emblem now used everywhere (site, hero, intro, favicon, PWA icons, extension icons, popup, welcome
  page) via `scripts/build-logo-assets.mjs`; removed the generated C monogram and the three.js hero (−19 packages).
- Website intro rebuilt around the emblem (particles, light beam, top-to-bottom reveal, light pass, wordmark, tagline).
- Extension popup: one-time ≈2.4 s branded intro with Skip; "Replay intro" in the popup footer.
- Mobile audit (320×568 → 1440×900): touch targets enlarged to ≥36–44 px, minimum text size raised to 11 px.

### Changed (CUSTODI rebrand + engine upgrade, 2026-11-06)
- Renamed SHIELD → CUSTODI everywhere (packages are now `@custodi/*`; saved `shield.*` data is read once and migrated).
- New C monogram, wordmark, favicon, PWA/extension icons, 3D hero mark, obsidian/ivory/champagne-gold palette.
- New first-visit intro (point of light → C draws → wordmark → tagline), skippable, replayable, safety timer, error boundary.
- Weighted, category-deduplicated scoring with 20/50 thresholds and critical overrides; confidence and sender
  verification reported separately; score breakdown in every message result.
- New rules: account threats, “new number” identity claims, discouraging verification (“don't call”), money requests,
  daily-earnings lures, limited-seat pressure, hidden redirect / secret URL parameters, “bank” in unrelated domains.
- Fixed: new rules weren't wired into any pipeline stage (never ran); link look-alikes weren't scored as impersonation;
  fee exclusions ignored the words just before the amount (tuition fees were flagged).
- Optional context questions in the scanner (13th pipeline check). Sender details masked in saved history.
- Test Lab: six core scenarios + 9 new cases (71 total), precision/recall. 99 unit tests.

### Added (CUSTODI final upgrade, 2026-11-06)
- Deterministic 12-stage message pipeline (`createMessagePipeline`) with per-check status, evidence, explanation,
  recommendation and measured duration; structured checks for website and page reports. Sender-domain look-alike check.
  Reputation is reported as unavailable, never faked. 5 new tests (81 total).
- Live analysis UI: checks appear as they actually complete, evidence highlights progressively, expandable rows,
  “Show result now”. Website results show their checks.
- New brand mark (S-shaped boundary + eye + signal core) across site, favicon, PWA/extension icons and a new 3D model.
- New intro storyboard: suspicious email → highlighted phrases → pulled into the core → mark assembles → tagline.
- Landing email scene now scroll-runs the real pipeline checks.
- Extension: welcome/onboarding page on install; checks list in popup reports.

### Changed (CUSTODI product overhaul, 2026-11-06)
- **Analyzer fixes:** `data:` / `javascript:` links were never flagged (parsing bailed out first) — now High.
  Login/sign-in words in a URL no longer raise risk on their own (alert fatigue); page-text warning signs only count
  on job/internship pages. New rules: “scan QR to receive”, “call this number to complete the process”, trusted domain
  used as a prefix of another site. Every report now has a transparent rule score and a verdict (Suspicious / Unverified / Low risk).
- **Test Lab:** 27 → 56 categorised fictional cases (12 legitimate). Run all, run one, reset, filters, plain-English reason
  per result, confusion matrix, detection accuracy and FP/FN rates computed only from cases actually run.
- **Live Observe (extension):** full session flow — can/can't explanation, 15/30/60 min, Start, timer + ON badge,
  per-page evidence/time/action, Stop, session summary. Website `/live` shows the live session and can stop it
  (externally_connectable, localhost only); fixed extension ID via a public manifest key.
- **New design system:** ivory/charcoal/cobalt/lime light theme and midnight dark theme, Light/Dark/System selector,
  editorial typography, reusable components, toasts, tooltips, charts, illustrations, empty states.
- **New pages:** Website Check, Extension guide, How It Works, Settings. Rebuilt Scan, Dashboard, Test Lab, Live Observe, landing.
- **Cinematic intro** (~9 s, skippable, replayable, reduced-motion safe) and a scroll-told landing page with live demos.
- **Mobile:** bottom tab bar, no horizontal overflow at 375 px, real PWA install button when the browser offers it.

### Added (CUSTODI platform, 2026-11-06)
- npm-workspaces monorepo: `packages/core`, `apps/web`, `apps/extension` (see CUSTODI.md).
- `@custodi/core`: shared rules engine for messages (incl. Hinglish and negation handling), web addresses and pages;
  evidence spans, incident-report formatter, 27 fictional Test Lab cases and 44 Vitest tests.
- `apps/web` (React + Vite + Tailwind v4): 3D scroll-driven landing (React Three Fiber + GSAP), message and link
  scanner, dashboard (history, breakdown, detailed reports, copy/download/export, clear, trusted domains), Test Lab
  with FP/FN metrics, CUSTODI Live guide, labelled fictional college demo, privacy page. Installable PWA with share target.
- `apps/extension` (Manifest V3): scan current page on click, message scanner, timed CUSTODI Live sessions with visible
  timer/badge and stop button, local history with export/clear.

### Fixed (Phase 1 QA audit, 2026-11-04)
- Analyzer: a validation error no longer stays on screen after picking an example message.
- Analyzer: fast repeated clicks on **Analyze Message** start only one analysis (previously up to one per click).
- Analyzer: the 5,000-character limit is checked after trimming whitespace, as API_CONTRACT.md specifies.
- Analyzer (api mode): network failures show the friendly "service unavailable" message instead of "Failed to fetch".
- Analyzer: focus moves to the error card when an analysis fails (it was lost to the page body).
- Demo rules: payment requests written as "2500 rupees" or "transfer the training charges", and threats
  ("offer will be cancelled", "legal action", "blacklisted", "final notice"), are no longer rated Low risk.
- Navbar: at tablet widths (768–1023 px) the menu button is used, so links and the CTA no longer wrap.
- Global focus outline moved into the CSS base layer so component focus styles (`focus:outline-none` + ring) apply;
  reduced-motion now correctly shows scroll-reveal content without the fade.
- "How it works": decorative line moved out of the `<ol>` (lists may only contain `<li>`).
- Channel selector: removed an unnamed `role="radiogroup"` (the fieldset + legend already label the group).
- Footer links have larger tap targets on mobile.
- Evidence highlighting prefers an exact-case match before falling back to case-insensitive.

### Changed
- Removed duplicate channel icon/label maps (shared from `ChannelSelector` / `CHANNELS`) and an unused `RiskBadge` size.
- README clone URL now points at the actual repository.

### Security
- `postcss` forced to `^8.5.32` via npm `overrides`, removing the high-severity advisory in the copy bundled with
  `next`. `npm audit --omit=dev` now reports 0 vulnerabilities.

## [0.1.0] — 2026-11-04 — Phase 1: Frontend
### Added
- Monorepo structure: `frontend/`, `backend/` (placeholder), `research/`, `docs/`, `.github/`.
- Root docs: CLAUDE.md, README, PRODUCT_SPEC, ARCHITECTURE, API_CONTRACT (draft v1), SECURITY_AND_PRIVACY,
  RISK_RULES, TEST_PLAN, TEAM_WORKFLOW.
- Pull request template and bug / feature issue templates; root `.gitignore`.
- Frontend (Next.js 15.5 App Router, React 19, TypeScript, Tailwind v4):
  - Landing page: navbar, hero, problem, message analyzer, example messages, how it works, features,
    privacy & security, footer.
  - Analyzer: channel selector, message box with live character count, optional sender, validation,
    soft OTP / card-number privacy warning, loading, error + retry, and empty states.
  - Result panel: risk badge (text + icon), highlighted evidence in the original message, warning cards,
    safe next steps, uncertainty note.
  - In-browser demo analyzer (`lib/mock/mockAnalyzer.ts`) with results labelled "Demonstration data".
  - `lib/analyzer.ts` switch for a future backend (`NEXT_PUBLIC_ANALYZER_MODE=api`).
  - Self-hosted fonts (Inter, Sora, JetBrains Mono) — no network needed at build time.
  - Accessibility: skip link, labelled controls, focus management, reduced-motion support.

### Security
- Upgraded to `next@15.5.29` to pick up security patches for the scaffolded 15.5.4.
