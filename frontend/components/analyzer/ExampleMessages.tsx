"use client";

import { CHANNEL_ICONS } from "@/components/analyzer/ChannelSelector";
import { Icon } from "@/components/ui/Icon";
import { CHANNELS } from "@/lib/constants";
import { EXAMPLE_MESSAGES, type ExampleMessage } from "@/lib/examples";

interface ExampleMessagesProps {
  onSelect: (example: ExampleMessage) => void;
  disabled?: boolean;
}

export function ExampleMessages({ onSelect, disabled }: ExampleMessagesProps) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">Try an example</h3>
        <p className="text-xs text-muted">All fictional</p>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {EXAMPLE_MESSAGES.map((ex) => (
          <li key={ex.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(ex)}
              className="group flex h-full w-full flex-col items-start gap-2 rounded-2xl border border-line bg-white p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift disabled:pointer-events-none disabled:opacity-60"
            >
              <span className="flex w-full items-center gap-2 text-xs text-muted">
                <Icon name={CHANNEL_ICONS[ex.channel]} className="h-3.5 w-3.5" />
                <span>{CHANNELS.find((c) => c.value === ex.channel)?.label}</span>
                <span className="ml-auto rounded-full bg-canvas px-2 py-0.5 font-medium text-ink-soft">{ex.tag}</span>
              </span>
              <span className="text-sm font-semibold text-ink">{ex.title}</span>
              <span className="line-clamp-2 text-[13px] leading-snug text-muted">{ex.text}</span>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-600 opacity-80 transition-opacity group-hover:opacity-100">
                Use this message <Icon name="arrow-right" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
