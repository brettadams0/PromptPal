'use client';

import { BookmarkCheck, BookmarkPlus, FilePlus2, Link2, RotateCcw, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCopy } from '@/hooks/use-copy';
import { useLibrary } from '@/hooks/use-library';
import { compile } from '@/lib/compile';
import type { Diagnostic } from '@/lib/lint';
import { readHash, shareUrl } from '@/lib/share';
import { libraryStore } from '@/lib/storage';
import { BLANK_TEMPLATE, CATEGORY_META, DEFAULT_TEMPLATE_ID, getTemplate, templateToDocument } from '@/lib/templates';
import { OutputPanel } from './output-panel';
import { builderReducer, initialState, isTemplateModified, snapshot, type BuilderState } from './state';
import { TemplateEditor, type TemplateEditorHandle } from './template-editor';
import { fieldId, VariableForm } from './variable-form';

type Tab = 'fill' | 'template';
type Notice = { tone: 'error' | 'info'; text: string };

/**
 * Where the builder starts, in priority order: a share link in the URL
 * fragment, a saved entry (?saved=id), a library template (?template=id),
 * then the default template. The builder only renders in the browser (see
 * builder-loader.tsx), so this can read the fragment and storage directly
 * and the first paint is already the right document.
 *
 * Query parameters come from useSearchParams, not window.location: on a
 * client-side navigation the builder can render before the router has
 * committed the new URL, and window.location would still be the old page.
 * The fragment is safe to read directly because share links always arrive by
 * full page load.
 */
function resolveInitial(params: URLSearchParams): { state: BuilderState; notice: Notice | null; fromHash: boolean } {
  const fallback = (templateId: string | null) =>
    templateToDocument(getTemplate(templateId ?? DEFAULT_TEMPLATE_ID) ?? getTemplate(DEFAULT_TEMPLATE_ID)!);

  const fromHash = readHash(window.location.hash);
  if (fromHash) {
    return fromHash.ok
      ? {
          state: initialState(fromHash.doc),
          notice: { tone: 'info', text: 'Opened from a shared link.' },
          fromHash: true,
        }
      : {
          state: initialState(fallback(null)),
          notice: { tone: 'error', text: `Couldn’t open that link: ${fromHash.reason}` },
          fromHash: true,
        };
  }

  const savedId = params.get('saved');
  if (savedId) {
    const entry = libraryStore.getSnapshot().find((e) => e.id === savedId);
    return entry
      ? { state: initialState(entry.doc, entry.id), notice: null, fromHash: false }
      : {
          state: initialState(fallback(null)),
          notice: { tone: 'error', text: 'That saved prompt no longer exists.' },
          fromHash: false,
        };
  }

  return { state: initialState(fallback(params.get('template'))), notice: null, fromHash: false };
}

export function Builder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initial] = useState(() => resolveInitial(new URLSearchParams(searchParams.toString())));
  const [state, dispatch] = useReducer(builderReducer, initial.state);
  const { doc } = state;
  const [tab, setTab] = useState<Tab>(doc.prompt === '' ? 'template' : 'fill');
  const [notice, setNotice] = useState<Notice | null>(initial.notice);
  const editor = useRef<TemplateEditorHandle>(null);
  const { save } = useLibrary();
  const [linkState, copyLink] = useCopy();

  useEffect(() => {
    // A share-link fragment would go stale with the first edit; drop it.
    if (initial.fromHash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [initial.fromHash]);

  const compiled = useMemo(() => compile(doc), [doc]);
  const invalid = useMemo(
    () => new Set(compiled.diagnostics.flatMap((d) => (d.rule === 'required-empty' && d.variable ? [d.variable] : []))),
    [compiled.diagnostics],
  );

  const dirty = state.savedSnapshot !== snapshot(doc);
  const modified = isTemplateModified(doc);
  const template = doc.templateId ? getTemplate(doc.templateId) : undefined;

  const onSave = useCallback(() => {
    const entry = save(doc, state.savedId ?? undefined);
    if (entry) dispatch({ type: 'saved', id: entry.id });
    else setNotice({ tone: 'error', text: 'Couldn’t save: browser storage is unavailable or full.' });
  }, [doc, save, state.savedId]);

  const onCopyLink = useCallback(() => copyLink(shareUrl(window.location.origin, doc)), [copyLink, doc]);

  const onSelectDiagnostic = useCallback((d: Diagnostic) => {
    if (d.loc && d.part) {
      const { part, loc } = d;
      setTab('template');
      // Wait for the tab panel to mount before focusing inside it.
      requestAnimationFrame(() => editor.current?.reveal(part, loc));
    } else if (d.variable) {
      setTab('fill');
      requestAnimationFrame(() => document.getElementById(fieldId(d.variable!))?.focus());
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSave]);

  const startBlank = () => {
    dispatch({ type: 'load', doc: templateToDocument(BLANK_TEMPLATE) });
    setTab('template');
    router.replace('/builder?template=blank', { scroll: false });
  };

  return (
    <div className="container-page py-6 lg:py-8">
      {notice && (
        <div
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`mb-4 flex items-center justify-between gap-4 rounded-lg border px-4 py-2 text-sm ${notice.tone === 'error' ? 'border-danger/40 text-danger' : 'text-muted-foreground'}`}
        >
          {notice.text}
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <label htmlFor="prompt-name" className="sr-only">
            Prompt name
          </label>
          <input
            id="prompt-name"
            value={doc.name}
            onChange={(e) => dispatch({ type: 'rename', name: e.target.value })}
            className="focus-visible:ring-ring w-full truncate rounded-md bg-transparent text-2xl font-semibold tracking-tight outline-none focus-visible:ring-2"
          />
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
            <Badge>{CATEGORY_META[doc.category].label}</Badge>
            {template ? (
              <span>
                From the{' '}
                <Link href="/templates" className="hover:text-foreground underline underline-offset-4">
                  {template.name}
                </Link>{' '}
                template
                {modified && ' · edited'}
              </span>
            ) : (
              <span>Custom template</span>
            )}
            {state.savedId && <span>· {dirty ? 'Unsaved changes' : 'Saved'}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {modified && (
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'revert-template' })}>
              <Undo2 aria-hidden /> Revert template
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'clear-values' })}>
            <RotateCcw aria-hidden /> Reset fields
          </Button>
          <Button variant="outline" size="sm" onClick={startBlank}>
            <FilePlus2 aria-hidden /> New
          </Button>
          <Button variant="outline" size="sm" onClick={onCopyLink}>
            <Link2 aria-hidden />{' '}
            {linkState === 'copied' ? 'Link copied' : linkState === 'failed' ? 'Copy failed' : 'Share link'}
          </Button>
          <Button size="sm" onClick={onSave} disabled={state.savedId !== null && !dirty} title="Save (Ctrl/⌘ S)">
            {state.savedId !== null && !dirty ? <BookmarkCheck aria-hidden /> : <BookmarkPlus aria-hidden />}
            {state.savedId !== null && !dirty ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="bg-card rounded-xl border">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
            <TabsList aria-label="Edit mode">
              <TabsTrigger value="fill">Fill in</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
            </TabsList>
            <span className="text-muted-foreground hidden text-xs sm:inline">
              <Kbd>Ctrl</Kbd> <Kbd>S</Kbd> to save
            </span>
          </div>
          <TabsContent value="fill" className="p-4">
            <VariableForm
              variables={compiled.variables}
              values={doc.values}
              invalid={invalid}
              onChange={(name, value) => dispatch({ type: 'set-value', name, value })}
            />
          </TabsContent>
          <TabsContent value="template" className="p-4" forceMount hidden={tab !== 'template'}>
            <TemplateEditor
              ref={editor}
              doc={doc}
              variables={compiled.variables}
              unused={compiled.unused}
              onSource={(part, text) => dispatch({ type: 'set-source', part, text })}
              onDeclare={(variable) => dispatch({ type: 'declare', variable })}
              onUndeclare={(name) => dispatch({ type: 'undeclare', name })}
            />
          </TabsContent>
        </Tabs>

        <div className="lg:sticky lg:top-20">
          <OutputPanel compiled={compiled} onSelectDiagnostic={onSelectDiagnostic} />
        </div>
      </div>
    </div>
  );
}
