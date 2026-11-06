import type { Channel } from "./types";
import { TEST_CASES, type MessageCase } from "./testCases";

/** Fictional samples offered in the scanner UI. Drawn from the Test Lab cases so they stay in sync. */
export interface SampleMessage {
  id: string;
  label: string;
  channel: Channel;
  sender?: string;
  text: string;
}

const PICK: Record<string, string> = {
  M01: "OTP request",
  M02: "Hinglish fee",
  M03: "APK download",
  M04: "UPI PIN",
  M05: "Task job",
  M09: "Gmail + short link",
  M13: "Normal invite",
  M15: "Real-looking offer",
};

export const SAMPLE_MESSAGES: SampleMessage[] = TEST_CASES.filter(
  (c): c is MessageCase => c.kind === "message" && c.id in PICK,
).map((c) => ({ id: c.id, label: PICK[c.id]!, channel: c.channel, sender: c.sender, text: c.text }));
