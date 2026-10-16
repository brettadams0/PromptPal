import type { Metadata } from 'next';
import { TemplateBrowser } from '@/components/templates/template-browser';
import { TEMPLATES } from '@/lib/templates';

export const metadata: Metadata = {
  title: 'Templates',
  description: 'Prompt templates for code review, debugging, summaries, email and more.',
};

export default function TemplatesPage() {
  return (
    <div className="container-page py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Templates</h1>
        <p className="text-muted-foreground mt-2">
          Each one is a starting point: open it, fill in the fields, and edit the template itself if it doesn’t quite
          fit.
        </p>
      </header>
      <TemplateBrowser templates={TEMPLATES} />
    </div>
  );
}
