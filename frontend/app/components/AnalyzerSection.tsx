"use client";

import { useRef, useState } from "react";
import { ExampleMessages } from "@/components/analyzer/ExampleMessages";
import { MessageForm, type MessageFormValues } from "@/components/analyzer/MessageForm";
import { DemoNotice, ResultError, ResultLoading, ResultPanel, ResultPlaceholder } from "@/components/analyzer/ResultPanel";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useAnalyzer } from "@/hooks/useAnalyzer";
import { isDemoMode } from "@/lib/analyzer";
import type { ExampleMessage } from "@/lib/examples";
import type { AnalyzeRequest } from "@/types/analysis";

const EMPTY: MessageFormValues = { message: "", channel: "email", sender: "" };

export function AnalyzerSection() {
  const [values, setValues] = useState<MessageFormValues>(EMPTY);
  const lastRequest = useRef<AnalyzeRequest | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const { status, result, error, analysedText, analyze, reset } = useAnalyzer();

  const run = (req: AnalyzeRequest) => {
    lastRequest.current = req;
    void analyze(req);
    // On small screens the result sits below the form — bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const handleExample = (ex: ExampleMessage) => {
    setValues({ message: ex.text, channel: ex.channel, sender: ex.sender ?? "" });
    reset();
  };

  return (
    <section id="analyze" aria-labelledby="analyze-heading" className="relative py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-brand-50/70 to-transparent"
      />
      <Container className="relative">
        <SectionHeading
          id="analyze-heading"
          eyebrow="Message check"
          title="Paste it. See the red flags. Know what to do."
          description="Works with emails, SMS and WhatsApp messages about placements, internships and job offers."
        />

        {isDemoMode && (
          <div className="mt-6 max-w-2xl">
            <DemoNotice />
          </div>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          <div className="space-y-6">
            <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
              <MessageForm
                values={values}
                onChange={setValues}
                onSubmit={run}
                onClear={() => {
                  setValues(EMPTY);
                  reset();
                }}
                loading={status === "loading"}
              />
            </div>
            <ExampleMessages onSelect={handleExample} disabled={status === "loading"} />
          </div>

          <div ref={resultRef} aria-live="polite" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
            {status === "idle" && <ResultPlaceholder />}
            {status === "loading" && <ResultLoading />}
            {status === "error" && error && <ResultError message={error} onRetry={() => lastRequest.current && run(lastRequest.current)} />}
            {status === "success" && result && <ResultPanel result={result} analysedText={analysedText} />}
          </div>
        </div>
      </Container>
    </section>
  );
}
