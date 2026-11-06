# Security & Privacy

Owners: Darsh + Kushagri

## Required controls
| Area | Control | Phase 1 status |
|---|---|---|
| Secrets | API / service keys on backend only; host-dashboard secrets; never `NEXT_PUBLIC_` | ✅ frontend holds no secrets |
| Data minimisation | Raw message text not persisted; discarded after analysis | ✅ mock keeps text in memory only |
| Logging | Request ID, time, latency, status, risk band, mode — never message body or OTP | Backend |
| Input limits | ≤ 5,000 chars, known channels, request timeout | ✅ client-side; backend must enforce too |
| Prompt injection | Message wrapped as untrusted data; evidence must be a substring | Backend; UI shows injection finding |
| Model output | Validate enums/lengths; escape all rendered text | ✅ React escapes; no `dangerouslySetInnerHTML` for user text |
| URLs | Never fetched, opened or rendered as links | ✅ shown as plain text only |
| Rate limiting | Per IP / session | Backend |
| CORS | Localhost + deployed frontend only | Backend |
| Admin metrics | Protected; aggregates only | Backend |
| Privacy notice | Explain provider processing and retention; advise removing personal details | ✅ on page + form reminder |
| Verification advice | Point to known official channels, never contacts from the message | ✅ |

## Frontend specifics
- Soft warning when text looks like it contains a real OTP/PIN or card number (never blocks).
- Only `NEXT_PUBLIC_ANALYZER_MODE` and `NEXT_PUBLIC_API_BASE_URL` are read in the browser.
- Mock results are labelled "Demonstration data" in the analyzer header and in every result.

## Limitation statement (shown to users)
"TrustLayer provides automated warning signals for educational and safety assistance. It cannot guarantee
that a message is genuine or fraudulent. Verify important opportunities independently through official
channels. Never share passwords, OTPs or payment credentials."

## Known issues
- Fixed 2026-11-04: the high-severity PostCSS advisory bundled inside `next` is resolved with an npm `overrides`
  entry (`postcss ^8.5.32`). `npm audit --omit=dev` reports 0 vulnerabilities.
- Remaining: 14 moderate advisories in **dev-only** ESLint tooling (`minimatch` ReDoS). Not shipped to users;
  the suggested fix is a breaking ESLint-config downgrade, so it is deferred.
