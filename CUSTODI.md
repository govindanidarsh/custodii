# CUSTODI — Your Personal Digital Bodyguard

(Formerly SHIELD; renamed November 2026.)

> Think before you trust. Verify before you act.

Hackathon problem: **PS 5 – The Fake HR Email.** A student pastes a suspicious message and instantly gets
(1) Low / Medium / High risk, (2) the reasons with the exact words quoted, (3) a clear next step and
(4) a reminder to verify real offers through the official placement cell.

## What's in this folder

```
packages/core     Shared detection engine: staged check pipeline (messages), structured checks (links, pages), 56 Test Lab cases, 99 unit tests
apps/web          Website + installable PWA (React, Vite, Tailwind v4, Framer Motion, GSAP, React Three Fiber)
apps/extension    Chrome extension (Manifest V3): This page, Message, Live Observe, History
scripts/          Icon generator (no dependencies)
frontend/         Older TrustLayer Next.js prototype (left untouched)
```

The website, the PWA and the extension all import the **same** analyzer from `packages/core`.

## Run it — copy these one at a time

You need Node.js 20 or newer (`node -v` to check).

```bash
cd ~/Desktop/TrustLayer-AI
```

```bash
npm install
```

```bash
npm run dev
```

Open **http://localhost:5173**. Stop the server with `Ctrl + C`.

| Command | What it does |
|---|---|
| `npm test` | Runs the analyzer's 99 automated tests |
| `npm run check` | Typecheck + tests + build everything. Run this before a demo — it must end with no `error` lines |
| `npm run build:extension` | Builds the Chrome extension into `apps/extension/dist` |
| `npm run build:web` then `npm run preview` | Production website/PWA at http://localhost:4173 (offline-capable) |
| `npm run icons` | Regenerates the PNG icons |

## Brand

The official emblem is the team-supplied artwork `apps/web/public/assets/custodi-logo-reference.png` (482×334, used unchanged).
`npm run icons` (scripts/build-logo-assets.mjs, no dependencies) derives everything from it:

| File | Use |
|---|---|
| `apps/web/public/assets/custodi-emblem.png` (262×334, transparent) | Header/footer logo, hero, website intro, empty states |
| `apps/web/public/assets/custodi-emblem@2x.png` (524×668), `@3x.png` (786×1002) | Lanczos upscales (Core Image) picked by `srcset` for the hero and intro |
| `apps/web/public/assets/custodi-intro-1080p.mp4` (1920×1080, 9.0 s, H.264, no audio, 0.7 MB) | Website intro on landscape screens |
| `apps/web/public/assets/custodi-intro-portrait.mp4` (1080×1920, 9.0 s, H.264, no audio, 0.6 MB) | Website intro on portrait/phone screens |
| `custodi-intro-poster.jpg`, `custodi-intro-poster-portrait.jpg` | Video posters |
| `apps/web/public/favicon-16.png`, `favicon-32.png` | Browser favicon |
| `apps/web/public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png` | PWA / home screen |
| `apps/extension/public/icons/icon-16/32/48/128.png` | Chrome toolbar + extensions page |
| `apps/extension/public/assets/custodi-emblem.png` | Popup header, popup intro, welcome page |

Regenerate the video and upscales with Swift + ffmpeg (macOS): `swift scripts/render-intro.swift upscale`, then
`swiftc -O scripts/render-intro.swift -o /tmp/ri && ln -sf /tmp/ri scripts/.render-intro-bin && scripts/.render-intro-bin frames 1920 1080 | ffmpeg -f rawvideo -pix_fmt bgra -s 1920x1080 -r 30 -i - -c:v libx264 -crf 21 -pix_fmt yuv420p -movflags +faststart apps/web/public/assets/custodi-intro-1080p.mp4`
(and `frames 1080 1920` for the portrait cut). The website plays the MP4 muted and inline; if it fails to load, autoplay is
refused or it doesn't start within 4 s, the code animation plays instead. Reduced motion shows a still card.

The emblem is cut from its navy background by region-growing from the image edges; no emblem pixel is redrawn.
Icons place the same emblem on a solid navy tile. The supplied artwork is cropped flat at the top of the crest — supply a
larger, uncropped original and re-run `npm run icons` to improve every asset at once.

## Load the Chrome extension

1. `npm run build:extension`
2. Open `chrome://extensions`, switch on **Developer mode** (top right).
3. **Load unpacked** → choose **`TrustLayer-AI/apps/extension/dist`** (the folder containing `manifest.json`).
4. Puzzle-piece icon → pin **CUSTODI**. Its ID is always `hbhalijjblgneikgjipkleckcpemmlkj`.

On first install the extension opens its own welcome page (pin it, scan a page, Live Observe, privacy).
After changing extension code: build again, then click ↻ on the CUSTODI card in `chrome://extensions`.
The full illustrated guide is in the app at **/extension**.

## How to test every major feature

| Feature | Where | What to do | What you should see |
|---|---|---|---|
| Intro | `/` (first visit) | Open the site in a fresh browser profile, or Settings → **Replay intro** | ~9 s 3D sequence; **Skip intro** / Esc works; no auto-play with reduced motion |
| Themes | header or `/settings` | Pick Light / Dark / System, refresh | Choice is kept after refresh |
| Message scan | `/scan` | Tap the **OTP request** sample → **Analyse message** | 12 real checks appear one by one (each only after it ran, with its measured time); phrases highlight as each check finds them; then **Suspicious · 75/100** with evidence and next steps. “Show result now” skips the pacing |
| Honest check states | `/scan` | Analyse **Hinglish fee** (no sender, no links) | Sender = **Unavailable**, Links/Look-alike = **Skipped**, Reputation = **Unavailable** |
| Low risk wording | `/scan` | Tap **Normal invite** → Analyse | **Low risk** with “does not prove it is genuine” — never “safe” |
| Website check | `/website` | Tap **The @ trick** | Address anatomy, HTTPS shown separately, status **Suspicious** |
| Verified | `/settings` → Trusted domains | Add `northwind.example`, then check `https://careers.northwind.example/jobs` | **Verified · your trusted list** |
| Dashboard | `/dashboard` | After a few scans | Real counts, 14-day trend, categories, history search/filter, report drawer, JSON/CSV export, Clear history (with confirmation) |
| Test Lab | `/lab` | **Run all tests**, then **Run** on any row, filters, **Reset** | 55/56 pass, 0 false positives, 1 false negative (L01, explained); confusion matrix; reason on every row |
| Extension – This page | any website | CUSTODI icon → **This page** → **Scan this page** | Verdict + evidence; icon badge `!` (high) or `?` (medium) |
| Live Observe | extension popup | **Live Observe** → 15/30/60 → **Start** → allow permission | Timer + **ON** badge, each page you open listed with evidence & action; **Stop now** → session summary |
| Live Observe on the website | `/live` while a session runs (open at localhost) | Watch the page | Same timer, events and a working **Stop now** |
| Share into PWA | installed Android PWA | Share a WhatsApp/SMS text to CUSTODI | Scanner opens pre-filled; the text is removed from the address bar |


## Scoring (packages/core/src/scoring.ts — weights are configurable in `DEFAULT_SCORING`)

| Indicator category (counted once each) | Points |
|---|---:|
| Direct OTP / PIN / password / card-secret request | +35 |
| Payment, deposit or fee demand | +30 |
| Suspicious app install or remote access | +30 |
| Sender impersonation / domain mismatch (personal email claiming an organisation, “new number” identity claim, look-alike or brand-in-unrelated domain) | +20 |
| Account closure or serious threat | +15 |
| Secrecy or discouraging verification (“don't tell your college”, “don't call”) | +15 |
| Suspicious or disguised URL (structural tricks) | +15 |
| Artificial urgency / countdown / limited seats | +10 |
| Unrealistic reward or earnings | +10 |
| Unexpected contact (from your optional answers) | +5 |
| Additional: ID documents over chat · reported OTP/personal-info request · hidden AI instructions · moves you off the record | +20 each |
| Context modifier: a fee demanded in a job/internship context | +20 |

Score capped at 100. **0–19 Low · 20–49 Medium · 50–100 High.** Critical overrides (direct OTP/PIN/password request,
remote-access tool, sideloaded `.apk/.exe`) force High and show a red “Critical” banner. Weights are hand-set and
calibrated only on the fictional Test Lab cases — not statistically validated probabilities.

Every message result shows, separately: risk score + level, **confidence** (how much evidence was available — message
length, sender, your answers), **sender verification** (Verified only for a domain on your trusted list; Unverified for
any other sender incl. phone numbers; Unknown when none given), the evidence with each category's points, checks run vs
unavailable, and the next action. Optional questions (expected? recognise the sender? what does it ask you to do?)
add points but never cancel a warning; an unknown sender alone can never make a message High.

## How detection works (all on-device, no paid API)

Messages go through 12 ordered checks (packages/core/src/pipeline.ts): parsing → OTP/password/PIN → payment →
urgency → secrecy & manipulation → apps/remote access/documents → sender → link extraction & structure →
look-alike & impersonation (links **and** the sender's domain) → threat intelligence (**always “unavailable”** — CUSTODI
has no reputation data and says so) → risk calculation → assessment. Each returns status (passed / warning /
unavailable / skipped), evidence, explanation, recommendation and its measured run time. Website and page scans return
the same structure (address parsing, hidden-destination tricks, host type, look-alikes, domain patterns, HTTPS, your
trusted list, reputation, risk).


- **Strong signs** (any one ⇒ High): OTP / password / UPI PIN / card requests, “scan QR to receive”, any fee or
  “refundable deposit”, `.apk` or app installs, AnyDesk/QuickSupport, dangerous links (IP host, look-alike spelling,
  punycode, `@` trick, `data:`/`javascript:`).
- **Warning signs** (1–2 ⇒ Medium, 3 different ⇒ High): urgency/threats, secrecy, personal Gmail, shortened/odd links,
  Telegram, “too good to be true”, ID documents over chat, “call this number to complete”, hidden AI instructions.
- **Rule score** = 45 per strong sign + 15 per different warning sign (max 100). ≥45 is High. Not a probability.
- Negations are understood (“never share your OTP”, “there is no fee”, “OTP kisi ko mat batao”) to avoid false alarms;
  threats like “if you don't share the OTP…” still count.
- On web pages without job/internship context only strong signs count, so normal browsing in Live Observe stays calm.
- Websites are **Verified** only if on the user's own trusted list. CUSTODI never invents official domains; HTTPS is never proof.

## Honest limitations

- Text only: can't see calls, images, PDFs, voice notes or attachments.
- Polite requests for bank account number + IFSC aren't flagged (genuine payroll needs them) — Test Lab case L01.
- English + common Hinglish only.
- Live Observe works in desktop Chrome/Edge/Brave only, checks only the active Chrome tab, and can't read WhatsApp/SMS/email apps.
- The website can show Live Observe status and stop it, but **cannot start it** (Chrome only grants the permission from a click inside the extension). It only connects when the site runs on `localhost`.
- The extension and website keep separate histories; trusted domains can be copied to the extension from Settings.
- Test Lab numbers come from our own fictional cases — not a real-world accuracy figure.
- `npm audit` lists advisories in dev-only build/test tools (vitest, workbox build). They are not shipped to users.
