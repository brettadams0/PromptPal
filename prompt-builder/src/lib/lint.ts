import { isSet, type ParseResult, type SourceLocation } from './engine';
import type { VariableDef, Values } from './schema';
import { estimateTokens } from './tokens';
import type { ResolvedVariable } from './variables';

export type Severity = 'error' | 'warning' | 'info';
export type PromptPart = 'system' | 'prompt';

export interface Diagnostic {
  rule: LintRule;
  severity: Severity;
  message: string;
  /** Which template the diagnostic points into, when it points anywhere. */
  part?: PromptPart;
  loc?: SourceLocation;
  /** The variable the diagnostic is about, so the UI can focus its field. */
  variable?: string;
}

export type LintRule =
  'syntax' | 'empty-prompt' | 'required-empty' | 'unused-variable' | 'leftover-placeholder' | 'long-prompt';

export const RULE_DESCRIPTIONS: Record<LintRule, string> = {
  syntax: 'The template does not parse.',
  'empty-prompt': 'The prompt renders to nothing.',
  'required-empty': 'A required field has no value.',
  'unused-variable': 'A declared variable is never referenced, so its field would do nothing.',
  'leftover-placeholder': 'The output still contains fill-me-in text such as [insert topic] or TODO.',
  'long-prompt': 'The prompt is long enough that trimming is worth a look.',
};

/**
 * Fill-me-in text that survives copy-paste from other prompt collections.
 * Each pattern is narrow on purpose: a linter that cries wolf gets ignored.
 */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /\[(?:insert|your|add|enter|put|paste)\b[^\]\n]{0,60}\]/gi,
  /<(?:insert|your|add|enter|paste)\b[^>\n]{0,60}>/gi,
  /\b(?:TODO|TBD|FIXME|XXX)\b/g,
  /\bLorem ipsum\b/gi,
];

export const LONG_PROMPT_TOKENS = 6000;

export interface LintInput {
  parses: Record<PromptPart, ParseResult>;
  variables: readonly ResolvedVariable[];
  unused: readonly VariableDef[];
  values: Values;
  output: Record<PromptPart, string>;
}

export function lint(input: LintInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const part of ['system', 'prompt'] as const) {
    const result = input.parses[part];
    if (!result.ok) {
      diagnostics.push({
        rule: 'syntax',
        severity: 'error',
        part,
        loc: result.error.loc,
        message: `${part === 'system' ? 'System' : 'Prompt'} line ${result.error.loc.line}, column ${result.error.loc.column}: ${result.error.message}`,
      });
    }
  }
  // Every later rule reads the rendered output, which is meaningless while
  // either template fails to parse.
  if (diagnostics.length > 0) return diagnostics;

  if (input.output.prompt.trim() === '') {
    diagnostics.push({
      rule: 'empty-prompt',
      severity: 'error',
      part: 'prompt',
      message: 'The prompt renders to nothing. Fill in a field or write some text.',
    });
  }

  for (const variable of input.variables) {
    if (variable.required && !isSet(input.values[variable.name])) {
      diagnostics.push({
        rule: 'required-empty',
        severity: 'error',
        variable: variable.name,
        message: `“${variable.label}” is required.`,
      });
    }
  }

  for (const variable of input.unused) {
    diagnostics.push({
      rule: 'unused-variable',
      severity: 'warning',
      variable: variable.name,
      message: `“${variable.label}” ({{${variable.name}}}) is declared but never used in the template.`,
    });
  }

  const seen = new Set<string>();
  for (const part of ['system', 'prompt'] as const) {
    for (const pattern of PLACEHOLDER_PATTERNS) {
      for (const match of input.output[part].matchAll(pattern)) {
        const key = `${part}:${match[0].toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        diagnostics.push({
          rule: 'leftover-placeholder',
          severity: 'warning',
          part,
          message: `The ${part === 'system' ? 'system prompt' : 'prompt'} still contains “${match[0]}”. The model will take it literally.`,
        });
      }
    }
  }

  const tokens = estimateTokens(input.output.system) + estimateTokens(input.output.prompt);
  if (tokens > LONG_PROMPT_TOKENS) {
    diagnostics.push({
      rule: 'long-prompt',
      severity: 'info',
      message: `About ${tokens.toLocaleString('en-US')} tokens. Long prompts are fine, but repeated or boilerplate instructions are worth trimming.`,
    });
  }

  return diagnostics;
}
