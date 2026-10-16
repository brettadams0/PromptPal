/**
 * Turns a compiled prompt into something you can paste: plain text for a chat
 * window, or a ready-to-run call to the Anthropic Messages API.
 *
 * Every string that lands inside generated code goes through JSON.stringify.
 * A JSON string literal is also a valid JavaScript and Python string literal,
 * so quotes, backslashes and newlines in a prompt can never break out of the
 * snippet around it.
 */

export const EXPORT_FORMATS = ['text', 'markdown', 'json', 'curl', 'python', 'typescript'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_LABELS: Record<ExportFormat, string> = {
  text: 'Text',
  markdown: 'Markdown',
  json: 'API JSON',
  curl: 'cURL',
  python: 'Python',
  typescript: 'TypeScript',
};

/** Formats that call the API, and so need a model. */
export const API_FORMATS: ReadonlySet<ExportFormat> = new Set(['json', 'curl', 'python', 'typescript']);

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5' },
] as const;
export type ModelId = (typeof MODELS)[number]['id'];
export const DEFAULT_MODEL: ModelId = 'claude-opus-5-5';

export const MAX_TOKENS = 16000;
export const ANTHROPIC_VERSION = '2023-06-01';

export interface ExportInput {
  system: string;
  prompt: string;
  model: ModelId;
}

export function requestBody({ system, prompt, model }: ExportInput) {
  return {
    model,
    max_tokens: MAX_TOKENS,
    ...(system ? { system } : {}),
    messages: [{ role: 'user' as const, content: prompt }],
  };
}

const lit = (s: string) => JSON.stringify(s);

/** A heredoc terminator guaranteed not to appear on any line of the body. */
export function heredocDelimiter(body: string): string {
  const lines = new Set(body.split('\n'));
  let delimiter = 'JSON';
  for (let i = 2; lines.has(delimiter); i++) delimiter = `JSON_${i}`;
  return delimiter;
}

function curl(input: ExportInput): string {
  const body = JSON.stringify(requestBody(input), null, 2);
  const eof = heredocDelimiter(body);
  // A quoted heredoc passes the body through untouched: no $-expansion, no
  // backticks, no quote juggling, whatever the prompt contains.
  return [
    'curl https://api.anthropic.com/v1/messages \\',
    '  -H "x-api-key: $ANTHROPIC_API_KEY" \\',
    `  -H "anthropic-version: ${ANTHROPIC_VERSION}" \\`,
    '  -H "content-type: application/json" \\',
    `  --data-binary @- <<'${eof}'`,
    body,
    eof,
  ].join('\n');
}

function python({ system, prompt, model }: ExportInput): string {
  return [
    'import anthropic',
    '',
    'client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY',
    '',
    'message = client.messages.create(',
    `    model=${lit(model)},`,
    `    max_tokens=${MAX_TOKENS},`,
    ...(system ? [`    system=${lit(system)},`] : []),
    `    messages=[{"role": "user", "content": ${lit(prompt)}}],`,
    ')',
    '',
    'for block in message.content:',
    '    if block.type == "text":',
    '        print(block.text)',
  ].join('\n');
}

function typescript({ system, prompt, model }: ExportInput): string {
  return [
    "import Anthropic from '@anthropic-ai/sdk';",
    '',
    'const client = new Anthropic(); // reads ANTHROPIC_API_KEY',
    '',
    'const message = await client.messages.create({',
    `  model: ${lit(model)},`,
    `  max_tokens: ${MAX_TOKENS},`,
    ...(system ? [`  system: ${lit(system)},`] : []),
    `  messages: [{ role: 'user', content: ${lit(prompt)} }],`,
    '});',
    '',
    'for (const block of message.content) {',
    "  if (block.type === 'text') console.log(block.text);",
    '}',
  ].join('\n');
}

export function exportPrompt(format: ExportFormat, input: ExportInput): string {
  switch (format) {
    case 'text':
      return [input.system, input.prompt].filter(Boolean).join('\n\n');
    case 'markdown':
      return input.system ? `## System\n\n${input.system}\n\n## Prompt\n\n${input.prompt}` : input.prompt;
    case 'json':
      return JSON.stringify(requestBody(input), null, 2);
    case 'curl':
      return curl(input);
    case 'python':
      return python(input);
    case 'typescript':
      return typescript(input);
  }
}
