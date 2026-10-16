'use client';

import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CATEGORIES, type Category, type PromptTemplate } from '@/lib/schema';
import { CATEGORY_META } from '@/lib/templates';
import { cn } from '@/lib/utils';

function matches(template: PromptTemplate, query: string): boolean {
  if (!query) return true;
  const haystack = [template.name, template.description, ...template.tags, CATEGORY_META[template.category].label]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

export function TemplateBrowser({ templates }: { templates: PromptTemplate[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const deferredQuery = useDeferredValue(query.trim());

  const visible = useMemo(
    () => templates.filter((t) => (!category || t.category === category) && matches(t, deferredQuery)),
    [templates, category, deferredQuery],
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Search templates"
            placeholder="Search templates"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1.5">
          {[null, ...CATEGORIES].map((c) => (
            <button
              key={c ?? 'all'}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                'focus-visible:ring-ring rounded-full border px-3 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none',
                category === c
                  ? 'border-primary bg-value text-value-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {c ? CATEGORY_META[c].label : 'All'}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length} template{visible.length === 1 ? '' : 's'} shown
      </p>

      {visible.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No templates match.{' '}
          <Link href="/builder?template=blank" className="text-foreground underline underline-offset-4">
            Start from a blank one
          </Link>
          .
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => {
            const required = t.variables.filter((v) => v.required).length;
            return (
              <li key={t.id}>
                <Link
                  href={`/builder?template=${t.id}`}
                  className="group bg-card hover:border-primary/60 focus-visible:ring-ring flex h-full flex-col rounded-xl border p-5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Badge>{CATEGORY_META[t.category].label}</Badge>
                    <ArrowRight
                      className="text-muted-foreground group-hover:text-foreground size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </div>
                  <h2 className="font-semibold">{t.name}</h2>
                  <p className="text-muted-foreground mt-1 flex-1 text-sm">{t.description}</p>
                  <p className="text-muted-foreground mt-4 text-xs">
                    {t.variables.length} fields{required > 0 && ` · ${required} required`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
