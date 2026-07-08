/**
 * Canonical module keys for the per-org page registry.
 * Keys match frontend sidebar / RBAC module keys.
 */
export const MODULE_KEYS = [
    'dashboard',
    'bousala',
    'stakeholder_management',
    'donors',
    'institutional_donors',
    'beneficiaries',
    'projects',
    'financials',
    'implementing_partners',
    'grc',
    'gri_reporting',
    'compliance',
    'sharia_compliance',
    'sharia_board',
    'staff',
    'help',
    'settings',
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

/**
 * Default sidebar order for orgs.
 * Grouped as overview -> strategy -> program delivery -> fundraising/relationships
 * -> governance -> administration.
 */
export const DEFAULT_MODULE_ORDER: readonly ModuleKey[] = [
    'dashboard',
    'bousala',
    'projects',
    'beneficiaries',
    'implementing_partners',
    'donors',
    'institutional_donors',
    'stakeholder_management',
    'financials',
    'grc',
    'gri_reporting',
    'sharia_compliance',
    'sharia_board',
    'staff',
    'help',
    'settings',
];

/** System pages that cannot be disabled per org. */
export const LOCKED_MODULE_KEYS: readonly ModuleKey[] = ['dashboard', 'settings', 'help'];

/** Legacy DB names → canonical keys (one-time migration). */
export const LEGACY_MODULE_NAME_MAP: Record<string, ModuleKey> = {
    stakeholders: 'stakeholder_management',
    hr: 'staff',
    finance: 'financials',
};

export function isModuleKey(value: string): value is ModuleKey {
    return (MODULE_KEYS as readonly string[]).includes(value);
}

export function normalizeModuleName(name: string): ModuleKey | null {
    const mapped = LEGACY_MODULE_NAME_MAP[name] ?? name;
    return isModuleKey(mapped) ? mapped : null;
}

/** Modules enabled by default when a new org is created. */
export const DEFAULT_ENABLED_MODULE_KEYS: readonly ModuleKey[] = [
    'dashboard',
    'bousala',
    'stakeholder_management',
    'donors',
    'institutional_donors',
    'beneficiaries',
    'projects',
    'financials',
    'implementing_partners',
    'grc',
    'gri_reporting',
    'sharia_compliance',
    'sharia_board',
    'staff',
    'help',
    'settings',
];
