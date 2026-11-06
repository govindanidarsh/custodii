import { useEffect } from "react";
import { Link } from "react-router";
import { setFlag } from "../lib/store";
import { RiskBadge, StatusBadge } from "../ui/Badge";
import { ButtonLink } from "../ui/Button";
import { Container, PageHeader } from "../ui/Layout";

const TOC = [
  ["what", "What CUSTODI does"],
  ["scan", "Scan a message"],
  ["website", "Check a website"],
  ["extension", "Install the extension"],
  ["this-page", "Use “This page”"],
  ["live", "How Live Observe works"],
  ["risk", "Understand risk levels"],
  ["suspicious", "If a message is suspicious"],
  ["limits", "What CUSTODI can't detect"],
  ["privacy", "Privacy"],
] as const;

function Sec({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-10 first:border-t-0 first:pt-0">
      <p className="font-mono text-xs text-accent">{String(n).padStart(2, "0")}</p>
      <h2 className="t-h2 mt-2">{title}</h2>
      <div className="mt-4 max-w-2xl space-y-4 text-[1rem] leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

export default function Help() {
  useEffect(() => setFlag({ visitedHelp: true }), []);
  return (
    <Container wide className="pt-10 md:pt-14">
      <PageHeader
        eyebrow="How it works"
        title="Everything you need to use CUSTODI"
        description="Short answers for first-time users. No security background needed."
        actions={<ButtonLink to="/scan">Start scanning</ButtonLink>}
      />
      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ol className="sticky top-24 space-y-1 text-sm">
            {TOC.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} className="flex gap-3 rounded-lg px-2 py-1.5 text-muted hover:bg-surface-2 hover:text-ink">
                  <span className="font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div>
          <Sec id="what" n={1} title="What CUSTODI does">
            <p>
              CUSTODI checks placement, internship and recruiter messages — and the links in them — for the warning signs that scams leave behind: requests for
              OTPs or PINs, fees, app installs, pressure, secrecy, look-alike web addresses.
            </p>
            <p>
              It shows you the <b>exact words</b> that raised concern, explains each one in plain language and tells you the safe next step. Everything runs on
              your device.
            </p>
          </Sec>

          <Sec id="scan" n={2} title="Scan a message">
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>
                Open <Link to="/scan" className="text-accent underline">Scan</Link> and pick the message type: Email, SMS, WhatsApp or Other.
              </li>
              <li>Paste the whole message (press Paste, or long-press in the box). Adding the sender's address helps.</li>
              <li>Press <b>Analyse message</b>. Not sure what to paste? Tap a fictional sample.</li>
            </ol>
            <p className="text-sm text-muted">Tip: if the message contains a real OTP or card number, replace it with XXXX first. CUSTODI doesn't need it.</p>
          </Sec>

          <Sec id="website" n={3} title="Check a website">
            <p>
              Copy the link from the message (long-press → Copy link) and paste it into{" "}
              <Link to="/website" className="text-accent underline">Website Check</Link>. CUSTODI never opens it. It splits the address into parts and shows the
              <b> real owner</b> — the part just before the first single “/”.
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="verified" />
              <StatusBadge status="suspicious" />
              <StatusBadge status="unknown" />
            </div>
            <p>
              <b>Verified</b> only appears for domains on your own trusted list (Settings). <b>HTTPS</b> is shown separately: it means the connection is
              encrypted, not that the site is genuine.
            </p>
          </Sec>

          <Sec id="extension" n={4} title="Install the extension">
            <p>
              The Chrome extension adds one-click page scans and Live Observe. Because it isn't on the Chrome Web Store yet, you load it from the project folder in
              four steps — the <Link to="/extension#install" className="text-accent underline">extension guide</Link> walks you through it, including how to pin
              it.
            </p>
          </Sec>

          <Sec id="this-page" n={5} title="Use “This page”">
            <p>
              On any website, click the CUSTODI icon → <b>This page</b> → <b>Scan this page</b>. CUSTODI checks the address, the visible text and whether the page
              asks for OTPs, PINs, passwords or card numbers. It never reads what you've typed.
            </p>
          </Sec>

          <Sec id="live" n={6} title="How Live Observe works">
            <p>
              You start a 15, 30 or 60-minute session from the extension. While it runs, CUSTODI checks each page you switch to in Chrome and shows a risk badge on
              its icon. You can stop at any moment, and you get a summary at the end.
            </p>
            <p>
              It cannot see WhatsApp, SMS, email apps or anything outside Chrome, and it does nothing when no session is running.{" "}
              <Link to="/live" className="text-accent underline">More on Live Observe</Link>.
            </p>
          </Sec>

          <Sec id="risk" n={7} title="Understand risk levels">
            <div className="panel divide-y divide-line">
              {(
                [
                  ["high", "Suspicious", "Score 50–100, or a critical sign: a direct OTP/PIN/password request or a remote-access / sideloaded app install.", "Don't reply, pay, install or share anything. Report it."],
                  ["medium", "Caution", "Score 20–49 — e.g. a fee demand, a disguised link with a personal Gmail, secrecy plus a deadline.", "Don't act until you've verified it independently."],
                  ["low", "Low risk", "Score 0–19. No obvious warning indicators detected.", "This does not guarantee the message is safe. Never share OTPs or pay fees on request."],
                ] as const
              ).map(([lvl, label, why, todo]) => (
                <div key={lvl} className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-[9rem_1fr]">
                  <div>
                    <RiskBadge level={lvl} />
                    <p className="mt-2 font-display text-2xl">{label}</p>
                  </div>
                  <div className="text-sm">
                    <p>{why}</p>
                    <p className="mt-2 font-medium text-ink">→ {todo}</p>
                  </div>
                </div>
              ))}
            </div>
            <p>
              The <b>risk score</b> (0–100) adds fixed points for each <i>kind</i> of warning found, counted once each: OTP/PIN/password request +35, payment or fee +30,
              app/remote access +30, impersonation or sender mismatch +20, threats +15, secrecy +15, disguised link +15, urgency +10, unrealistic reward +10,
              unexpected contact +5 (plus +20 when a fee is demanded for a job). Hand-set weights, tested on fictional cases — not a probability. <b>Confidence</b> (how much
              evidence was available) and <b>sender verification</b> are shown separately.
            </p>
          </Sec>

          <Sec id="suspicious" n={8} title="What to do when a message is suspicious">
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Stop. Don't reply, click, pay, install or share any code.</li>
              <li>Contact your placement cell using a number or email you already know — not one from the message.</li>
              <li>Use <b>Copy report</b> on the result and send it to them, so other students can be warned.</li>
              <li>If you already shared an OTP, PIN or paid money: call your bank's official helpline immediately, change your passwords, and report it at the national cybercrime helpline 1930 or cybercrime.gov.in.</li>
            </ol>
          </Sec>

          <Sec id="limits" n={9} title="What CUSTODI can't detect">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Scams that happen on a phone or video call — CUSTODI only sees text.</li>
              <li>Images, PDFs, voice notes and attachments.</li>
              <li>A real company's hacked email account sending a convincing message.</li>
              <li>
                Whether a bank-details request is genuine. CUSTODI flags requests to send account number/IFSC by message, but not requests that point to an official
                onboarding portal — a scammer can fake that wording too (see cases L01 and M42 in the <Link to="/lab" className="text-accent underline">Test Lab</Link>).
              </li>
              <li>Languages other than English and common Hinglish phrasing.</li>
              <li>Who really owns a website, unless you add it to your trusted list.</li>
            </ul>
          </Sec>

          <Sec id="privacy" n={10} title="Privacy">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>No account, no server, no AI service: every check runs on your device.</li>
              <li>By default only results and short evidence quotes are saved — not full messages. You can export or delete everything in Settings.</li>
              <li>Links are never opened or made clickable.</li>
              <li>The extension only looks at a page when you click, or during a Live Observe session you started and can see.</li>
              <li>
                The <Link to="/college-demo" className="text-accent underline">college demo</Link> uses clearly labelled fictional numbers and never mixes them with
                your scans.
              </li>
            </ul>
          </Sec>
        </div>
      </div>
    </Container>
  );
}
