import { analyze, mergeUsages, parse, renderSegments, segmentsToText, type ParseResult, type Segment } from './engine';
import { lint, type Diagnostic, type PromptPart } from './lint';
import type { PromptDocument, VariableDef, Values } from './schema';
import { countWords, estimateTokens } from './tokens';
import { coerceValue, resolveVariables, unusedDeclarations, type ResolvedVariable } from './variables';

export interface CompiledPart {
  parse: ParseResult;
  segments: Segment[];
  text: string;
}

export interface CompiledPrompt {
  system: CompiledPart;
  prompt: CompiledPart;
  variables: ResolvedVariable[];
  /** Declared variables the template never references. */
  unused: VariableDef[];
  values: Values;
  diagnostics: Diagnostic[];
  /** No errors: safe to copy or send. Warnings do not block. */
  ready: boolean;
  stats: { words: number; characters: number; tokens: number };
}

function compilePart(result: ParseResult, values: Values): CompiledPart {
  const segments = result.ok ? renderSegments(result.nodes, values) : [];
  return { parse: result, segments, text: segmentsToText(segments) };
}

/** The whole pipeline: parse → resolve variables → coerce values → render → lint. */
export function compile(doc: PromptDocument): CompiledPrompt {
  const parses: Record<PromptPart, ParseResult> = { system: parse(doc.system), prompt: parse(doc.prompt) };
  const usages = mergeUsages(
    parses.system.ok ? analyze(parses.system.nodes) : [],
    parses.prompt.ok ? analyze(parses.prompt.nodes) : [],
  );

  const variables = resolveVariables(doc.variables, usages);
  const values: Values = {};
  for (const variable of variables) {
    const value = coerceValue(variable, doc.values[variable.name]);
    if (value !== undefined) values[variable.name] = value;
  }

  const system = compilePart(parses.system, values);
  const prompt = compilePart(parses.prompt, values);

  // While a template is broken, usages are incomplete and every declared
  // variable would look unused; the syntax error is the only useful report.
  const unused = parses.system.ok && parses.prompt.ok ? unusedDeclarations(doc.variables, usages) : [];
  const diagnostics = lint({
    parses,
    variables,
    unused,
    values,
    output: { system: system.text, prompt: prompt.text },
  });

  const combined = [system.text, prompt.text].filter(Boolean).join('\n\n');
  return {
    system,
    prompt,
    variables,
    unused,
    values,
    diagnostics,
    ready: !diagnostics.some((d) => d.severity === 'error'),
    stats: {
      words: countWords(combined),
      characters: combined.length,
      tokens: estimateTokens(system.text) + estimateTokens(prompt.text),
    },
  };
}
