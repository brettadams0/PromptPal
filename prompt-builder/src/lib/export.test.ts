import { describe, expect, it } from 'vitest';
import { exportPrompt, heredocDelimiter, requestBody, type ExportInput } from './export';

const input: ExportInput = {
  system: 'You are terse.',
  prompt: 'Say "hi" to $USER and `whoami`\nthen \\ stop.',
  model: 'claude-opus-5-5',
};

describe('exportPrompt', () => {
  it('joins system and prompt for plain text, and omits an empty system', () => {
    expect(exportPrompt('text', input)).toBe(`${input.system}\n\n${input.prompt}`);
    expect(exportPrompt('text', { ...input, system: '' })).toBe(input.prompt);
  });

  it('labels the parts in Markdown only when there is a system prompt', () => {
    expect(exportPrompt('markdown', input)).toMatch(/^## System\n\nYou are terse\.\n\n## Prompt\n\n/);
    expect(exportPrompt('markdown', { ...input, system: '' })).toBe(input.prompt);
  });

  it('produces a valid Messages API body', () => {
    expect(JSON.parse(exportPrompt('json', input))).toEqual({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      system: 'You are terse.',
      messages: [{ role: 'user', content: input.prompt }],
    });
    expect(requestBody({ ...input, system: '' })).not.toHaveProperty('system');
  });

  it('builds a cURL command whose quoted heredoc carries the body verbatim', () => {
    const out = exportPrompt('curl', input);
    expect(out).toContain('-H "anthropic-version: 2023-06-01"');
    expect(out).toContain('-H "x-api-key: $ANTHROPIC_API_KEY"');
    const [, body] = /<<'JSON'\n([\s\S]*)\nJSON$/.exec(out)!;
    expect(JSON.parse(body!)).toEqual(requestBody(input));
  });

  it('picks a heredoc delimiter that cannot end the body early', () => {
    expect(heredocDelimiter('a\nb')).toBe('JSON');
    expect(heredocDelimiter('JSON\nJSON_2\nx')).toBe('JSON_3');
    expect(heredocDelimiter('  JSON')).toBe('JSON');
  });

  it('escapes prompts safely inside Python and TypeScript literals', () => {
    for (const format of ['python', 'typescript'] as const) {
      const out = exportPrompt(format, input);
      expect(out).toContain(JSON.stringify(input.prompt));
      expect(out).toContain(JSON.stringify(input.system));
      expect(out).toContain('"claude-opus-5-5"');
    }
    expect(exportPrompt('python', { ...input, system: '' })).not.toContain('system=');
    expect(exportPrompt('typescript', { ...input, system: '' })).not.toContain('system:');
  });

  it('prints only text blocks, since responses can start with a thinking block', () => {
    expect(exportPrompt('python', input)).toContain('if block.type == "text":');
    expect(exportPrompt('typescript', input)).toContain("if (block.type === 'text')");
  });
});
