import { z } from 'zod/v4';

// Org-scoped roles. A staff member holds exactly one of these per organization.
export const ORG_ROLES = ['admin', 'manager', 'accountant', 'staff', 'viewer'] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const orgRoleSchema = z.enum(ORG_ROLES);

// Modules that can be permission-gated. Keys match the frontend sidebar/module keys.
export const RBAC_MODULES = [
    'dashboard',
    'donors',
    'institutional_donors',
    'projects',
    'beneficiaries',
    'stakeholder_management',
    'bousala',
    'financials',
    'implementing_partners',
    'grc',
    'gri_reporting',
    'compliance',
    'sharia_compliance',
    'sharia_board',
    'digital_marketing',
    'ai_automation',
    'staff',
    'settings',
] as const;
export type RbacModule = (typeof RBAC_MODULES)[number];

export type AccessLevel = 'none' | 'read' | 'write';
export type PermissionAction = 'read' | 'write';

// Single source of truth for the fixed-role permission matrix.
// 'write' implies 'read'. 'staff' and 'settings' are admin-only.
export const ROLE_PERMISSIONS: Record<OrgRole, Record<RbacModule, AccessLevel>> = {
    admin: {
        dashboard: 'write',
        donors: 'write',
        institutional_donors: 'write',
        projects: 'write',
        beneficiaries: 'write',
        stakeholder_management: 'write',
        bousala: 'write',
        financials: 'write',
        implementing_partners: 'write',
        grc: 'write',
        gri_reporting: 'write',
        compliance: 'write',
        sharia_compliance: 'write',
        sharia_board: 'write',
        digital_marketing: 'write',
        ai_automation: 'write',
        staff: 'write',
        settings: 'write',
    },
    manager: {
        dashboard: 'write',
        donors: 'write',
        institutional_donors: 'write',
        projects: 'write',
        beneficiaries: 'write',
        stakeholder_management: 'write',
        bousala: 'write',
        financials: 'read',
        implementing_partners: 'write',
        grc: 'write',
        gri_reporting: 'write',
        compliance: 'write',
        sharia_compliance: 'write',
        sharia_board: 'write',
        digital_marketing: 'write',
        ai_automation: 'write',
        staff: 'none',
        settings: 'none',
    },
    accountant: {
        dashboard: 'write',
        donors: 'read',
        institutional_donors: 'read',
        projects: 'read',
        beneficiaries: 'read',
        stakeholder_management: 'read',
        bousala: 'read',
        financials: 'write',
        implementing_partners: 'read',
        grc: 'read',
        gri_reporting: 'read',
        compliance: 'write',
        sharia_compliance: 'read',
        sharia_board: 'read',
        digital_marketing: 'read',
        ai_automation: 'read',
        staff: 'none',
        settings: 'none',
    },
    staff: {
        dashboard: 'read',
        donors: 'write',
        institutional_donors: 'write',
        projects: 'write',
        beneficiaries: 'write',
        stakeholder_management: 'write',
        bousala: 'read',
        financials: 'none',
        implementing_partners: 'write',
        grc: 'read',
        gri_reporting: 'read',
        compliance: 'read',
        sharia_compliance: 'read',
        sharia_board: 'read',
        digital_marketing: 'write',
        ai_automation: 'read',
        staff: 'none',
        settings: 'none',
    },
    viewer: {
        dashboard: 'read',
        donors: 'read',
        institutional_donors: 'read',
        projects: 'read',
        beneficiaries: 'read',
        stakeholder_management: 'read',
        bousala: 'read',
        financials: 'read',
        implementing_partners: 'read',
        grc: 'read',
        gri_reporting: 'read',
        compliance: 'read',
        sharia_compliance: 'read',
        sharia_board: 'read',
        digital_marketing: 'read',
        ai_automation: 'read',
        staff: 'none',
        settings: 'none',
    },
};

const ACCESS_RANK: Record<AccessLevel, number> = { none: 0, read: 1, write: 2 };

/**
 * Returns true if the given role is allowed to perform `action` on `module`.
 * `write` access implies `read` access.
 */
export function can(role: OrgRole, module: RbacModule, action: PermissionAction): boolean {
    const granted = ROLE_PERMISSIONS[role]?.[module] ?? 'none';
    return ACCESS_RANK[granted] >= ACCESS_RANK[action];
}

// Human-readable role labels are handled via i18n on the frontend (keys: roles.<role>).
