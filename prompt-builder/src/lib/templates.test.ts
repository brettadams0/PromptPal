import { describe, expect, it } from 'vitest';
import { compile } from './compile';
import { analyze, mergeUsages, parse } from './engine';
import { promptDocumentSchema } from './schema';
import { getTemplate, TEMPLATES, templateToDocument } from './templates';

/** Holds every built-in template to the conventions documented in templates.ts. */
describe.each(TEMPLATES)('template $id', (template) => {
  const usages = () => {
    const system = parse(template.system);
    const prompt = parse(template.prompt);
    if (!system.ok) throw system.error;
    if (!prompt.ok) throw prompt.error;
    return mergeUsages(analyze(system.nodes), analyze(prompt.nodes));
  };

  it('parses', () => {
    expect(usages).not.toThrow();
  });

  it('declares exactly the variables it uses', () => {
    const used = usages()
      .map((u) => u.name)
      .sort();
    const declared = template.variables.map((v) => v.name).sort();
    expect(used).toEqual(declared);
  });

  it('produces a valid document', () => {
    expect(promptDocumentSchema.safeParse(templateToDocument(template)).success).toBe(true);
  });

  it('only fails lint on required fields when freshly opened', () => {
    const { diagnostics } = compile(templateToDocument(template));
    expect(diagnostics.filter((d) => d.rule !== 'required-empty')).toEqual([]);
  });

  it('lints clean once required fields are filled', () => {
    const doc = templateToDocument(template);
    for (const v of template.variables) if (v.required) doc.values[v.name] = 'filled';
    expect(compile(doc).diagnostics).toEqual([]);
  });

  it('has defaults inside its select options and number bounds', () => {
    for (const v of template.variables) {
      if (v.type === 'select') expect(v.options).toContain(v.defaultValue);
      if (v.type === 'number' && typeof v.defaultValue === 'number') {
        expect(v.defaultValue).toBeGreaterThanOrEqual(v.min!);
        expect(v.defaultValue).toBeLessThanOrEqual(v.max!);
      }
    }
  });
});

describe('template catalogue', () => {
  it('has unique ids and resolves them', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(getTemplate(id)?.id).toBe(id);
    expect(getTemplate('missing')).toBeUndefined();
  });
});
