import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

function isValidTab<T extends string>(value: string, validTabs: readonly T[]): value is T {
  return (validTabs as readonly string[]).includes(value);
}

export function useTabParam<T extends string>(
  paramName: string,
  defaultTab: T,
  validTabs: readonly T[],
): [T, (tab: T) => void] {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = useMemo(() => {
    const raw = searchParams.get(paramName);
    if (raw !== null && isValidTab(raw, validTabs)) {
      return raw;
    }
    return defaultTab;
  }, [searchParams, paramName, defaultTab, validTabs]);

  const setTab = useCallback(
    (tab: T) => {
      const next = new URLSearchParams(searchParams);
      next.set(paramName, tab);
      const search = next.toString();
      navigate(
        {
          pathname: location.pathname,
          search: search ? `?${search}` : '',
          hash: location.hash,
        },
        { replace: true },
      );
    },
    [navigate, location.pathname, location.hash, searchParams, paramName],
  );

  return [activeTab, setTab];
}
