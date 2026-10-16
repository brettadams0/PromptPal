import { ArrowRight, Braces, FileCode2, ListChecks, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { compile } from '@/lib/compile';
import type { PromptDocument } from '@/lib/schema';
import { SITE } from '@/lib/site';
import { TEMPLATES } from '@/lib/templates';
import { cn } from '@/lib/utils';

/** The hero example, compiled by the real engine at build time. */
const DEMO: PromptDocument = {
  name: 'Demo',
  category: 'writing',
  system: '',
  prompt: `Summarize this for {{audience}}.

<document>
{{document}}
</document>
{{#if focus}}
Prioritise anything about {{focus}}.
{{/if}}
Start with a one-line takeaway.`,
  variables: [
    { name: 'audience', label: 'Audience', type: 'text', required: true },
    { name: 'document', label: 'Document', type: 'textarea', required: true },
    { name: 'focus', label: 'Focus', type: 'text' },
  ],
  values: {
    audience: 'the on-call engineer',
    document: 'Postmortem: [insert timeline]…',
    focus: '',
  },
};

const FEATURES = [
  {
    icon: Braces,
    title: 'A real template language',
    body: 'Fields, {{#if}} sections and comments, parsed into a syntax tree. Mistakes are reported by line and column, and clicking one takes you there.',
  },
  {
    icon: ListChecks,
    title: 'Checks before you paste',
    body: 'Empty required fields, variables the template never uses, and leftover “[insert …]” text the model would take literally.',
  },
  {
    icon: FileCode2,
    title: 'Straight to the API',
    body: 'Copy plain text, or export a ready-to-run Messages API call as JSON, cURL, Python or TypeScript, with escaping that can’t break.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by construction',
    body: 'There is no backend. Saved prompts stay in your browser; share links live in the URL fragment, which browsers never send to a server.',
  },
];

function Highlighted({ source }: { source: string }) {
  return (
    <>
      {source.split(/(\{\{[^}]*\}\})/).map((part, i) =>
        part.startsWith('{{') ? (
          <span
            key={i}
            className={cn(
              part.startsWith('{{#') || part.startsWith('{{/') ? 'text-info' : 'text-value-foreground',
              'font-medium',
            )}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function Demo() {
  const compiled = compile(DEMO);
  const warning = compiled.diagnostics.find((d) => d.severity === 'warning');
  return (
    <div
      className="bg-card overflow-hidden rounded-xl border shadow-sm"
      aria-label="Example: a template, its output and a check"
    >
      <div className="text-muted-foreground border-b px-4 py-2 text-xs font-medium">Template</div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">
        <Highlighted source={DEMO.prompt} />
      </pre>
      <div className="text-muted-foreground border-y px-4 py-2 text-xs font-medium">Output</div>
      <pre className="px-4 py-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">
        {compiled.prompt.segments.map((s, i) =>
          s.kind === 'value' ? (
            <mark key={i} className="bg-value rounded-sm text-inherit">
              {s.text}
            </mark>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </pre>
      {warning && (
        <p className="bg-muted/50 flex items-start gap-2 border-t px-4 py-2.5 text-xs">
          <span className="text-warning font-semibold">Warning</span>
          <span className="text-muted-foreground">{warning.message}</span>
        </p>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div>
          <p className="text-primary mb-4 text-sm font-medium">Open source · runs in your browser</p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Prompt templates that behave like code.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl text-lg">
            Write a prompt once with typed fields and optional sections. {SITE.name} fills it in, checks it for the
            mistakes that quietly ruin answers, and exports a ready-to-run Claude API call.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/builder">
                Open the builder <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/templates">Browse templates</Link>
            </Button>
          </div>
        </div>
        <Demo />
      </section>

      <section className="bg-muted/30 border-t" aria-labelledby="features-heading">
        <div className="container-page py-16">
          <h2 id="features-heading" className="sr-only">
            Features
          </h2>
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Icon className="text-primary size-5" aria-hidden />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-16" aria-labelledby="start-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="start-heading" className="text-2xl font-semibold tracking-tight">
            Start from a template
          </h2>
          <Link
            href="/templates"
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            All {TEMPLATES.length} templates
          </Link>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.slice(0, 6).map((t) => (
            <li key={t.id}>
              <Link
                href={`/builder?template=${t.id}`}
                className="hover:border-primary/60 focus-visible:ring-ring block rounded-lg border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="font-medium">{t.name}</span>
                <span className="text-muted-foreground mt-1 block text-sm">{t.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
