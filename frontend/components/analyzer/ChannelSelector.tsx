"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { CHANNELS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { Channel } from "@/types/analysis";

export const CHANNEL_ICONS: Record<Channel, IconName> = { email: "mail", sms: "phone", whatsapp: "message", other: "list" };

interface ChannelSelectorProps {
  value: Channel;
  onChange: (c: Channel) => void;
  disabled?: boolean;
}

export function ChannelSelector({ value, onChange, disabled }: ChannelSelectorProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-sm font-medium text-ink">Where did you receive it?</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CHANNELS.map((c) => {
          const active = value === c.value;
          return (
            <label
              key={c.value}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700 shadow-[0_0_0_3px_rgb(79_107_255/0.12)]"
                  : "border-line bg-white text-ink-soft hover:border-line-strong",
              )}
            >
              <input type="radio" name="channel" value={c.value} checked={active} onChange={() => onChange(c.value)} className="sr-only" />
              <Icon name={CHANNEL_ICONS[c.value]} className="h-4 w-4" />
              {c.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
