# API Contract — v1 (draft)

Owner: Darsh · Frontend sign-off: Antriksh · Status: **draft, frontend implements it via mock**.
Change this file first (with both owners' approval), then `frontend/types/analysis.ts` and backend schemas.

## POST /api/v1/analyze
### Request
```json
{
  "message_text": "Congratulations ...",
  "channel": "email",
  "sender": "careers@example.test",
  "locale": "en"
}
```
| Field | Type | Rules |
|---|---|---|
| message_text | string | required, 1–5,000 chars after trim (frontend requires ≥ 20) |
| channel | enum | `email` \| `sms` \| `whatsapp` \| `other` |
| sender | string | optional, ≤ 254 chars |
| locale | string | `en` for MVP |

### 200 response
```json
{
  "analysis_id": "uuid",
  "risk_level": "high",
  "summary": "This message has strong warning signs.",
  "findings": [
    {
      "type": "otp_request",
      "severity": "strong",
      "source": "rules",
      "evidence": "share your OTP",
      "explanation": "Recruiters never need your OTP."
    }
  ],
  "recommended_actions": ["Do not share the OTP.", "Verify through your college placement cell."],
  "uncertainty_note": "Automated assessment, not proof of fraud.",
  "analysis_mode": "full",
  "model_version": "trustlayer-v1"
}
```
- `risk_level`: `low` | `medium` | `high`
- `findings[].type`: `otp_request` | `credential_request` | `upfront_payment` | `bank_or_upi_request` |
  `unsafe_download` | `urgency` | `unverified_sender` | `suspicious_link` | `prompt_injection` | `other`
- `findings[].severity`: `strong` | `supporting`
- `findings[].source`: `rules` | `model` | `demo` (demo = frontend mock only)
- `findings[].evidence`: exact substring of `message_text` (may be empty for sender-only findings)
- `recommended_actions`: 1–3 items
- `analysis_mode`: `full` | `rules_only` | `demo`

### Errors
| Status | When | Frontend message |
|---|---|---|
| 422 | Invalid input | "The message couldn't be accepted. Check its length and try again." |
| 429 | Rate limited | "Too many checks in a short time…" |
| 5xx | Server error | "The analysis service is unavailable right now…" |
If the AI provider fails, the API still returns **200** with `analysis_mode: "rules_only"`.

## Other routes (planned)
| Route | Purpose |
|---|---|
| GET /health | Deployment health check |
| POST /api/v1/feedback | Helpful / not helpful, false positive / negative (no message text) |
| GET /api/v1/metrics/summary | Admin-only aggregate counts |
