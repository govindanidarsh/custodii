import { analyzeUrl, type UrlReport } from "@custodi/core";
import { Globe, Lock, LockOpen, ShieldQuestion } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Link } from "react-router";
import { getSettings, saveScan, useSettings } from "../lib/store";
import { ArtLink } from "../ui/Art";
import { Button } from "../ui/Button";
import { InfoTip } from "../ui/Feedback";
import { Input, Label } from "../ui/Field";
import ReportView from "./ReportView";

const SAMPLES = [
  { label: "Shortened link", url: "https://bit.ly/3offerDemo" },
  { label: "Raw IP address", url: "http://203.0.113.24/offer-letter/verify" },
  { label: "Look-alike name", url: "https://g00gle-careers.top/apply" },
  { label: "The @ trick", url: "https://careers.northwind.example@203.0.113.9/login" },
  { label: "Ordinary page", url: "https://www.demo-college.example/placements" },
];

/** Splits the address into the parts a student should look at. */
export function Anatomy({ r }: { r: UrlReport }) {
  if (!r.hostname || !r.registrableDomain || !r.normalizedUrl) return null;
  const u = new URL(r.normalizedUrl);
  const sub = r.hostname.endsWith(r.registrableDomain) ? r.hostname.slice(0, r.hostname.length - r.registrableDomain.length) : "";
  const rest = `${u.port ? `:${u.port}` : ""}${u.pathname === "/" ? "" : u.pathname}${u.search}`;
  const parts = [
    { t: `${u.protocol}//`, label: "Connection", cls: "text-muted" },
    ...(u.username ? [{ t: `${u.username}@`, label: "Ignored by browser!", cls: "bg-high-soft text-high" }] : []),
    ...(sub ? [{ t: sub, label: "Subdomain", cls: "text-ink-2" }] : []),
    { t: r.registrableDomain, label: "Real owner", cls: "bg-accent-soft text-accent font-semibold" },
    ...(rest ? [{ t: rest, label: "Page path", cls: "text-muted" }] : []),
  ];
  return (
    <div className="panel p-5">
      <p className="t-eyebrow flex items-center gap-1 text-muted">
        Address anatomy
        <InfoTip label="How to read an address">
          The part right before the first single slash — the "real owner" — decides who runs the site. Everything before it can be made up by anyone who owns
          that domain.
        </InfoTip>
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-y-3 font-mono text-sm break-all">
        {parts.map((p, i) => (
          <span key={i} className="flex flex-col">
            <span className={`rounded px-0.5 ${p.cls}`}>{p.t}</span>
            <span className="mt-1 border-t border-line pt-1 font-sans text-[11px] tracking-wide text-muted uppercase">{p.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function ConnectionAndTrust({ r }: { r: UrlReport }) {
  const https = r.protocol === "https:";
  const http = r.protocol === "http:";
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="panel p-5">
        <p className="t-eyebrow text-muted">Connection</p>
        <p className={`mt-3 flex items-center gap-2 font-medium ${https ? "text-ink" : http ? "text-high" : "text-muted"}`}>
          {https ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
          {https ? "Encrypted (HTTPS)" : http ? "Not encrypted (HTTP)" : "Not a web connection"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {https
            ? "Only means nobody can read data in transit. Scam sites get HTTPS for free — this says nothing about who runs the site."
            : http
              ? "Anything typed here can be read in transit. Never enter passwords, OTPs or personal details."
              : "This isn't an ordinary website address."}
        </p>
      </div>
      <div className="panel p-5">
        <p className="t-eyebrow text-muted">Who runs it?</p>
        <p className={`mt-3 flex items-center gap-2 font-medium ${r.status === "verified" ? "text-low" : r.status === "suspicious" ? "text-high" : "text-ink"}`}>
          <ShieldQuestion className="h-4 w-4" />
          {r.status === "verified" ? "On your trusted list" : r.status === "suspicious" ? "Warning signs found" : "Unknown — can't verify"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {r.status === "verified"
            ? `${r.registrableDomain} is on the trusted list you set up. That's your list, not an outside check.`
            : r.status === "suspicious"
              ? "The address itself shows tricks commonly used by fake sites. Details below."
              : "No tricks in the address, but CUSTODI has no way to confirm the owner. Reach the company by typing its address yourself."}
        </p>
      </div>
    </div>
  );
}

export default function WebsiteChecker({ initialUrl = "", origin = "web" }: { initialUrl?: string; origin?: "web" | "pwa-share" }) {
  const [value, setValue] = useState(initialUrl);
  const [report, setReport] = useState<UrlReport | null>(null);
  const settings = useSettings();
  const id = useId();

  useEffect(() => {
    if (initialUrl) {
      setValue(initialUrl);
      run(initialUrl, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  function run(v = value, sample = false) {
    if (!v.trim()) return;
    const r = analyzeUrl(v, { trustedDomains: getSettings().trustedDomains });
    setReport(r);
    if (r.hostname || r.status === "suspicious") saveScan(r, { origin: sample ? "sample" : origin });
  }

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="lg:sticky lg:top-24">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          <Label htmlFor={id}>Web address</Label>
          <Input
            id={id}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, 2048))}
            placeholder="https://example-careers.site/apply"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="font-mono text-sm"
          />
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
            <Lock className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden /> CUSTODI only reads the address text. It never opens, visits or previews the link.
          </p>
          <Button type="submit" size="lg" className="mt-5 w-full sm:w-auto">
            <Globe className="h-5 w-5" /> Check website
          </Button>
        </form>

        <div className="mt-7 border-t border-line pt-5">
          <p className="t-eyebrow text-muted">Fictional examples</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SAMPLES.map((s) => (
              <button
                key={s.url}
                type="button"
                onClick={() => {
                  setValue(s.url);
                  run(s.url, true);
                }}
                className="rounded-full border border-line bg-surface min-h-10 px-3 py-1.5 text-xs sm:min-h-0 text-ink-2 hover:border-accent hover:text-accent"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-ink-2">
          <p className="font-medium text-ink">Verified, Suspicious, Unknown</p>
          <p className="mt-1">
            CUSTODI marks a site <b className="text-low">Verified</b> only if its domain is on <em>your</em> trusted list (
            {settings.trustedDomains.length ? `${settings.trustedDomains.length} domain${settings.trustedDomains.length > 1 ? "s" : ""}` : "currently empty"} —{" "}
            <Link to="/settings#trusted" className="text-accent underline underline-offset-2">
              manage
            </Link>
            ). It never guesses official domains. <b className="text-high">Suspicious</b> = tricks found in the address. <b>Unknown</b> = no tricks found, and no
            proof either.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {report ? (
          <>
            <Anatomy r={report} />
            {report.hostname && <ConnectionAndTrust r={report} />}
            <ReportView key={report.id} report={report} checksOpen />
          </>
        ) : (
          <div className="panel flex min-h-[28rem] flex-col items-center justify-center border-dashed p-8 text-center">
            <div className="w-48">
              <ArtLink />
            </div>
            <p className="t-h3 mt-6">Check a link before you tap it</p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              CUSTODI splits the address into parts, shows who really owns it, and keeps "is it encrypted?" separate from "is it genuine?".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
