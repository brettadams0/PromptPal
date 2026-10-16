import { describe, expect, it } from 'vitest';
import { makeEntry, MAX_SAVED, parseLibrary, remove, upsert } from './storage';
import { getTemplate, templateToDocument } from './templates';

const doc = templateToDocument(getTemplate('brainstorm')!);
const at = new Date('2026-01-02T03:04:05.000Z');

describe('saved prompt library', () => {
  it('parses what it writes', () => {
    const library = [makeEntry(doc, 'a', at)];
    expect(parseLibrary(JSON.stringify(library))).toEqual(library);
  });

  it('treats missing, malformed and non-array storage as empty', () => {
    expect(parseLibrary(null)).toEqual([]);
    expect(parseLibrary('{nope')).toEqual([]);
    expect(parseLibrary('{"a":1}')).toEqual([]);
  });

  it('drops invalid entries individually instead of losing the library', () => {
    const good = makeEntry(doc, 'good', at);
    const raw = JSON.stringify([good, { id: 'bad', savedAt: 'yesterday', doc }, 42]);
    expect(parseLibrary(raw)).toEqual([good]);
  });

  it('upserts newest first, replacing by id, and caps the size', () => {
    const a = makeEntry(doc, 'a', at);
    const b = makeEntry(doc, 'b', at);
    const a2 = makeEntry({ ...doc, name: 'renamed' }, 'a', at);
    expect(upsert(upsert(upsert([], a), b), a2).map((e) => [e.id, e.doc.name])).toEqual([
      ['a', 'renamed'],
      ['b', doc.name],
    ]);
    const full = Array.from({ length: MAX_SAVED }, (_, i) => makeEntry(doc, `id${i}`, at));
    expect(upsert(full, makeEntry(doc, 'new', at))).toHaveLength(MAX_SAVED);
    expect(remove([a, b], 'a')).toEqual([b]);
  });
});
