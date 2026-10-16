'use client';

import { Github } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SITE } from '@/lib/site';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

const NAV = [
  { href: '/builder', label: 'Builder' },
  { href: '/templates', label: 'Templates' },
  { href: '/library', label: 'Saved' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container-page flex h-14 items-center gap-2 sm:gap-6">
        <Link
          href="/"
          className="focus-visible:ring-ring flex items-center gap-2 rounded-md font-semibold focus-visible:ring-2 focus-visible:outline-none"
        >
          <Logo className="size-7" />
          <span className="hidden sm:inline">{SITE.name}</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'hover:text-foreground focus-visible:ring-ring rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                  active ? 'bg-accent text-foreground' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <a href={SITE.repo} target="_blank" rel="noreferrer" aria-label="Source code on GitHub">
              <Github />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
