import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { OPTIMISTIC_HIGHLIGHT_MS } from '../lib/optimisticSubmit';

export const HIGHLIGHT_ROW_CLASS =
  'bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-inset ring-emerald-200/80 dark:ring-emerald-800/60';

export const HIGHLIGHT_CARD_CLASS =
  'ring-2 ring-inset ring-emerald-300 dark:ring-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/30';

export function useUrlHighlight(paramName = 'highlight') {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const consumedRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const flashHighlight = useCallback((id: string) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedId(id);
    highlightTimerRef.current = setTimeout(() => setHighlightedId(null), OPTIMISTIC_HIGHLIGHT_MS);

    requestAnimationFrame(() => {
      document.querySelector(`[data-highlight-id="${id}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, []);

  const clearHighlightParam = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (!next.has(paramName)) return;
    next.delete(paramName);
    const search = next.toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash },
      { replace: true },
    );
  }, [navigate, location.pathname, location.hash, searchParams, paramName]);

  const consumeHighlightParam = useCallback(
    (resolveId: (rawId: string) => string | null | undefined) => {
      const raw = searchParams.get(paramName);
      if (!raw || consumedRef.current === raw) return;

      const resolved = resolveId(raw);
      if (!resolved) return;

      consumedRef.current = raw;
      flashHighlight(resolved);
      clearHighlightParam();
    },
    [searchParams, paramName, flashHighlight, clearHighlightParam],
  );

  return { highlightedId, flashHighlight, consumeHighlightParam };
}
