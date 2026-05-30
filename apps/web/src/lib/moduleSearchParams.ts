/** Query keys used by useTabParam across modules (shared `tab` is per-module). */
export const MODULE_SEARCH_PARAM_KEYS = [
  'tab',
  'highlight',
  'projectTab',
  'detailTab',
  'registryView',
  'usersTab',
  'documentsTab',
] as const;

/** Which search params each sidebar module may keep in the URL. */
export const MODULE_ALLOWED_SEARCH_PARAMS: Record<string, readonly string[]> = {
  financials: ['tab', 'highlight'],
  projects: ['tab', 'projectTab'],
  donors: ['tab', 'detailTab', 'registryView', 'highlight'],
  institutional_donors: ['tab'],
  beneficiaries: ['tab', 'highlight'],
  stakeholder_management: ['tab'],
  bousala: ['tab'],
  settings: ['tab', 'usersTab', 'documentsTab'],
  dashboard: [],
  help: [],
};

/** Valid values for `tab` per module (drop stale `tab` from another module). */
export const MODULE_TAB_VALUES: Record<string, readonly string[]> = {
  financials: ['overview', 'transactions', 'disbursements', 'approvals'],
  projects: ['list', 'sdg'],
  donors: ['registry', 'analytics'],
  institutional_donors: ['list', 'card', 'map', 'opportunities'],
  beneficiaries: ['overview', 'academics', 'sponsorship', 'aid_log', 'needs_assessment', 'documents', 'guardian'],
  stakeholder_management: ['table', 'card', 'matrix'],
  bousala: ['dashboard', 'predictive'],
  settings: [
    'organization',
    'users',
    'translations',
    'financials',
    'hr',
    'projects',
    'documents',
    'system',
    'reporting',
    'notifications',
    'advanced',
  ],
};

export function pruneSearchParamsForModule(
  params: URLSearchParams,
  module: string,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const allowed = new Set(MODULE_ALLOWED_SEARCH_PARAMS[module] ?? []);

  for (const key of MODULE_SEARCH_PARAM_KEYS) {
    if (!allowed.has(key)) {
      next.delete(key);
    }
  }

  const tab = next.get('tab');
  const validTabs = MODULE_TAB_VALUES[module];
  if (tab && validTabs && !validTabs.includes(tab)) {
    next.delete('tab');
  }

  return next;
}
