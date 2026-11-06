"use client";

import { useId, useState, type FormEvent } from "react";
import { ChannelSelector } from "@/components/analyzer/ChannelSelector";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MESSAGE_MAX_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { detectSensitiveContent, validateAnalyzeInput, type FormErrors } from "@/lib/validation";
import type { AnalyzeRequest, Channel } from "@/types/analysis";

export interface MessageFormValues {
  message: string;
  channel: Channel;
  sender: string;
}

interface MessageFormProps {
  values: MessageFormValues;
  onChange: (v: MessageFormValues) => void;
  onSubmit: (req: AnalyzeRequest) => void;
  onClear: () => void;
  loading: boolean;
}

export function MessageForm({ values, onChange, onSubmit, onClear, loading }: MessageFormProps) {
  const ids = { message: useId(), sender: useId(), msgErr: useId(), senderErr: useId(), count: useId() };
  // Errors are derived from the current values once the user has tried to submit, so they
  // stay in sync when values change from outside the form (e.g. picking an example).
  const [touched, setTouched] = useState(false);
  const errors: FormErrors = touched ? validateAnalyzeInput(values.message, values.sender) : {};

  const length = values.message.length;
  const over = length > MESSAGE_MAX_LENGTH;
  const sensitive = detectSensitiveContent(values.message);

  const update = (patch: Partial<MessageFormValues>) => onChange({ ...values, ...patch });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const errs = validateAnalyzeInput(values.message, values.sender);
    if (errs.message || errs.sender) {
      document.getElementById(errs.message ? ids.message : ids.sender)?.focus();
      return;
    }
    onSubmit({
      message_text: values.message.trim(),
      channel: values.channel,
      sender: values.sender.trim() || undefined,
      locale: "en",
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-busy={loading}>
      <ChannelSelector value={values.channel} onChange={(channel) => update({ channel })} disabled={loading} />

      <div>
        <div className="mb-2 flex items-end justify-between gap-4">
          <label htmlFor={ids.message} className="text-sm font-medium text-ink">
            Paste the message
          </label>
          <span id={ids.count} className={cn("text-xs tabular-nums", over ? "font-semibold text-risk-high" : "text-muted")}>
            {length.toLocaleString("en-IN")} / {MESSAGE_MAX_LENGTH.toLocaleString("en-IN")}
          </span>
        </div>
        <textarea
          id={ids.message}
          value={values.message}
          onChange={(e) => update({ message: e.target.value })}
          rows={8}
          disabled={loading}
          placeholder="Paste the full email, SMS or WhatsApp message here…"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={cn(ids.count, errors.message && ids.msgErr) || undefined}
          className={cn(
            "block w-full resize-y rounded-2xl border bg-white px-4 py-3.5 text-[15px] leading-relaxed text-ink placeholder:text-muted/70",
            "transition-shadow focus:outline-none focus:ring-4",
            errors.message
              ? "border-risk-high/60 focus:ring-risk-high/10"
              : "border-line-strong focus:border-brand-500 focus:ring-brand-500/12",
            "disabled:bg-canvas disabled:text-muted",
          )}
        />
        {errors.message && (
          <p id={ids.msgErr} role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-risk-high">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
            {errors.message}
          </p>
        )}
        {sensitive && !errors.message && (
          <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-risk-medium-bg px-3 py-2 text-sm text-risk-medium">
            <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0" />
            {sensitive}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={ids.sender} className="mb-2 block text-sm font-medium text-ink">
          Sender <span className="font-normal text-muted">(optional — email or phone shown on the message)</span>
        </label>
        <input
          id={ids.sender}
          type="text"
          inputMode="email"
          autoComplete="off"
          value={values.sender}
          onChange={(e) => update({ sender: e.target.value })}
          disabled={loading}
          placeholder="e.g. careers@company.example"
          aria-invalid={Boolean(errors.sender)}
          aria-describedby={errors.sender ? ids.senderErr : undefined}
          className={cn(
            "block h-11 w-full rounded-xl border bg-white px-4 text-[15px] text-ink placeholder:text-muted/70 focus:outline-none focus:ring-4",
            errors.sender
              ? "border-risk-high/60 focus:ring-risk-high/10"
              : "border-line-strong focus:border-brand-500 focus:ring-brand-500/12",
          )}
        />
        {errors.sender && (
          <p id={ids.senderErr} role="alert" className="mt-2 text-sm text-risk-high">
            {errors.sender}
          </p>
        )}
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-line bg-canvas px-3.5 py-3 text-[13px] leading-relaxed text-ink-soft">
        <Icon name="eye-off" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        Remove your phone number, address and any real codes before pasting. Never paste your own OTP, password or bank details.
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {(values.message || values.sender) && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setTouched(false);
              onClear();
            }}
            disabled={loading}
          >
            Clear
          </Button>
        )}
        <Button type="submit" size="lg" disabled={loading} className="sm:min-w-48">
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
              Analysing…
            </>
          ) : (
            <>
              <Icon name="search" className="h-4 w-4" />
              Analyze Message
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
