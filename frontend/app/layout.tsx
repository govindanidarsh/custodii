import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustLayer AI — Check suspicious placement messages",
  description:
    "Paste a suspicious placement, internship or recruiter message. TrustLayer AI highlights the red flags, explains why they matter and tells you the safe next step.",
};

export const viewport: Viewport = {
  themeColor: "#f7f8fc",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Marks JS as available so scroll-reveal styles apply only when they can run. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
