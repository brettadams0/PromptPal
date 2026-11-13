import { describe, expect, it } from 'vitest';
import { compile } from './compile';
import { EXAMPLES, exampleFor } from './examples';
import { TEMPLATES, templateToDocument } from './templates';

describe('template examples', () => {
  it('has an example for exactly the built-in templates', () => {
    expect(Object.keys(EXAMPLES).sort()).toEqual(TEMPLATES.map((t) => t.id).sort());
  });

  describe.each(TEMPLATES)('$id', (template) => {
    const example = EXAMPLES[template.id] ?? {};

    it('fills every required field, and only declared fields', () => {
      const declared = new Set(template.variables.map((v) => v.name));
      for (const v of template.variables) if (v.required) expect(example, v.name).toHaveProperty(v.name);
      for (const name of Object.keys(example)) expect(declared.has(name), name).toBe(true);
    });

    it('lints clean once applied', () => {
      const doc = templateToDocument(template);
      doc.values = { ...doc.values, ...example };
      expect(compile(doc).diagnostics).toEqual([]);
    });

    it('is found from a document opened from the template', () => {
      expect(exampleFor(templateToDocument(template))).toBe(EXAMPLES[template.id]);
    });
  });

  it('has no example for a custom document', () => {
    const doc = templateToDocument(TEMPLATES[0]!);
    expect(exampleFor({ ...doc, templateId: undefined })).toBeUndefined();
  });
});
