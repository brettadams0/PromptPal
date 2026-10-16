'use client';

import { Download, FolderOpen, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, useSyncExternalStore } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLibrary } from '@/hooks/use-library';
import { libraryStore, MAX_SAVED, parseLibrary, upsert } from '@/lib/storage';
import { CATEGORY_META } from '@/lib/templates';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** False during prerender and the first client render, true after hydration. */
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function SavedList() {
  const { library, remove } = useLibrary();
  const hydrated = useHydrated();
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(library, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'promptpal-library.json' });
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File) => {
    const entries = parseLibrary(await file.text());
    if (entries.length === 0) {
      setStatus('No valid prompts found in that file.');
      return;
    }
    let next = libraryStore.getSnapshot();
    for (const entry of [...entries].reverse()) next = upsert(next, entry);
    setStatus(
      libraryStore.write(next)
        ? `Imported ${entries.length} prompt${entries.length === 1 ? '' : 's'}.`
        : 'Import failed: storage is unavailable.',
    );
  };

  if (!hydrated) {
    return <p className="text-muted-foreground text-sm">Loading saved prompts…</p>;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={exportAll} disabled={library.length === 0}>
          <Download aria-hidden /> Export JSON
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
          <Upload aria-hidden /> Import JSON
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importFile(file);
            e.target.value = '';
          }}
        />
        <span className="text-muted-foreground text-sm" role="status">
          {status}
        </span>
        <span className="text-muted-foreground ml-auto text-xs">
          {library.length} of {MAX_SAVED}
        </span>
      </div>

      {library.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">Nothing saved yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Save a prompt from the builder and it shows up here. It stays in this browser only.
          </p>
          <Button asChild className="mt-4">
            <Link href="/templates">Pick a template</Link>
          </Button>
        </div>
      ) : (
        <ul className="bg-card divide-y rounded-xl border">
          {library.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{entry.doc.name || 'Untitled prompt'}</p>
                <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <Badge>{CATEGORY_META[entry.doc.category].label}</Badge>
                  <time dateTime={entry.savedAt}>Saved {dateFormat.format(new Date(entry.savedAt))}</time>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/builder?saved=${entry.id}`}>
                    <FolderOpen aria-hidden /> Open
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${entry.doc.name || 'untitled prompt'}`}
                  onClick={() => remove(entry.id)}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
