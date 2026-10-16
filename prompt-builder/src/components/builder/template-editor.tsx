'use client';

import { Trash2 } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { SourceLocation } from '@/lib/engine';
import type { PromptPart } from '@/lib/lint';
import { VARIABLE_TYPES, type PromptDocument, type VariableDef, type VariableType } from '@/lib/schema';
import type { ResolvedVariable } from '@/lib/variables';

const TYPE_LABELS: Record<VariableType, string> = {
  text: 'Short text',
  textarea: 'Long text',
  select: 'Choice',
  number: 'Number',
  boolean: 'Checkbox',
};

export interface TemplateEditorHandle {
  /** Focuses the given template and selects the span a diagnostic points at. */
  reveal: (part: PromptPart, loc: SourceLocation) => void;
}

interface TemplateEditorProps {
  doc: PromptDocument;
  variables: readonly ResolvedVariable[];
  unused: readonly VariableDef[];
  onSource: (part: PromptPart, text: string) => void;
  onDeclare: (variable: VariableDef) => void;
  onUndeclare: (name: string) => void;
}

const SOURCE_CLASS = 'resize-y font-mono text-[13px] leading-relaxed';

export const TemplateEditor = forwardRef<TemplateEditorHandle, TemplateEditorProps>(function TemplateEditor(
  { doc, variables, unused, onSource, onDeclare, onUndeclare },
  ref,
) {
  const system = useRef<HTMLTextAreaElement>(null);
  const prompt = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    reveal(part, loc) {
      const el = part === 'system' ? system.current : prompt.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(loc.offset, loc.offset + loc.length);
      // Scroll the selection into view: estimate its line's offset in the box.
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
      el.scrollTop = Math.max(0, (loc.line - 3) * lineHeight);
    },
  }));

  const update = (variable: ResolvedVariable, patch: Partial<VariableDef>) => {
    const next: VariableDef = { ...variable, ...patch };
    delete (next as Partial<ResolvedVariable>).inferred;
    if (next.type !== 'select') delete next.options;
    if (next.type === 'select' && !next.options) next.options = [];
    onDeclare(next);
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="source-system">System prompt</Label>
          <span className="text-muted-foreground text-xs">Optional. Sets the role and ground rules.</span>
        </div>
        <Textarea
          id="source-system"
          ref={system}
          rows={3}
          spellCheck={false}
          className={SOURCE_CLASS}
          value={doc.system}
          onChange={(e) => onSource('system', e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="source-prompt">Prompt</Label>
          <span className="text-muted-foreground text-xs">The user message.</span>
        </div>
        <Textarea
          id="source-prompt"
          ref={prompt}
          rows={14}
          spellCheck={false}
          className={SOURCE_CLASS}
          value={doc.prompt}
          onChange={(e) => onSource('prompt', e.target.value)}
        />
        <details className="group bg-muted/40 rounded-md border px-3 py-2 text-sm">
          <summary className="text-muted-foreground group-open:text-foreground cursor-pointer font-medium select-none">
            Template syntax
          </summary>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
            {[
              ['{{topic}}', 'Insert a field. New names become fields automatically.'],
              ['{{#if notes}}…{{/if}}', 'Include a section only when the field is filled in.'],
              ['{{#if x}}…{{else}}…{{/if}}', 'Choose between two versions.'],
              ['{{#unless x}}…{{/unless}}', 'Include a section only when the field is empty.'],
              ['{{! comment }}', 'A note to yourself, removed from the output.'],
              ['\\{{', 'A literal "{{".'],
            ].map(([code, text]) => (
              <div key={code} className="contents">
                <dt>
                  <code className="text-foreground font-mono">{code}</code>
                </dt>
                <dd className="text-muted-foreground">{text}</dd>
              </div>
            ))}
          </dl>
          <p className="text-muted-foreground mt-3 text-xs">
            A block tag alone on its line removes the whole line, so optional sections leave no blank gaps.
          </p>
        </details>
      </div>

      <section aria-labelledby="fields-heading" className="grid gap-3">
        <h3 id="fields-heading" className="text-sm font-medium">
          Fields
        </h3>
        {variables.length === 0 && unused.length === 0 && (
          <p className="text-muted-foreground text-sm">Fields appear here as you add placeholders to the template.</p>
        )}
        <ul className="grid gap-3">
          {variables.map((variable) => (
            <li key={variable.name} className="grid gap-3 rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-sm">{variable.name}</code>
                {variable.inferred && <Badge variant="outline">inferred</Badge>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor={`label-${variable.name}`} className="text-muted-foreground text-xs">
                    Label
                  </Label>
                  <Input
                    id={`label-${variable.name}`}
                    value={variable.label}
                    onChange={(e) => update(variable, { label: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`type-${variable.name}`} className="text-muted-foreground text-xs">
                    Type
                  </Label>
                  <Select
                    value={variable.type}
                    onValueChange={(type) => update(variable, { type: type as VariableType })}
                  >
                    <SelectTrigger id={`type-${variable.name}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VARIABLE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {variable.type === 'select' && (
                <div className="grid gap-1.5">
                  <Label htmlFor={`options-${variable.name}`} className="text-muted-foreground text-xs">
                    Choices, comma-separated
                  </Label>
                  <Input
                    id={`options-${variable.name}`}
                    defaultValue={(variable.options ?? []).join(', ')}
                    onBlur={(e) =>
                      update(variable, {
                        options: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={variable.required === true}
                  onChange={(e) => update(variable, { required: e.target.checked })}
                />
                Required
              </label>
            </li>
          ))}
        </ul>
        {unused.length > 0 && (
          <div className="grid gap-2">
            <p className="text-muted-foreground text-xs">Declared but not used in the template:</p>
            <ul className="flex flex-wrap gap-2">
              {unused.map((variable) => (
                <li key={variable.name}>
                  <Button variant="outline" size="sm" onClick={() => onUndeclare(variable.name)}>
                    <code className="font-mono">{variable.name}</code>
                    <Trash2 aria-hidden />
                    <span className="sr-only">Remove</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
});
