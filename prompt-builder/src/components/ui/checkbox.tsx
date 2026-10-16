import * as React from 'react';
import { cn } from '@/lib/utils';

/** A native checkbox: free keyboard and form semantics, themed via accent-color. */
export const Checkbox = React.forwardRef<HTMLInputElement, Omit<React.ComponentProps<'input'>, 'type'>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'border-input accent-primary focus-visible:ring-ring size-4 shrink-0 rounded focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  ),
);
Checkbox.displayName = 'Checkbox';
