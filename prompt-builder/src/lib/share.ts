import { z } from 'zod';
import { promptDocumentSchema, valuesSchema, type PromptDocument, type Values } from './schema';
import { getTemplate, templateToDocument } from './templates';

/**
 * Share links carry the whole document in the URL fragment (`#p=…`).
 * Fragments are never sent to a server, so a shared prompt — which may well
 * contain someone's code or email — exists only in the link itself.
 *
 * When the document is an untouched library template, only its id and the
 * filled-in values are encoded, which keeps the common case short.
 */

const linkSchema = z.discriminatedUnion('k', [
  z.object({
    v: z.literal(1),
    k: z.literal('t'),
    id: z.string(),
    values: valuesSchema,
    name: z.string().max(200).optional(),
  }),
  z.object({ v: z.literal(1), k: z.literal('d'), doc: promptDocumentSchema }),
]);
type Link = z.infer<typeof linkSchema>;

export const SHARE_PARAM = 'p';

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function sameTemplate(doc: PromptDocument): boolean {
  if (!doc.templateId) return false;
  const template = getTemplate(doc.templateId);
  if (!template) return false;
  return (
    template.system === doc.system &&
    template.prompt === doc.prompt &&
    template.category === doc.category &&
    JSON.stringify(template.variables) === JSON.stringify(doc.variables)
  );
}

/** Only the values that differ from the template's defaults need to travel. */
function changedValues(doc: PromptDocument, defaults: Values): Values {
  const changed: Values = {};
  for (const [key, value] of Object.entries(doc.values)) {
    if (defaults[key] !== value) changed[key] = value;
  }
  return changed;
}

export function encodeDocument(doc: PromptDocument): string {
  const template = doc.templateId ? getTemplate(doc.templateId) : undefined;
  const link: Link =
    template && sameTemplate(doc)
      ? {
          v: 1,
          k: 't',
          id: template.id,
          values: changedValues(doc, templateToDocument(template).values),
          ...(doc.name !== template.name ? { name: doc.name } : {}),
        }
      : { v: 1, k: 'd', doc };
  return toBase64Url(JSON.stringify(link));
}

export type DecodeResult = { ok: true; doc: PromptDocument } | { ok: false; reason: string };

export function decodeDocument(encoded: string): DecodeResult {
  let raw: unknown;
  try {
    raw = JSON.parse(fromBase64Url(encoded));
  } catch {
    return { ok: false, reason: 'The link is truncated or corrupted.' };
  }
  const parsed = linkSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, reason: 'The link is not a PromptPal prompt, or was made by a newer version.' };

  const link = parsed.data;
  if (link.k === 'd') return { ok: true, doc: link.doc };

  const template = getTemplate(link.id);
  if (!template) return { ok: false, reason: `The template “${link.id}” no longer exists.` };
  const doc = templateToDocument(template);
  return {
    ok: true,
    doc: { ...doc, ...(link.name ? { name: link.name } : {}), values: { ...doc.values, ...link.values } },
  };
}

/** Reads a document from a location hash like `#p=…`, if there is one. */
export function readHash(hash: string): DecodeResult | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const encoded = params.get(SHARE_PARAM);
  return encoded ? decodeDocument(encoded) : null;
}

export function shareUrl(origin: string, doc: PromptDocument): string {
  return `${origin}/builder#${SHARE_PARAM}=${encodeDocument(doc)}`;
}
