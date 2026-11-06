import type { Channel, RiskLevel } from "@/types/analysis";

export const MESSAGE_MIN_LENGTH = 20;
export const MESSAGE_MAX_LENGTH = 5000;
export const SENDER_MAX_LENGTH = 254;

export const CHANNELS: { value: Channel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
];

export const RISK_COPY: Record<RiskLevel, { label: string; headline: string }> = {
  high: {
    label: "High risk",
    headline: "Do not share secrets or pay. Verify independently.",
  },
  medium: {
    label: "Medium risk",
    headline: "Be careful. Verify the sender and opportunity before acting.",
  },
  low: {
    label: "Low risk",
    headline: "No major red flags found. This does not prove it is genuine.",
  },
};

export const LIMITATION_STATEMENT =
  "TrustLayer provides automated warning signals for educational and safety assistance. It cannot guarantee that a message is genuine or fraudulent. Verify important opportunities independently through official channels. Never share passwords, OTPs or payment credentials.";
