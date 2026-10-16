import { describe, expect, it } from 'vitest';
import { analyze, parse, render, renderSegments, type TemplateNode } from '.';

function nodes(source: string): TemplateNode[] {
  const result = parse(source);
  if (!result.ok) throw result.error;
  return result.nodes;
}

const run = (source: string, values: Record<string, string | number | boolean> = {}) => render(nodes(source), values);

function errorOf(source: string) {
  const result = parse(source);
  if (result.ok) throw new Error(`expected a syntax error for ${JSON.stringify(source)}`);
  return result.error;
}

describe('interpolation', () => {
  it('substitutes variables and tolerates inner whitespace', () => {
    expect(run('Hello {{name}}, meet {{ other }}.', { name: 'Ada', other: 'Alan' })).toBe('Hello Ada, meet Alan.');
  });

  it('renders unset variables as empty and trims values', () => {
    expect(run('[{{a}}]', {})).toBe('[]');
    expect(run('[{{a}}]', { a: '  padded  ' })).toBe('[padded]');
  });

  it('formats numbers and booleans', () => {
    expect(run('{{n}} {{b}}', { n: 3, b: true })).toBe('3 yes');
    expect(run('[{{b}}]', { b: false })).toBe('[]');
  });

  it('keeps an escaped \\{{ literal', () => {
    expect(run('Use \\{{name}} syntax for {{x}}', { x: 'y' })).toBe('Use {{name}} syntax for y');
  });

  it('strips comments', () => {
    expect(run('a{{! note to self }}b')).toBe('ab');
  });
});

describe('conditionals', () => {
  const source = '{{#if tone}}Tone: {{tone}}{{else}}Any tone{{/if}}';

  it('picks the consequent when the variable is set', () => {
    expect(run(source, { tone: 'warm' })).toBe('Tone: warm');
  });

  it('treats empty and whitespace-only strings as unset', () => {
    expect(run(source, { tone: '' })).toBe('Any tone');
    expect(run(source, { tone: '   ' })).toBe('Any tone');
  });

  it('supports #unless', () => {
    expect(run('{{#unless done}}todo{{/unless}}', { done: false })).toBe('todo');
    expect(run('{{#unless done}}todo{{/unless}}', { done: true })).toBe('');
  });

  it('nests', () => {
    const src = '{{#if a}}A{{#if b}}B{{else}}-{{/if}}{{/if}}';
    expect(run(src, { a: 'x', b: 'y' })).toBe('AB');
    expect(run(src, { a: 'x' })).toBe('A-');
    expect(run(src, { b: 'y' })).toBe('');
  });

  it('counts 0 as set, since a slider at zero is a real choice', () => {
    expect(run('{{#if n}}n={{n}}{{/if}}', { n: 0 })).toBe('n=0');
  });
});

describe('whitespace', () => {
  it('removes lines holding only a block tag (standalone tags)', () => {
    const src = 'Intro\n{{#if ctx}}\nContext: {{ctx}}\n{{/if}}\nOutro';
    expect(run(src, { ctx: 'c' })).toBe('Intro\nContext: c\nOutro');
    expect(run(src, {})).toBe('Intro\nOutro');
  });

  it('treats indented block tags as standalone too', () => {
    expect(run('a\n  {{#if x}}\n  b\n  {{/if}}\nc', { x: '1' })).toBe('a\n  b\nc');
  });

  it('does not treat a block tag sharing a line with text as standalone', () => {
    expect(run('a {{#if x}}b{{/if}}\nc', { x: '1' })).toBe('a b\nc');
  });

  it('does not treat a block tag sharing a line with a variable as standalone', () => {
    expect(run('{{v}} {{#if x}}\nb\n{{/if}}', { v: 'V', x: '1' })).toBe('V \nb');
  });

  it('collapses runs of blank lines left by skipped sections', () => {
    const src = 'One\n\n{{#if a}}A\n\n{{/if}}{{#if b}}B\n\n{{/if}}\n\nTwo';
    expect(run(src, {})).toBe('One\n\nTwo');
  });

  it('caps newline runs that span an empty value', () => {
    expect(run('One\n\n{{empty}}\n\nTwo')).toBe('One\n\nTwo');
  });

  it('trims the whole output', () => {
    expect(run('\n\n  Hello  \n\n')).toBe('Hello');
  });

  it('preserves newlines inside values', () => {
    expect(run('Code:\n{{code}}\nEnd', { code: 'a\n\n\n\nb' })).toBe('Code:\na\n\n\n\nb\nEnd');
  });
});

describe('segments', () => {
  it('marks which spans came from which variable', () => {
    const segments = renderSegments(nodes('Hi {{name}}!'), { name: 'Ada' });
    expect(segments).toEqual([
      { kind: 'text', text: 'Hi ' },
      { kind: 'value', name: 'name', text: 'Ada' },
      { kind: 'text', text: '!' },
    ]);
  });

  it('keeps empty value segments so the preview can show a placeholder', () => {
    const segments = renderSegments(nodes('Hi {{name}}!'), {});
    expect(segments[1]).toEqual({ kind: 'value', name: 'name', text: '' });
  });
});

describe('syntax errors', () => {
  it('reports an unclosed tag with line and column', () => {
    const error = errorOf('line one\n  hello {{name');
    expect(error.message).toMatch(/Unclosed tag/);
    expect(error.loc).toMatchObject({ line: 2, column: 9 });
  });

  it('reports a tag that opens inside another tag', () => {
    expect(errorOf('{{a {{b}}').message).toMatch(/Unclosed tag/);
  });

  it('reports an unclosed block at its opening tag', () => {
    const error = errorOf('a\n{{#if x}}\nb');
    expect(error.message).toMatch(/never closed/);
    expect(error.loc.line).toBe(2);
  });

  it('reports mismatched closing tags and names the opener', () => {
    const error = errorOf('{{#if x}}\n{{/unless}}');
    expect(error.message).toMatch(/Expected \{\{\/if\}\} to close \{\{#if x\}\} from line 1/);
    expect(error.loc.line).toBe(2);
  });

  it('rejects stray else and close tags', () => {
    expect(errorOf('{{else}}').message).toMatch(/must be inside/);
    expect(errorOf('{{/if}}').message).toMatch(/no matching/);
  });

  it('rejects a second else', () => {
    expect(errorOf('{{#if a}}1{{else}}2{{else}}3{{/if}}').message).toMatch(/already has an \{\{else\}\}/);
  });

  it('rejects unknown block helpers with a hint', () => {
    expect(errorOf('{{#each items}}{{/each}}').message).toMatch(/Supported blocks are #if and #unless/);
  });

  it('rejects invalid variable names', () => {
    expect(errorOf('{{first name}}').message).toMatch(/not a valid variable name/);
    expect(errorOf('{{1st}}').message).toMatch(/not a valid variable name/);
    expect(errorOf('{{}}').message).toMatch(/Empty tag/);
    expect(errorOf('{{#if}}{{/if}}').message).toMatch(/needs a variable name/);
    expect(errorOf('{{#if a b}}{{/if}}').message).toMatch(/single variable name/);
  });

  it('reports the full span of the offending tag', () => {
    const error = errorOf('ab{{bad name}}');
    expect(error.loc).toMatchObject({ offset: 2, length: 12, line: 1, column: 3 });
  });
});

describe('analyze', () => {
  it('lists variables in order of first appearance with how they are used', () => {
    const usage = analyze(nodes('{{#if ctx}}{{ctx}}{{/if}} {{topic}} {{#unless brief}}long{{/unless}} {{topic}}'));
    expect(usage.map((u) => [u.name, u.interpolated, u.conditional])).toEqual([
      ['ctx', true, true],
      ['topic', true, false],
      ['brief', false, true],
    ]);
  });

  it('finds variables inside else branches', () => {
    expect(analyze(nodes('{{#if a}}{{else}}{{b}}{{/if}}')).map((u) => u.name)).toEqual(['a', 'b']);
  });
});
