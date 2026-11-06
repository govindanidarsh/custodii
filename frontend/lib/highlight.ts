export interface TextSegment {
  text: string;
  highlighted: boolean;
}

/** Splits text into plain / highlighted segments for every evidence phrase found in it. */
export function highlightEvidence(text: string, evidence: string[]): TextSegment[] {
  const ranges: [number, number][] = [];
  const lower = text.toLowerCase();
  for (const phrase of evidence) {
    if (!phrase) continue;
    // Evidence should be an exact substring; fall back to a case-insensitive match.
    let idx = text.indexOf(phrase);
    if (idx < 0) idx = lower.indexOf(phrase.toLowerCase());
    if (idx >= 0) ranges.push([idx, idx + phrase.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);

  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), highlighted: false });
    segments.push({ text: text.slice(start, end), highlighted: true });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlighted: false });
  return segments;
}
