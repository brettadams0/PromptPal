import { describe, expect, it } from 'vitest';
import { decodeDocument, encodeDocument, readHash, shareUrl } from './share';
import type { PromptDocument } from './schema';
import { getTemplate, templateToDocument } from './templates';

const fromTemplate = (): PromptDocument => templateToDocument(getTemplate('code-review')!);

describe('share links', () => {
  it('round-trips an untouched template as a short id + values link', () => {
    const doc = { ...fromTemplate(), values: { ...fromTemplate().values, code: 'const x = 1;' } };
    const encoded = encodeDocument(doc);
    const full = encodeDocument({ ...doc, prompt: `${doc.prompt} ` });
    expect(encoded.length * 10).toBeLessThan(full.length);
    expect(decodeDocument(encoded)).toEqual({ ok: true, doc });
  });

  it('round-trips an edited document in full, including unicode', () => {
    const doc: PromptDocument = { ...fromTemplate(), name: 'Revisión 🚀', prompt: 'Écris sur {{code}} — 日本語' };
    expect(decodeDocument(encodeDocument(doc))).toEqual({ ok: true, doc });
  });

  it('round-trips a blank document with no template id', () => {
    const doc = templateToDocument(getTemplate('blank')!);
    expect(doc).not.toHaveProperty('templateId');
    expect(decodeDocument(encodeDocument(doc))).toEqual({ ok: true, doc });
  });

  it('produces URL-safe output', () => {
    expect(encodeDocument({ ...fromTemplate(), prompt: '???>>>~~~' })).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('rejects corrupted and foreign payloads without throwing', () => {
    expect(decodeDocument('not base64!!')).toMatchObject({ ok: false });
    expect(decodeDocument(btoa('{"hello":1}'))).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/not a PromptPal/),
    });
    const bad = btoa(JSON.stringify({ v: 1, k: 'd', doc: { ...fromTemplate(), values: { 'bad key': 'x' } } }));
    expect(decodeDocument(bad)).toMatchObject({ ok: false });
  });

  it('reports a template id that no longer exists', () => {
    const encoded = btoa(JSON.stringify({ v: 1, k: 't', id: 'gone', values: {} }));
    expect(decodeDocument(encoded)).toMatchObject({ ok: false, reason: expect.stringContaining('gone') });
  });

  it('reads documents from the hash and builds links under /builder', () => {
    const url = shareUrl('https://example.test', fromTemplate());
    expect(url.startsWith('https://example.test/builder#p=')).toBe(true);
    expect(readHash(new URL(url).hash)).toEqual({ ok: true, doc: fromTemplate() });
    expect(readHash('')).toBeNull();
    expect(readHash('#other=1')).toBeNull();
  });
});
