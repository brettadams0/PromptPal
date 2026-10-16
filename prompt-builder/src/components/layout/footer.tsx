import { SITE } from '@/lib/site';

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container-page text-muted-foreground flex flex-col gap-2 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          Built by{' '}
          <a href={SITE.authorUrl} className="text-foreground font-medium underline-offset-4 hover:underline">
            {SITE.author}
          </a>
          . Nothing you type leaves your browser.
        </p>
        <p>
          <a href={SITE.repo} className="underline-offset-4 hover:underline">
            Source on GitHub
          </a>{' '}
          · MIT licensed
        </p>
      </div>
    </footer>
  );
}
