'use client';

import dynamic from 'next/dynamic';

/**
 * The builder's starting document can come from the URL fragment or
 * localStorage, neither of which exists on the server. Rendering it only in
 * the browser means the first paint is the right document, instead of the
 * default template flashing before a shared link replaces it.
 */
export const BuilderLoader = dynamic(() => import('./builder').then((m) => m.Builder), {
  ssr: false,
  loading: () => (
    <div className="container-page py-8" aria-busy="true">
      <div className="bg-muted h-8 w-64 animate-pulse rounded-md" />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="bg-muted h-96 animate-pulse rounded-xl" />
        <div className="bg-muted h-96 animate-pulse rounded-xl" />
      </div>
      <span className="sr-only">Loading the builder…</span>
    </div>
  ),
});
