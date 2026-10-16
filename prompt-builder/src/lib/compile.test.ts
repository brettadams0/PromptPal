import { describe, expect, it } from 'vitest';
import { compile } from './compile';
import type { PromptDocument } from './schema';

const doc = (overrides: Partial<PromptDocument> = {}): PromptDocument => ({
  name: 'Test',
  category: 'writing',
  system: '',
  prompt: 'Write about {{topic}}.',
  variables: [{ name: 'topic', label: 'Topic', type: 'text', required: true }],
  values: { topic: 'tides' },
  ...overrides,
});

const rules = (d: PromptDocument) => compile(d).diagnostics.map((x) => x.rule);

describe('compile', () => {
  it('renders a clean document with no diagnostics', () => {
    const result = compile(doc());
    expect(result.prompt.text).toBe('Write about tides.');
    expect(result.diagnostics).toEqual([]);
    expect(result.ready).toBe(true);
  });

  it('infers fields for undeclared variables: text when interpolated, checkbox when only tested', () => {
    const result = compile(
      doc({ prompt: '{{topic}} {{#if formal}}Formally.{{/if}} for {{reader_level}}', values: {} }),
    );
    expect(result.variables.map((v) => [v.name, v.type, v.inferred, v.label])).toEqual([
      ['topic', 'text', false, 'Topic'],
      ['formal', 'boolean', true, 'Formal'],
      ['reader_level', 'text', true, 'Reader level'],
    ]);
  });

  it('flags required fields that are empty, and blocks readiness', () => {
    const result = compile(doc({ values: { topic: '  ' } }));
    expect(result.diagnostics).toMatchObject([{ rule: 'required-empty', severity: 'error', variable: 'topic' }]);
    expect(result.ready).toBe(false);
  });

  it('warns about declared variables the template never uses, without blocking', () => {
    const result = compile(doc({ variables: [...doc().variables, { name: 'tone', label: 'Tone', type: 'text' }] }));
    expect(result.diagnostics.map((d) => [d.rule, d.severity])).toEqual([['unused-variable', 'warning']]);
    expect(result.ready).toBe(true);
    // Unused variables do not get a form field.
    expect(result.variables.map((v) => v.name)).toEqual(['topic']);
  });

  it('reports syntax errors with the part and position, and nothing else', () => {
    const result = compile(doc({ system: 'ok', prompt: 'line\n{{#if x}}never closed', values: {} }));
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({ rule: 'syntax', part: 'prompt', loc: { line: 2, column: 1 } });
    expect(result.diagnostics[0]!.message).toMatch(/^Prompt line 2, column 1:/);
  });

  it('flags an empty prompt', () => {
    expect(rules(doc({ prompt: '{{#if topic}}x{{/if}}', values: {}, variables: [] }))).toEqual(['empty-prompt']);
  });

  it('flags leftover placeholders once each', () => {
    const d = doc({ prompt: 'Write about [insert topic here]. TODO: tone. Also [insert topic here]. {{topic}}' });
    const found = compile(d).diagnostics.filter((x) => x.rule === 'leftover-placeholder');
    expect(found.map((x) => x.message)).toEqual([
      expect.stringContaining('[insert topic here]'),
      expect.stringContaining('TODO'),
    ]);
  });

  it('does not mistake ordinary words for placeholders', () => {
    expect(rules(doc({ prompt: 'Insert the key into your lock. Todos are fine. {{topic}}' }))).toEqual([]);
  });

  it('flags long prompts as info', () => {
    const result = compile(doc({ values: { topic: 'x'.repeat(30_000) } }));
    expect(result.diagnostics.map((d) => [d.rule, d.severity])).toEqual([['long-prompt', 'info']]);
    expect(result.ready).toBe(true);
  });

  it('coerces values to the current variable type', () => {
    const result = compile(
      doc({
        prompt: '{{n}} {{choice}} {{#if flag}}F{{/if}}',
        variables: [
          { name: 'n', label: 'N', type: 'number', min: 1, max: 10 },
          { name: 'choice', label: 'Choice', type: 'select', options: ['a', 'b'] },
          { name: 'flag', label: 'Flag', type: 'boolean' },
        ],
        values: { n: '99', choice: 'z', flag: 'true' },
      }),
    );
    expect(result.values).toEqual({ n: 10, flag: true });
    expect(result.prompt.text).toBe('10  F');
  });

  it('counts words, characters and estimated tokens across both parts', () => {
    const result = compile(doc({ system: 'Be brief.' }));
    expect(result.stats).toEqual({ words: 5, characters: 'Be brief.\n\nWrite about tides.'.length, tokens: 3 + 5 });
  });
});
