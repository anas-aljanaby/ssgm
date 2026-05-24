import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

function isValidTab<T extends string>(value: string, validTabs: readonly T[]): value is T {
  return (validTabs as readonly string[]).includes(value);
}

export function useTabParam<T extends string>(
  paramName: string,
  defaultTab: T,
  validTabs: readonly T[],
): [T, (tab: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo(() => {
    const raw = searchParams.get(paramName);
    if (raw !== null && isValidTab(raw, validTabs)) {
      return raw;
    }
    return defaultTab;
  }, [searchParams, paramName, defaultTab, validTabs]);

  const setTab = useCallback(
    (tab: T) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(paramName, tab);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, paramName],
  );

  return [activeTab, setTab];
}
