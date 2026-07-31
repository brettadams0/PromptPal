# PromptPal

[![CI](https://github.com/brettadams0/PromptPal/actions/workflows/ci.yml/badge.svg)](https://github.com/brettadams0/PromptPal/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A Next.js App Router front end for a prompt-composition tool: pick a task type and tone, fill in the
variables, get a prompt you can paste into ChatGPT or Claude.

**Status: the foundation is built, the builder is not.** What exists today is the landing page, the
component library, and the full type and configuration layer. The page that actually composes a
prompt has not been written yet — the "Start Building" and "View Templates" buttons on the home page
are not wired to anything. Read this as a typed Next.js scaffold, not as a working product.

## Running it

The app lives in the `prompt-builder/` subdirectory — the repo root holds only docs and CI, so
`npm install` at the top level finds nothing:

```sh
cd prompt-builder
npm install
npm run dev            # http://localhost:3000
```

Node 20.x, matching CI.

```sh
npx tsc --noEmit       # type-check
npm run build          # production build
```

## What is actually there

| | |
|---|---|
| `src/app/page.tsx` | The landing page — hero, feature cards, task-type grid. Static. |
| `src/app/layout.tsx` | Root layout, theme provider, fonts |
| `src/components/ui/` | Button, Card, Input, Select, Slider, DropdownMenu, ThemeToggle — Radix primitives with Tailwind variants |
| `src/components/layout/` | Header, footer, dark/light theme provider |
| `src/lib/types.ts` | The domain model: `PromptTemplate`, `PromptVariable`, `GeneratedPrompt`, `UserPreferences`, `OutputFormat`, and the form/validation types |
| `src/lib/constants.ts` | Task types, tone options, output formats |
| `src/lib/utils.ts` | `cn()` class merging and helpers |

Dark/light theming works. The component library is real and reusable. `types.ts` is the most
finished thing in the repo — it describes a builder that the UI has not caught up with.

## What is not there yet

No builder route, no template library, no variable substitution, no export, no persistence. Those
are the next pieces of work, roughly in that order — the types for all of them already exist, which
is most of the design decided.

## Tech

Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI, Lucide icons. CI runs `npm ci` and
`tsc --noEmit` on Node 20. Deployed on Vercel.

## License

MIT — see [LICENSE](LICENSE).
