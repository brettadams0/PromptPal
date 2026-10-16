'use client';

import { AlertCircle, AlertTriangle, Check, CheckCircle2, Copy, Info, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCopy } from '@/hooks/use-copy';
import type { CompiledPrompt } from '@/lib/compile';
import type { Segment } from '@/lib/engine';
import {
  API_FORMATS,
  DEFAULT_MODEL,
  EXPORT_FORMATS,
  EXPORT_LABELS,
  exportPrompt,
  MODELS,
  type ExportFormat,
  type ModelId,
} from '@/lib/export';
import type { Diagnostic, Severity } from '@/lib/lint';
import { cn } from '@/lib/utils';

function Rendered({ segments, labels }: { segments: Segment[]; labels: ReadonlyMap<string, string> }) {
  return (
    <>
      {segments.map((segment, i) => {
        if (segment.kind === 'text') return <span key={i}>{segment.text}</span>;
        if (segment.text === '') {
          return (
            <span
              key={i}
              className="bg-hole text-hole-foreground rounded px-1 font-sans text-xs font-medium"
              title="Empty field"
            >
              {labels.get(segment.name) ?? segment.name}
            </span>
          );
        }
        return (
          <mark
            key={i}
            className="bg-value rounded-sm text-inherit"
            title={`From “${labels.get(segment.name) ?? segment.name}”`}
          >
            {segment.text}
          </mark>
        );
      })}
    </>
  );
}

function Preview({ compiled }: { compiled: CompiledPrompt }) {
  const labels = new Map(compiled.variables.map((v) => [v.name, v.label]));
  const empty = compiled.system.segments.length === 0 && compiled.prompt.segments.length === 0;

  if (empty) {
    return <p className="text-muted-foreground p-4 text-sm">The rendered prompt appears here.</p>;
  }
  return (
    <div className="grid gap-4 p-4 font-mono text-[13px] leading-relaxed">
      {compiled.system.segments.length > 0 && (
        <section aria-label="Rendered system prompt">
          <h3 className="text-muted-foreground mb-1 font-sans text-xs font-medium tracking-wide uppercase">System</h3>
          <div className="break-words whitespace-pre-wrap">
            <Rendered segments={compiled.system.segments} labels={labels} />
          </div>
        </section>
      )}
      <section aria-label="Rendered prompt">
        {compiled.system.segments.length > 0 && (
          <h3 className="text-muted-foreground mb-1 font-sans text-xs font-medium tracking-wide uppercase">Prompt</h3>
        )}
        <div className="break-words whitespace-pre-wrap" data-testid="preview-prompt">
          <Rendered segments={compiled.prompt.segments} labels={labels} />
        </div>
      </section>
    </div>
  );
}

const SEVERITY: Record<Severity, { icon: typeof Info; className: string; label: string }> = {
  error: { icon: AlertCircle, className: 'text-danger', label: 'Error' },
  warning: { icon: AlertTriangle, className: 'text-warning', label: 'Warning' },
  info: { icon: Info, className: 'text-info', label: 'Note' },
};

function Diagnostics({ diagnostics, onSelect }: { diagnostics: Diagnostic[]; onSelect: (d: Diagnostic) => void }) {
  if (diagnostics.length === 0) {
    return (
      <p className="text-success flex items-center gap-2 text-sm" data-testid="lint-ok">
        <CheckCircle2 className="size-4" aria-hidden />
        No issues found.
      </p>
    );
  }
  return (
    <ul className="grid gap-1" aria-label="Issues">
      {diagnostics.map((d, i) => {
        const { icon: Icon, className, label } = SEVERITY[d.severity];
        const actionable = d.loc !== undefined || d.variable !== undefined;
        const body = (
          <>
            <Icon className={cn('mt-0.5 size-4 shrink-0', className)} aria-hidden />
            <span>
              <span className="sr-only">{label}: </span>
              {d.message}
            </span>
          </>
        );
        return (
          <li key={`${d.rule}-${i}`}>
            {actionable ? (
              <button
                type="button"
                onClick={() => onSelect(d)}
                className="hover:bg-accent focus-visible:ring-ring flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:outline-none"
              >
                {body}
              </button>
            ) : (
              <div className="flex items-start gap-2 px-2 py-1.5 text-sm">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function CopyButton({ text, label = 'Copy', className }: { text: string; label?: string; className?: string }) {
  const [state, copy] = useCopy();
  return (
    <Button variant="outline" size="sm" className={className} onClick={() => copy(text)}>
      {state === 'copied' ? <Check aria-hidden /> : state === 'failed' ? <X aria-hidden /> : <Copy aria-hidden />}
      {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}
    </Button>
  );
}

function Export({ compiled }: { compiled: CompiledPrompt }) {
  const [format, setFormat] = useState<ExportFormat>('text');
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const output = exportPrompt(format, { system: compiled.system.text, prompt: compiled.prompt.text, model });

  return (
    <div className="grid gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Export format" className="flex flex-wrap gap-1">
          {EXPORT_FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={format === f}
              onClick={() => setFormat(f)}
              className={cn(
                'focus-visible:ring-ring rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                format === f
                  ? 'border-primary bg-value text-value-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {EXPORT_LABELS[f]}
            </button>
          ))}
        </div>
        {API_FORMATS.has(format) && (
          <Select value={model} onValueChange={(v) => setModel(v as ModelId)}>
            <SelectTrigger className="h-8 w-auto gap-2 text-xs" aria-label="Model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <CopyButton text={output} className="ml-auto" />
      </div>
      <pre
        className="bg-code max-h-[28rem] overflow-auto rounded-md border p-3 font-mono text-xs leading-relaxed"
        data-testid="export-output"
        tabIndex={0}
        aria-label={`${EXPORT_LABELS[format]} export`}
      >
        {output}
      </pre>
      {API_FORMATS.has(format) && (
        <p className="text-muted-foreground text-xs">
          Reads your key from <code className="font-mono">ANTHROPIC_API_KEY</code>. Nothing is sent from this page.
        </p>
      )}
    </div>
  );
}

interface OutputPanelProps {
  compiled: CompiledPrompt;
  onSelectDiagnostic: (d: Diagnostic) => void;
}

export function OutputPanel({ compiled, onSelectDiagnostic }: OutputPanelProps) {
  const { stats, diagnostics } = compiled;
  const errors = diagnostics.filter((d) => d.severity === 'error').length;
  const warnings = diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <div className="grid gap-4">
      <Tabs defaultValue="preview" className="bg-card rounded-xl border">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          <CopyButton
            text={[compiled.system.text, compiled.prompt.text].filter(Boolean).join('\n\n')}
            label="Copy prompt"
          />
        </div>
        <TabsContent value="preview">
          <Preview compiled={compiled} />
        </TabsContent>
        <TabsContent value="export">
          <Export compiled={compiled} />
        </TabsContent>
        <p className="text-muted-foreground border-t px-4 py-2 text-xs" aria-label="Prompt size">
          {stats.words.toLocaleString('en-US')} words · {stats.characters.toLocaleString('en-US')} characters ·{' '}
          <span title="Estimated at four characters per token; exact counts need the tokenizer">
            ≈{stats.tokens.toLocaleString('en-US')} tokens
          </span>
        </p>
      </Tabs>

      <section aria-labelledby="checks-heading" className="bg-card rounded-xl border p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="checks-heading" className="text-sm font-medium">
            Checks
          </h2>
          <span className="text-muted-foreground text-xs" aria-live="polite">
            {errors === 0 && warnings === 0
              ? 'Ready'
              : [
                  errors && `${errors} error${errors > 1 ? 's' : ''}`,
                  warnings && `${warnings} warning${warnings > 1 ? 's' : ''}`,
                ]
                  .filter(Boolean)
                  .join(', ')}
          </span>
        </div>
        <Diagnostics diagnostics={diagnostics} onSelect={onSelectDiagnostic} />
      </section>
    </div>
  );
}
