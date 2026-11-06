# Test Plan

Owner: Kushagri

## Phase 1 — frontend (manual + Playwright smoke, run 2026-11-04)
| Check | Result |
|---|---|
| Empty submit shows "Paste the message you want to check." | ✅ |
| < 20 chars shows "too short" error | ✅ |
| > 5,000 chars shows live length error; counter turns red | ✅ |
| Text with "OTP is 482913" shows privacy warning | ✅ |
| Example "Confirm your selection" → High, 3 findings, demo label | ✅ |
| Example "Hinglish fee demand" → High, 2 findings | ✅ |
| Example "Install the HR app" → High, 2 findings | ✅ |
| Example "Ordinary interview invite" → Low, 0 findings, "not proof" caveat | ✅ |
| Personal Gmail + "urgently" → Medium | ✅ |
| Prompt-injection text + OTP → High + "Tries to instruct the checker" | ✅ |
| `?demoError=1` → error card with "Try again" | ✅ |
| Clear empties form and result | ✅ |
| No horizontal scroll at 360 px and 820 px | ✅ |
| Mobile menu opens/closes; Esc closes | ✅ |
| No console errors or warnings | ✅ |
| `npm run check` (lint + typecheck + build) passes with 0 warnings | ✅ |

## Phase 1 QA audit (2026-11-04, Chrome via in-app browser, dev + production build)
| Check | Result |
|---|---|
| All 14 in-page links resolve to an existing section id | ✅ |
| Empty / whitespace-only / < 20 chars → correct error, focus moves to the textarea | ✅ |
| Error clears after choosing an example (was stuck) | ✅ after fix |
| 5,001 chars → red counter, error on submit; exactly 5,000 accepted; 207,000-char paste stays responsive (~33 ms) | ✅ |
| Trailing whitespace past 5,000 (trimmed ≤ 5,000) accepted | ✅ after fix |
| Fictional legit interview invite / stipend notice → Low, 0 findings | ✅ |
| OTP request, "pay Rs. 2,500", injection + OTP, APK download → High with quoted, highlighted evidence | ✅ |
| "fee of 2500 rupees", "transfer the training charges" → High | ✅ after fix (was Low) |
| Threat text ("offer will be cancelled", "legal action") → Medium | ✅ after fix (was Low) |
| Multiline message keeps line breaks in the highlighted view | ✅ |
| 5 rapid clicks + 2 form submits → exactly 1 analysis | ✅ after fix (was 5) |
| `?demoError=1` → error card, focus on it, "Try again" re-runs | ✅ |
| Clear resets form and result | ✅ |
| Privacy warning for OTP-like and card-like numbers; none for a phone number | ✅ |
| No horizontal scroll at 375, 768, 1440 px; tablet navbar no longer wraps | ✅ after fix |
| Mobile menu opens, closes on Esc, focus stays on the toggle | ✅ |
| No console errors on fresh load and through the flows above | ✅ |
| `npm ci` + `npm run check` + `npm run format:check`; `next start` serves `/` (200) and 404 page | ✅ |
| Automated unit / e2e tests | ❌ none exist yet (no `npm test` script) |
| Screen-reader pass (VoiceOver / NVDA) | Not run — needs a manual session |

## Later phases
| Group | Cases | Pass condition |
|---|---|---|
| Basic input | Empty, whitespace, emoji, 5,001 chars | Safe validation |
| High-risk | OTP, password, UPI PIN, fee, APK | HIGH with exact evidence |
| Ambiguous | Unknown recruiter, personal email | MEDIUM / needs verification |
| Legitimate-looking | Interview invite, follow-up | LOW + caveat |
| Hinglish | Same scams in Hinglish | Same band as English |
| Prompt injection | "Ignore instructions…" | Ignored and reported |
| Provider failure | Timeout, bad JSON, missing key | Labelled rules-only result |
| Privacy | Logs, DB, network, errors | No raw message or secret |
| Security | Oversized body, HTML/script, bad CORS | Rejected, no execution |

Fictional cases live in `research/sample_messages/`.
