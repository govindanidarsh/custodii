"use client";

import { useCallback, useRef, useState } from "react";
import { analyzeMessage } from "@/lib/analyzer";
import type { AnalysisResult, AnalyzeRequest } from "@/types/analysis";

export type AnalyzerStatus = "idle" | "loading" | "success" | "error";

interface AnalyzerState {
  status: AnalyzerStatus;
  result: AnalysisResult | null;
  error: string | null;
  /** The exact text that produced `result`, used for evidence highlighting. */
  analysedText: string;
}

const INITIAL: AnalyzerState = { status: "idle", result: null, error: null, analysedText: "" };

export function useAnalyzer() {
  const [state, setState] = useState<AnalyzerState>(INITIAL);
  const controllerRef = useRef<AbortController | null>(null);
  // Ignores repeat submissions (e.g. fast double-clicks) while a check is already running.
  // A ref, not state, so clicks that land before React re-renders the disabled button are caught too.
  const inFlightRef = useRef(false);

  const analyze = useCallback(async (req: AnalyzeRequest) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((s) => ({ ...s, status: "loading", error: null }));

    // Demo-only: append ?demoError=1 to the URL to preview the error state.
    const simulateError = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demoError") === "1";

    try {
      const result = await analyzeMessage(req, { signal: controller.signal, simulateError });
      if (controller.signal.aborted) return;
      setState({ status: "success", result, error: null, analysedText: req.message_text });
    } catch (err) {
      if (controller.signal.aborted) return;
      const message =
        err instanceof Error && !simulateError ? err.message : "We couldn’t analyse this message right now. Please try again.";
      setState((s) => ({ ...s, status: "error", error: message }));
    } finally {
      if (controllerRef.current === controller) inFlightRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    inFlightRef.current = false;
    setState(INITIAL);
  }, []);

  return { ...state, analyze, reset };
}
