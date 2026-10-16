'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { PromptDocument } from '@/lib/schema';
import { libraryStore, makeEntry, remove, upsert, type SavedPrompt } from '@/lib/storage';

export function useLibrary() {
  const library = useSyncExternalStore(
    libraryStore.subscribe,
    libraryStore.getSnapshot,
    libraryStore.getServerSnapshot,
  );

  const save = useCallback((doc: PromptDocument, id?: string): SavedPrompt | null => {
    const entry = makeEntry(doc, id);
    return libraryStore.write(upsert(libraryStore.getSnapshot(), entry)) ? entry : null;
  }, []);

  const removeEntry = useCallback((id: string) => {
    libraryStore.write(remove(libraryStore.getSnapshot(), id));
  }, []);

  return { library, save, remove: removeEntry };
}
