import { AnalyzerSection } from "@/app/components/AnalyzerSection";
import { Features } from "@/app/components/Features";
import { Hero } from "@/app/components/Hero";
import { HowItWorks } from "@/app/components/HowItWorks";
import { PrivacySecurity } from "@/app/components/PrivacySecurity";
import { Problem } from "@/app/components/Problem";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function HomePage() {
  return (
    <>
      <a
        href="#analyze"
        className="sr-only z-[60] rounded-lg bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to message check
      </a>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <AnalyzerSection />
        <HowItWorks />
        <Features />
        <PrivacySecurity />
      </main>
      <Footer />
    </>
  );
}
