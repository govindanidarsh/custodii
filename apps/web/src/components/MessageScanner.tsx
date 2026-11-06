import { type Answer, type AskedTo, type MessageContext, detectSensitiveData, MAX_MESSAGE_LENGTH, SAMPLE_MESSAGES, type Channel, type MessageReport } from "@custodi/core";
import { ChevronDown, ClipboardPaste, Lock, ScanLine, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { getSettings, saveScan } from "../lib/store";
import { ArtMessage } from "../ui/Art";
import { Button } from "../ui/Button";
import { Notice, useToast } from "../ui/Feedback";
import { Input, Label, Segmented, TextArea } from "../ui/Field";
import AnalysisRun from "./AnalysisRun";

const ASKS: { value: AskedTo; label: string }[] = [
  { value: "pay", label: "Pay or transfer money" },
  { value: "share", label: "Share an OTP or personal info" },
  { value: "link", label: "Click a link or install an app" },
  { value: "reply", label: "Reply or send documents" },
  { value: "other", label: "Something else" },
  { value: "nothing", label: "Nothing" },
];

const MODES: { value: Channel; label: string; placeholder: string; sender: string }[] = [
  { value: "email", label: "Email", placeholder: "Paste the full email, including the greeting and signature…", sender: "Sender email address" },
  { value: "sms", label: "SMS", placeholder: "Paste the text message…", sender: "Sender number or ID" },
  { value: "whatsapp", label: "WhatsApp", placeholder: "Paste the WhatsApp message…", sender: "Sender number or name" },
  { value: "other", label: "Other text", placeholder: "Paste any message: LinkedIn, Telegram, a job post…", sender: "Sender (if known)" },
];

export default function MessageScanner({ initialText = "", origin = "web" }: { initialText?: string; origin?: "web" | "pwa-share" }) {
  const [text, setText] = useState(initialText);
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [sender, setSender] = useState("");
  const [fromSample, setFromSample] = useState(false);
  const [ctx, setCtx] = useState<MessageContext>({});
  const [ctxOpen, setCtxOpen] = useState(false);
  const answered = [ctx.expected, ctx.recognised, ctx.askedTo?.length ? 1 : undefined].filter(Boolean).length;
  const [, setReport] = useState<MessageReport | null>(null);
  const [job, setJob] = useState<{ key: number; text: string; channel: Channel; sender?: string; context: MessageContext; origin: "web" | "pwa-share" | "sample" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const ids = { text: useId(), sender: useId() };
  const toast = useToast();
  const mode = MODES.find((m) => m.value === channel)!;

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  const warnings = detectSensitiveData(text);
  const trimmed = text.trim();

  function run() {
    if (trimmed.length < 10) {
      setError("Paste a little more of the message — at least a full sentence — so CUSTODI has something to check.");
      return;
    }
    setError(null);
    setReport(null);
    setJob({ key: Date.now(), text: trimmed, channel, sender: sender.trim() || undefined, context: ctx, origin: fromSample ? "sample" : origin });
    if (window.matchMedia("(max-width: 1023px)").matches) requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function paste() {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip) return toast("Your clipboard is empty", "info");
      setText(clip.slice(0, MAX_MESSAGE_LENGTH));
      setFromSample(false);
    } catch {
      toast("Your browser blocked clipboard access — long-press inside the box and choose Paste", "warning");
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <form
        className="lg:sticky lg:top-24"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <div className="mb-4 overflow-x-auto">
          <Segmented label="Message type" value={channel} onChange={setChannel} options={MODES.map((m) => ({ value: m.value, label: m.label }))} />
        </div>
        <Label htmlFor={ids.text} hint={`${text.length.toLocaleString()} / ${MAX_MESSAGE_LENGTH.toLocaleString()}`}>
          Suspicious message
        </Label>
        <div className="relative">
          <TextArea
            id={ids.text}
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX_MESSAGE_LENGTH));
              setFromSample(false);
            }}
            rows={9}
            placeholder={mode.placeholder}
            aria-describedby={`${ids.text}-hint`}
          />
          {text && (
            <button
              type="button"
              aria-label="Clear message"
              onClick={() => {
                setText("");
                setSender("");
                setReport(null);
                setJob(null);
                setError(null);
              }}
              className="absolute top-2.5 right-2.5 rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p id={`${ids.text}-hint`} className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <Lock className="h-3.5 w-3.5" aria-hidden /> Checked on this device. Links in the message are never opened.
        </p>
        {warnings.map((w) => (
          <div key={w} className="mt-3">
            <Notice tone="warning">{w}</Notice>
          </div>
        ))}

        <div className="mt-4">
          <Label htmlFor={ids.sender} hint="optional">
            {mode.sender}
          </Label>
          <Input id={ids.sender} value={sender} onChange={(e) => setSender(e.target.value.slice(0, 254))} placeholder={channel === "email" ? "e.g. hr.team@gmail.com" : "e.g. +91 9XXXX XXXXX"} />
        </div>

        <div className="mt-4 rounded-2xl border border-line">
          <button
            type="button"
            onClick={() => setCtxOpen((o) => !o)}
            aria-expanded={ctxOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-medium text-ink">Add context <span className="font-normal text-muted">· optional</span></span>
              <span className="block text-xs text-muted">{answered ? `${answered} of 3 answered — raises confidence` : "3 quick questions improve accuracy. Skip if you like."}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-muted transition-transform ${ctxOpen ? "rotate-180" : ""}`} />
          </button>
          {ctxOpen && (
            <div className="space-y-4 border-t border-line px-4 py-4">
              {(
                [
                  ["expected", "Were you expecting this message?"],
                  ["recognised", "Do you recognise the sender?"],
                ] as const
              ).map(([key, q]) => (
                <div key={key}>
                  <p className="mb-1.5 text-sm text-ink">{q}</p>
                  <Segmented
                    size="sm"
                    label={q}
                    value={(ctx[key] ?? "") as Answer | ""}
                    onChange={(v) => setCtx((c) => ({ ...c, [key]: c[key] === v ? undefined : (v as Answer) }))}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "unsure", label: "Not sure" },
                    ]}
                  />
                </div>
              ))}
              <div>
                <p className="mb-1.5 text-sm text-ink">What is the sender asking you to do? <span className="text-muted">(pick any)</span></p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="What is the sender asking you to do?">
                  {ASKS.map((a) => {
                    const on = ctx.askedTo?.includes(a.value) ?? false;
                    return (
                      <button
                        key={a.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setCtx((c) => {
                            const cur = new Set(c.askedTo ?? []);
                            if (on) cur.delete(a.value);
                            else cur.add(a.value);
                            return { ...c, askedTo: Array.from(cur) };
                          })
                        }
                        className={`rounded-full border min-h-10 px-3 py-1.5 text-xs sm:min-h-0 transition-colors ${on ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-2 hover:border-ink/40"}`}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-muted">
                Answers stay on this device. A familiar sender never cancels a serious warning, and an unknown sender alone never makes a message High risk.
              </p>
              {answered > 0 && (
                <button type="button" className="text-xs text-accent underline underline-offset-2" onClick={() => setCtx({})}>
                  Clear answers
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4">
            <Notice tone="danger">{error}</Notice>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" size="lg" className="flex-1 sm:flex-none">
            <ScanLine className="h-5 w-5" /> Analyse message
          </Button>
          <Button variant="secondary" size="lg" onClick={paste}>
            <ClipboardPaste className="h-4 w-4" /> Paste
          </Button>
        </div>

        <div className="mt-7 border-t border-line pt-5">
          <p className="t-eyebrow text-muted">New here? Try a fictional sample</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SAMPLE_MESSAGES.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  setText(s.text);
                  setChannel(s.channel);
                  setSender(s.sender ?? "");
                  setFromSample(true);
                  setCtx({});
                  setReport(null);
                  setJob(null);
                  setError(null);
                }}
                className="rounded-full border border-line bg-surface min-h-10 px-3 py-1.5 text-xs sm:min-h-0 text-ink-2 transition-colors hover:border-accent hover:text-accent"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </form>

      <div ref={resultRef} className="scroll-mt-20">
        {job ? (
          <AnalysisRun
            key={job.key}
            input={{ text: job.text, channel: job.channel, sender: job.sender, context: job.context }}
            opts={{ trustedDomains: getSettings().trustedDomains }}
            onDone={(r) => {
              setReport(r);
              saveScan(r, { messageText: job.text, origin: job.origin });
            }}
          />
        ) : (
          <div className="panel flex min-h-[28rem] flex-col items-center justify-center border-dashed p-8 text-center">
            <div className="w-48 text-ink">
              <ArtMessage />
            </div>
            <p className="t-h3 mt-6">Your result appears here</p>
            <ul className="mt-3 max-w-sm space-y-1.5 text-left text-sm text-muted">
              <li>• A clear verdict: <b className="text-high">Suspicious</b>, <b className="text-medium">Caution</b> or <b className="text-low">Low risk</b></li>
              <li>• The exact words that raised concern, highlighted</li>
              <li>• What each sign means, in plain language</li>
              <li>• What to do next</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
