import { CheckCircle2, ChevronDown, Copy } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";
import { copyText } from "../lib/download";
import { EXTENSION_FOLDER, useExtension } from "../lib/extension";
import { setFlag } from "../lib/store";
import { Button, ButtonLink } from "../ui/Button";
import { Notice, useToast } from "../ui/Feedback";
import { Container, PageHeader } from "../ui/Layout";

function Cmd({ children }: { children: string }) {
  const toast = useToast();
  return (
    <div className="mt-2 flex items-center gap-2 rounded-xl bg-ink px-4 py-3 font-mono text-sm text-bg">
      <span className="flex-1 overflow-x-auto whitespace-nowrap">{children}</span>
      <button
        type="button"
        aria-label={`Copy: ${children}`}
        onClick={async () => toast((await copyText(children)) ? "Copied" : "Couldn't copy — select the text instead", "success")}
        className="-m-1.5 rounded-md p-2.5 opacity-70 hover:opacity-100"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}

function Step({ n, title, children, id }: { n: number; title: string; children: React.ReactNode; id?: string }) {
  return (
    <li id={id} className="grid scroll-mt-24 grid-cols-[2.5rem_1fr] gap-4 border-t border-line py-7 first:border-t-0">
      <span className="font-display text-4xl leading-none text-accent">{n}</span>
      <div className="min-w-0">
        <h3 className="t-h3">{title}</h3>
        <div className="mt-2 space-y-2 text-[0.95rem] leading-relaxed text-ink-2">{children}</div>
      </div>
    </li>
  );
}

const FAQ: [string, React.ReactNode][] = [
  [
    "“Load unpacked” is missing",
    "Turn on Developer mode with the switch in the top-right corner of chrome://extensions. The buttons appear on the left.",
  ],
  [
    "Chrome says “Manifest file is missing or unreadable”",
    <>
      You picked the wrong folder. Choose <code className="font-mono">{EXTENSION_FOLDER}</code> (the one that contains <code className="font-mono">manifest.json</code>). If the folder doesn't
      exist, run the build command first.
    </>,
  ],
  ["“This page can't be scanned”", "Chrome blocks every extension from reading its own pages (chrome://…, the new-tab page, the Chrome Web Store). Open a normal website."],
  [
    "I changed the code but the extension didn't update",
    "Run the build command again, then click the ↻ reload arrow on the CUSTODI card in chrome://extensions. Close and reopen the popup.",
  ],
  [
    "The Live Observe page says “Extension not detected”",
    "The extension only accepts messages from CUSTODI running on your computer (http://localhost). Open the website at localhost, make sure the extension is enabled, then reload the page.",
  ],
  ["I denied the permission by mistake", "Just press Start again — Chrome will ask again. Nothing starts without it."],
  ["Does it work on my phone?", "No. Mobile Chrome doesn't support extensions. Use the CUSTODI web app on your phone (it can be installed to your home screen)."],
];

export default function Extension() {
  const { state } = useExtension();
  useEffect(() => setFlag({ visitedExtension: true }), []);

  return (
    <Container className="pt-10 md:pt-14">
      <PageHeader
        eyebrow="Chrome extension"
        title="CUSTODI in your browser toolbar"
        description="Scan the page you're on with one click, check messages without leaving Chrome, and run Live Observe sessions you control."
        actions={<ButtonLink to="#install">Install it — 2 minutes</ButtonLink>}
      />

      <div className="mt-6">
        {state.kind === "connected" ? (
          <Notice tone="success" title="The CUSTODI extension is installed and connected">
            Version {state.version}. You're all set — see <Link className="underline" to="/live">Live Observe</Link>.
          </Notice>
        ) : state.kind === "unsupported" ? (
          <Notice tone="warning" title="This browser can't run the CUSTODI extension">
            Use desktop Google Chrome (or Edge / Brave). On phones, use the web app instead.
          </Notice>
        ) : state.kind === "not-connected" ? (
          <Notice tone="info">Not detected in this browser yet. Follow the steps below — this page will tell you once it's connected (after a reload).</Notice>
        ) : null}
      </div>

      <section className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <h2 className="t-h2">What it does</h2>
          <p className="mt-3 text-muted">Everything runs inside the extension on your computer, using the same analyzer as this website.</p>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["This page", "Click once to check the current tab: its address, visible text and whether it asks for OTPs, PINs or card details."],
            ["Message", "Paste a suspicious message right in the popup and get the same verdict, evidence and next steps."],
            ["Live Observe", "Start a 15, 30 or 60-minute session. CUSTODI checks each page you view and shows a risk badge. Stop any time."],
          ].map(([t, d]) => (
            <li key={t} className="border-t-2 border-ink pt-4">
              <p className="font-medium">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="install" className="mt-16 scroll-mt-24">
        <h2 className="t-h2">Install it</h2>
        <Notice tone="info">
          CUSTODI isn't on the Chrome Web Store yet, so a website button can't install it for you. You'll load it from this project folder — Chrome calls this
          “unpacked”. It's safe and you can remove it any time.
        </Notice>
        <ol className="mt-4">
          <Step n={1} title="Build the extension">
            <p>Open Terminal in the project folder and run:</p>
            <Cmd>npm run build:extension</Cmd>
            <p className="text-sm text-muted">
              This creates the folder <code className="font-mono text-ink">{EXTENSION_FOLDER}</code>.
            </p>
          </Step>
          <Step n={2} title="Open Chrome's extension page">
            <p>
              Type this into Chrome's address bar and press Enter, then switch on <b>Developer mode</b> (top-right):
            </p>
            <Cmd>chrome://extensions</Cmd>
          </Step>
          <Step n={3} title="Load CUSTODI">
            <p>
              Click <b>Load unpacked</b> and choose the folder:
            </p>
            <Cmd>{`TrustLayer-AI/${EXTENSION_FOLDER}`}</Cmd>
            <p className="text-sm text-muted">A CUSTODI card appears. Its ID should be hbhalijjblgneikgjipkleckcpemmlkj.</p>
          </Step>
          <Step n={4} title="Pin it to the toolbar" id="pin">
            <p>
              Click the puzzle-piece icon to the right of the address bar, find <b>CUSTODI</b> and click the pin. The CUSTODI icon now sits in your toolbar, where
              you'll see its <b>ON</b> and risk badges.
            </p>
          </Step>
        </ol>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div id="this-page" className="scroll-mt-24">
          <h2 className="t-h2">Scan the current page</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink-2">
            <li>Open the website you want to check.</li>
            <li>Click the CUSTODI icon → <b>This page</b> → <b>Scan this page</b>.</li>
            <li>Read the verdict, the warning signs and what to do next. The icon shows <b className="text-high">!</b> (high) or <b className="text-medium">?</b> (medium) for that tab.</li>
          </ol>
        </div>
        <div id="live" className="scroll-mt-24">
          <h2 className="t-h2">Live Observe sessions</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink-2">
            <li>Click the CUSTODI icon → <b>Live Observe</b>.</li>
            <li>Pick 15, 30 or 60 minutes and press <b>Start Live Observe</b>.</li>
            <li>Chrome asks to let CUSTODI read sites. Allow it — Live Observe can't check pages without it.</li>
            <li>The toolbar icon shows <b className="text-lime">ON</b> and the popup shows a countdown and every page checked.</li>
          </ol>
          <h3 className="t-h3 mt-6" id="stop">
            Stopping a session
          </h3>
          <p className="mt-2 text-ink-2">
            Press <b>Stop now</b> in the popup (or on the <Link to="/live" className="text-accent underline">Live Observe page</Link>). It also stops by itself when
            the timer ends. Either way you get a summary, and CUSTODI hands back the site permission.
          </p>
        </div>
      </section>

      <section id="permissions" className="mt-16 scroll-mt-24">
        <h2 className="t-h2">Permissions, in plain English</h2>
        <div className="panel mt-6 divide-y divide-line">
          {[
            ["activeTab", "Asked at install", "Lets CUSTODI look at the current tab only at the moment you click it. Nothing in the background."],
            ["scripting", "Asked at install", "Lets CUSTODI read the visible text and the kinds of form fields on that page when you scan. It never reads what you type."],
            ["storage", "Asked at install", "Saves your results and settings inside Chrome on your computer."],
            ["alarms", "Asked at install", "Ends a Live Observe session exactly when its timer runs out."],
            [
              "Read and change data on all websites",
              "Only when you start Live Observe",
              "Needed so CUSTODI can check each page you switch to during a session. CUSTODI removes this permission again when the session stops.",
            ],
          ].map(([p, when, why]) => (
            <div key={p} className="grid grid-cols-1 gap-1 p-5 sm:grid-cols-[14rem_10rem_1fr] sm:gap-4">
              <p className="font-mono text-sm text-ink">{p}</p>
              <p className="text-xs text-muted sm:text-sm">{when}</p>
              <p className="text-sm text-ink-2">{why}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <CheckCircle2 className="h-4 w-4 text-low" /> No account, no server, no tracking. The extension never sends page content anywhere.
        </p>
      </section>

      <section id="troubleshooting" className="mt-16 scroll-mt-24">
        <h2 className="t-h2">Troubleshooting</h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-2 text-sm leading-relaxed text-ink-2">{a}</div>
            </details>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <ButtonLink to="/live">Go to Live Observe</ButtonLink>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            I've installed it — check again
          </Button>
        </div>
      </section>
    </Container>
  );
}
