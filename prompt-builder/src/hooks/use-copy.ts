'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'failed';

/** Clipboard write with a short-lived confirmation state for the button that triggered it. */
export function useCopy(resetAfterMs = 2000) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      let next: CopyState = 'copied';
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        next = 'failed';
      }
      setState(next);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setState('idle'), resetAfterMs);
      return next === 'copied';
    },
    [resetAfterMs],
  );

  return [state, copy] as const;
}
