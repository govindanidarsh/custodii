# Product Spec — TrustLayer AI

Owner: Antriksh · Status: v1 (hackathon MVP) · Source: TrustLayer AI Claude Code Playbook v2

## Problem
During placement season students receive fake offer letters, "HR" emails and WhatsApp messages that
ask for OTPs, registration fees or bank details, often with urgency and borrowed company names.
First-time job seekers rarely know what to check, and placement cells hear about scams after the fact.

## Solution
Paste a message → TrustLayer returns a risk band, the exact phrases that look risky, a plain-language
explanation, and one to three safe next steps. Differentiator: **Explain Before You Trust** — evidence
instead of a black-box verdict, and restraint on genuine-looking messages.

## Users
- Primary: a student unsure whether a placement / internship / recruiter message is genuine.
- Secondary: placement-cell staff who want reports and patterns.
- Buyer: university or placement cell (aggregate, anonymous insights only).

## Principles
1. Explain every warning with evidence quoted from the submitted text.
2. Never frighten users with unsupported certainty.
3. Never ask for passwords, OTPs, bank details or payment credentials.
4. A low-risk result is not proof that a message is genuine — say so every time.
5. Fictional data only in demos and tests; never collect real inbox data.

## Scope
| Priority | Feature | Definition of done |
|---|---|---|
| P0 | Message scanner | Paste text, pick channel, optional sender; reliably get a result. |
| P0 | Risk band + evidence | Low / Medium / High with exact quoted phrases. |
| P0 | Safe next steps | Clear actions pointing to official channels only. |
| P0 | Uncertainty handling | Ambiguous → "needs verification", never "confirmed fraud". |
| P0 | Fictional test suite | 15+ cases incl. Hinglish and legitimate-looking messages. |
| P0 | Rules-only fallback | If the AI layer fails, a labelled rules-only result is returned. |
| P1 | Screenshot OCR | Extract text from a screenshot into the same pipeline. |
| P1 | Offer verification checklist | Guided independent checks. |
| P2 | University dashboard | Aggregate trends only. |
| P2 | Browser extension | After the web app is stable. |

### Non-goals (MVP)
Phishing generation or offensive tooling · fetching/clicking URLs · inbox integrations · storing raw
messages · a broad consumer security platform.

## Core journey
1. Open the site → "Check a message".
2. Choose email / SMS / WhatsApp / other; paste text; optional sender. See the privacy reminder.
3. Submit → loading state → result: risk band, highlighted phrases, warning cards, safe next steps,
   uncertainty note.
4. On failure → friendly error with retry and a "don't share codes or money meanwhile" reminder.

## Acceptance criteria — Phase 1 (frontend, mock data)
- [x] Landing page: navbar, hero ("Don't trust blindly. Verify intelligently."), problem, analyzer,
      examples, how it works, features, privacy & security, footer.
- [x] Input validation: empty, < 20 chars, > 5,000 chars, sender length / characters.
- [x] Soft warning when the pasted text appears to contain a real OTP or card number.
- [x] Loading, error (with retry) and empty states.
- [x] Mock results clearly labelled "Demonstration data".
- [x] Responsive at 360 px, tablet and desktop; no horizontal scroll.
