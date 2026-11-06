import type { Channel } from "@/types/analysis";

/**
 * Fictional sample messages for demos. All names, companies, numbers and
 * domains are invented (.test / .example domains). Never add real messages here.
 */
export interface ExampleMessage {
  id: string;
  title: string;
  tag: string;
  channel: Channel;
  sender?: string;
  text: string;
}

export const EXAMPLE_MESSAGES: ExampleMessage[] = [
  {
    id: "otp-email",
    title: "“Confirm your selection”",
    tag: "OTP request",
    channel: "email",
    sender: "hr.northwind.careers@gmail.com",
    text: "Dear Candidate,\n\nCongratulations! You have been shortlisted for the Graduate Analyst role at Northwind Analytics. To confirm your selection, please share the OTP you receive on your registered mobile number within 15 minutes. Failure to respond will cancel your offer.\n\nRegards,\nTalent Team",
  },
  {
    id: "fee-whatsapp",
    title: "Hinglish fee demand",
    tag: "Upfront fee",
    channel: "whatsapp",
    text: "Hello! Aapka selection Bluepeak Systems internship ke liye confirm ho gaya hai. Document verification ke liye ₹1,499 registration fee aaj hi jama karo, warna seat cancel ho jayegi. Payment ke baad offer letter bheja jayega.",
  },
  {
    id: "apk-sms",
    title: "Install the HR app",
    tag: "Unsafe download",
    channel: "sms",
    text: "Offer update: Your onboarding with Orbit Labs is pending. Download HRConnect-Onboard.apk from rb.gy/x7k2qa and complete KYC to receive your joining kit.",
  },
  {
    id: "legit-invite",
    title: "Ordinary interview invite",
    tag: "Looks normal",
    channel: "email",
    sender: "campus.hiring@northwind.example",
    text: "Hi Priya,\n\nThank you for applying to the Software Engineering Intern role. We'd like to invite you to a 45-minute technical interview on 12 November at 3:00 PM IST over video call. Please reply with a confirmation, or suggest another slot that works for you.\n\nBest,\nAnanya Rao\nCampus Recruiting, Northwind Analytics",
  },
];
