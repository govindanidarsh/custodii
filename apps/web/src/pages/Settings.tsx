import { normaliseTrustedDomains } from "@custodi/core";
import { Plus, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { ThemeSwitch } from "../components/Shell";
import { downloadText, stamp } from "../lib/download";
import { useExtension } from "../lib/extension";
import { isIOS, promptInstall, usePwa } from "../lib/pwa";
import { clearHistory, resetFlags, setFlag, updateSettings, useHistory, useSettings } from "../lib/store";
import { Button } from "../ui/Button";
import { Notice, useToast } from "../ui/Feedback";
import { Input } from "../ui/Field";
import { Container, PageHeader } from "../ui/Layout";

function Row({ title, desc, children, id }: { title: string; desc: React.ReactNode; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="grid grid-cols-1 scroll-mt-24 gap-4 border-t border-line py-7 first:border-t-0 md:grid-cols-[1fr_1.3fr] md:gap-10">
      <div>
        <h3 className="t-h3">{title}</h3>
        <div className="mt-1 text-sm leading-relaxed text-muted">{desc}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm"
    >
      <span className="text-ink">{label}</span>
      <span className={`relative h-6 w-11 flex-none rounded-full transition-colors ${checked ? "bg-accent" : "bg-line-strong"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform ${checked ? "translate-x-5.5" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

export default function Settings({ onReplayIntro }: { onReplayIntro: () => void }) {
  const settings = useSettings();
  const history = useHistory();
  const toast = useToast();
  const pwa = usePwa();
  const ext = useExtension();
  const location = useLocation();
  const [domain, setDomain] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth" }), 250);
  }, [location.hash]);

  return (
    <Container className="pt-10 md:pt-14">
      <PageHeader eyebrow="Settings" title="Settings" description="Everything here is stored only in this browser." />

      <div className="mt-4">
        <Row title="Appearance" desc="Light, dark, or follow your device. Saved for next time.">
          <ThemeSwitch />
        </Row>

        <Row title="Scan history" desc="Results are kept in this browser so your dashboard works. Nothing is uploaded.">
          <div className="space-y-2">
            <Toggle checked={settings.keepHistory} onChange={(v) => updateSettings({ keepHistory: v })} label="Keep scan history on this device" />
            <Toggle checked={settings.saveFullText} onChange={(v) => updateSettings({ saveFullText: v })} label="Also save the full message text" />
            <p className="text-xs text-muted">
              Off by default: only the result and short evidence quotes are kept. Switching it off deletes any full texts saved earlier.
            </p>
          </div>
        </Row>

        <Row
          id="trusted"
          title="Trusted domains"
          desc={
            <>
              Websites on these domains (and their subdomains) show as <b className="text-low">Verified</b>. Add only domains you've confirmed yourself — for example
              from your placement cell's official recruiter list. CUSTODI starts with an empty list and never guesses official domains.
            </>
          }
        >
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const [d] = normaliseTrustedDomains([domain]);
              if (!d) return setErr("Enter a domain like careers.example.com (no spaces).");
              setErr(null);
              updateSettings({ trustedDomains: Array.from(new Set([...settings.trustedDomains, d])) });
              setDomain("");
              toast(`${d} added to your trusted list`);
            }}
          >
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="college.example.edu" aria-label="Domain to trust" className="font-mono text-sm" />
            <Button type="submit" variant="secondary">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>
          {err && <p className="mt-2 text-sm text-high">{err}</p>}
          <ul className="mt-3 flex flex-wrap gap-2">
            {settings.trustedDomains.length === 0 && <li className="text-sm text-muted">No trusted domains yet.</li>}
            {settings.trustedDomains.map((d) => (
              <li key={d} className="inline-flex items-center gap-1 rounded-full bg-low-soft py-1 pr-1 pl-3 font-mono text-xs text-low">
                {d}
                <button aria-label={`Remove ${d}`} onClick={() => updateSettings({ trustedDomains: settings.trustedDomains.filter((x) => x !== d) })} className="rounded-full p-1 hover:bg-surface">
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
          {ext.state.kind === "connected" && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={async () => {
                const n = await ext.syncTrusted(settings.trustedDomains);
                toast(n === null ? "Couldn't reach the extension" : `Sent ${n} trusted domain${n === 1 ? "" : "s"} to the extension`, n === null ? "warning" : "success");
              }}
            >
              <RefreshCw className="h-4 w-4" /> Copy this list to the Chrome extension
            </Button>
          )}
        </Row>

        <Row title="Install on your phone" desc="Add CUSTODI to your home screen. It opens like an app and works offline.">
          {pwa === "installed" ? (
            <Notice tone="success">CUSTODI is installed on this device.</Notice>
          ) : pwa === "available" ? (
            <Button onClick={async () => toast((await promptInstall()) ? "Installed — find CUSTODI on your home screen" : "Install cancelled", "info")}>Install CUSTODI app</Button>
          ) : isIOS() ? (
            <p className="text-sm text-ink-2">
              On iPhone: open this site in <b>Safari</b>, tap the <b>Share</b> button, then <b>Add to Home Screen</b>.
            </p>
          ) : (
            <p className="text-sm text-ink-2">
              On Android: open this site in <b>Chrome</b>, tap the <b>⋮</b> menu, then <b>Install app</b> / <b>Add to Home screen</b>. (The install option only
              appears on a secure https address or localhost.)
            </p>
          )}
          <p className="mt-3 text-xs text-muted">
            Once installed on Android, you can share a message from WhatsApp or SMS into CUSTODI with the Share button. CUSTODI can't read your inbox by itself.
          </p>
        </Row>

        <Row title="Help & intro" desc="Show the getting-started checklist again or replay the opening sequence.">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                resetFlags();
                setFlag({ introSeen: true });
                toast("Getting-started checklist reset");
              }}
            >
              Reset onboarding
            </Button>
            <Button variant="secondary" onClick={onReplayIntro}>
              Replay intro
            </Button>
          </div>
        </Row>

        <Row title="Your data" desc="Download everything CUSTODI has stored about your scans, or delete it.">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!history.length}
              onClick={() => {
                downloadText(`custodi-data-${stamp()}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), settings, scans: history }, null, 2), "application/json");
                toast("Data exported");
              }}
            >
              Export all data
            </Button>
            <Button
              variant="danger"
              disabled={!history.length}
              onClick={() => {
                if (window.confirm(`Delete all ${history.length} scans from this browser? This can't be undone.`)) {
                  clearHistory();
                  toast("History cleared");
                }
              }}
            >
              Delete scan history
            </Button>
          </div>
        </Row>
      </div>
    </Container>
  );
}
