import * as React from 'react';
import { cn } from '@/lib/utils';

export function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'bg-muted text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[0.7rem] font-medium',
        className,
      )}
      {...props}
    />
  );
}
