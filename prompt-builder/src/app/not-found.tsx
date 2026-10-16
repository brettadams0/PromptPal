import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-start py-24">
      <p className="text-primary text-sm font-medium">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">This page doesn’t exist.</h1>
      <p className="text-muted-foreground mt-3">The builder and templates are still where you left them.</p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/builder">Open the builder</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
