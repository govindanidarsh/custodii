# Sample messages (fictional)

Format for each case (JSON, one file or one array):

```json
{ "id": "T01", "channel": "email", "sender": "hr.example@gmail.com",
  "text": "…", "expected_risk": "high", "expected_evidence": ["share the OTP"], "notes": "" }
```

The four examples used in the frontend live in `frontend/lib/examples.ts`.
