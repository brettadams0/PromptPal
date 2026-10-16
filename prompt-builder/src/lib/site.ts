export const SITE = {
  name: 'PromptPal',
  description:
    'Write prompt templates with real variables and conditionals, catch mistakes with a linter, and export ready-to-run Claude API calls. Runs entirely in your browser.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prompt-pal-gules.vercel.app',
  repo: 'https://github.com/brettadams0/PromptPal',
  author: 'Brett Adams',
  authorUrl: 'https://brettadams0.github.io',
} as const;
