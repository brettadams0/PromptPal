import { z } from 'zod';
import { promptDocumentSchema, type PromptDocument } from './schema';

/**
 * Saved prompts live in localStorage, behind a versioned key and a schema.
 * Entries that fail validation — hand-edited, or written by an older shape —
 * are dropped individually instead of throwing away the whole library.
 */

export const STORAGE_KEY = 'promptpal:saved:v1';
export const MAX_SAVED = 200;

export const savedPromptSchema = z.object({
  id: z.string().min(1).max(64),
  savedAt: z.string().datetime(),
  doc: promptDocumentSchema,
});
export type SavedPrompt = z.infer<typeof savedPromptSchema>;

export function parseLibrary(raw: string | null): SavedPrompt[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data.flatMap((entry) => {
    const parsed = savedPromptSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Inserts or replaces by id, newest first, capped at MAX_SAVED. */
export function upsert(library: readonly SavedPrompt[], entry: SavedPrompt): SavedPrompt[] {
  return [entry, ...library.filter((e) => e.id !== entry.id)].slice(0, MAX_SAVED);
}

export function remove(library: readonly SavedPrompt[], id: string): SavedPrompt[] {
  return library.filter((e) => e.id !== id);
}

export function newId(): string {
  return crypto.randomUUID();
}

export function makeEntry(doc: PromptDocument, id: string = newId(), now: Date = new Date()): SavedPrompt {
  return { id, savedAt: now.toISOString(), doc };
}

// --- A tiny external store, so every component reading the library stays in
// sync, including across tabs via the `storage` event. -----------------------

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: { raw: string | null; value: SavedPrompt[] } | null = null;
const EMPTY: SavedPrompt[] = [];

function read(): SavedPrompt[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be disabled (private mode, blocked cookies): behave as empty.
  }
  if (cache?.raw !== raw) cache = { raw, value: parseLibrary(raw) };
  return cache.value;
}

export const libraryStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  },
  getSnapshot: read,
  getServerSnapshot: (): SavedPrompt[] => EMPTY,
  write(next: SavedPrompt[]): boolean {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      return false;
    }
    listeners.forEach((l) => l());
    return true;
  },
};
