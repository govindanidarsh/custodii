# Frontend — Claude instructions

Read the root `CLAUDE.md` first. Owner: Antriksh. Reviewer: Teammate 4.

## Stack
Next.js 15 App Router · React 19 · TypeScript (strict) · Tailwind CSS v4 (tokens in `app/globals.css`) ·
self-hosted fonts via `@fontsource-variable/*` (no Google Fonts fetch at build time) · Prettier · ESLint.

## Layout
- `app/` — routes. `app/components/` holds **page sections** used only by the landing page (Hero, Problem, …).
- `components/ui/` — generic, reusable primitives (Button, Container, Icon, Reveal, SectionHeading).
- `components/layout/` — Navbar, Footer, Logo.
- `components/analyzer/` — reusable analyzer pieces (form, channel selector, result panel, finding card, examples).
- `hooks/` — client hooks (`useAnalyzer`).
- `lib/` — logic with no JSX: validation, constants, highlight, `analyzer.ts` (single entry point), `mock/`.
- `types/` — shared types mirroring API_CONTRACT.md.

## Rules
- The UI calls only `lib/analyzer.ts#analyzeMessage`. Never call Claude or any AI provider from the browser.
- `NEXT_PUBLIC_ANALYZER_MODE=demo` (default) uses `lib/mock/mockAnalyzer.ts`. Mock results must keep
  `analysis_mode: "demo"` and the visible "Demonstration data" label.
- Risk is never shown by colour alone — always include the text label.
- Keyboard accessible, visible focus, respects `prefers-reduced-motion`, works at 360 px width.
- Never render message text as HTML; never make links from a message clickable.
- Do not invent API fields. Change API_CONTRACT.md first (with backend sign-off), then `types/analysis.ts`.

## Commands
npm run dev · npm run lint · npm run typecheck · npm run build · npm run check · npm run format
