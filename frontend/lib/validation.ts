import { MESSAGE_MAX_LENGTH, MESSAGE_MIN_LENGTH, SENDER_MAX_LENGTH } from "@/lib/constants";

export interface FormErrors {
  message?: string;
  sender?: string;
}

export function validateAnalyzeInput(message: string, sender: string): FormErrors {
  const errors: FormErrors = {};
  const trimmed = message.trim();

  if (!trimmed) {
    errors.message = "Paste the message you want to check.";
  } else if (trimmed.length < MESSAGE_MIN_LENGTH) {
    errors.message = `That’s too short to analyse. Paste at least ${MESSAGE_MIN_LENGTH} characters of the message.`;
  } else if (trimmed.length > MESSAGE_MAX_LENGTH) {
    errors.message = `Messages can be up to ${MESSAGE_MAX_LENGTH.toLocaleString("en-IN")} characters. Trim signatures or quoted replies.`;
  }

  const s = sender.trim();
  if (s.length > SENDER_MAX_LENGTH) {
    errors.sender = "Sender is too long.";
  } else if (s && /[<>]/.test(s)) {
    errors.sender = "Enter just the email address or phone number, without < or >.";
  }

  return errors;
}

/**
 * Soft privacy check: warn (never block) when the pasted text seems to contain
 * the student's own secrets, so they can remove them before analysis.
 */
export function detectSensitiveContent(message: string): string | null {
  if (/\b(?:\d[ -]?){13,19}\b/.test(message)) {
    return "This looks like it may contain a card or account number. Remove it before analysing.";
  }
  if (/\b(otp|code|pin)\b[^\n]{0,20}\b\d{4,8}\b/i.test(message)) {
    return "This may contain a real OTP or PIN. Replace it with XXXX — we don’t need it to check the message.";
  }
  return null;
}
