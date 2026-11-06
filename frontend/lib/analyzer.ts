/**
 * Single entry point the UI uses to analyse a message.
 *
 * Phase 1 (now): always uses the in-browser demo analyzer.
 * Later phases: set NEXT_PUBLIC_ANALYZER_MODE=api to call the FastAPI backend.
 * The browser never calls Claude directly and never holds API keys.
 */
import { analyzeMessageMock } from "@/lib/mock/mockAnalyzer";
import type { AnalysisResult, AnalyzeRequest } from "@/types/analysis";

const MODE = process.env.NEXT_PUBLIC_ANALYZER_MODE === "api" ? "api" : "demo";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const isDemoMode = MODE === "demo";

const UNAVAILABLE = "The analysis service is unavailable right now. Please try again shortly.";

async function analyzeViaApi(req: AnalyzeRequest, signal?: AbortSignal): Promise<AnalysisResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
  } catch {
    // Network failure (offline, CORS, server down): show a friendly message, not "Failed to fetch".
    throw new Error(UNAVAILABLE);
  }
  if (res.status === 422) throw new Error("The message couldn’t be accepted. Check its length and try again.");
  if (res.status === 429) throw new Error("Too many checks in a short time. Please wait a minute and try again.");
  if (!res.ok) throw new Error(UNAVAILABLE);
  return (await res.json()) as AnalysisResult;
}

export async function analyzeMessage(
  req: AnalyzeRequest,
  opts?: { signal?: AbortSignal; simulateError?: boolean },
): Promise<AnalysisResult> {
  if (MODE === "api") return analyzeViaApi(req, opts?.signal);
  return analyzeMessageMock(req, { simulateError: opts?.simulateError });
}
