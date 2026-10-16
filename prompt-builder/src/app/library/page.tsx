import type { Metadata } from 'next';
import { SavedList } from '@/components/library/saved-list';

export const metadata: Metadata = {
  title: 'Saved prompts',
  description: 'Prompts you have saved in this browser.',
};

export default function LibraryPage() {
  return (
    <div className="container-page py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Saved prompts</h1>
        <p className="text-muted-foreground mt-2">
          Stored in this browser’s local storage — there is no account and no server. Export them to move between
          machines.
        </p>
      </header>
      <SavedList />
    </div>
  );
}
