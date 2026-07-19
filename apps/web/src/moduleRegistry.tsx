import React, { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ModuleKey, OrgModule } from '@gms/shared';
import { LOCKED_MODULE_KEYS, MODULE_KEYS } from '@gms/shared';
import {
    DashboardIcon,
    DonorIcon,
    ProjectIcon,
    BeneficiaryIcon,
    SettingsIcon,
    HrIcon,
    HelpSupportIcon,
    BousalaIcon,
    FinancialsIcon,
    StaffIcon,
    PlatformIcon,
    PartnerIcon,
    GrcIcon,
    GRIReportingIcon,
    ShariaComplianceIcon,
    ShariaBoardIcon,
    DigitalMarketingIcon,
    AiIcon,
} from './components/icons/ModuleIcons';

export interface ModuleSubmenuEntry {
    key: string;
}

export interface ModuleRegistryEntry {
    key: ModuleKey;
    icon: React.FC;
    locked: boolean;
    submenu?: ModuleSubmenuEntry[];
    component: LazyExoticComponent<ComponentType<any>>;
}

const lazyPage = (loader: () => Promise<{ default: ComponentType<any> }>) => lazy(loader);

export const MODULE_REGISTRY: ModuleRegistryEntry[] = [
    { key: 'dashboard', icon: DashboardIcon, locked: true, component: lazyPage(() => import('./components/pages/Dashboard')) },
    { key: 'bousala', icon: BousalaIcon, locked: false, component: lazyPage(() => import('./components/pages/BousalaPage')) },
    { key: 'stakeholder_management', icon: HrIcon, locked: false, component: lazyPage(() => import('./components/pages/StakeholderManagement')) },
    { key: 'donors', icon: DonorIcon, locked: false, component: lazyPage(() => import('./components/pages/DonorManagement')) },
    { key: 'institutional_donors', icon: DonorIcon, locked: false, component: lazyPage(() => import('./components/pages/InstitutionalDonors')) },
    { key: 'beneficiaries', icon: BeneficiaryIcon, locked: false, component: lazyPage(() => import('./components/pages/BeneficiariesModule')) },
    { key: 'projects', icon: ProjectIcon, locked: false, component: lazyPage(() => import('./components/pages/ProjectManagement')) },
    { key: 'financials', icon: FinancialsIcon, locked: false, component: lazyPage(() => import('./components/pages/FinancialsPage')) },
    { key: 'implementing_partners', icon: PartnerIcon, locked: false, component: lazyPage(() => import('./components/pages/ImplementingPartnersPage')) },
    { key: 'grc', icon: GrcIcon, locked: false, component: lazyPage(() => import('./components/pages/GrcPage')) },
    { key: 'gri_reporting', icon: GRIReportingIcon, locked: false, component: lazyPage(() => import('./components/pages/GRIReportingPage')) },
    { key: 'sharia_compliance', icon: ShariaComplianceIcon, locked: false, component: lazyPage(() => import('./components/pages/ShariaCompliancePage')) },
    { key: 'sharia_board', icon: ShariaBoardIcon, locked: false, component: lazyPage(() => import('./components/pages/ShariaBoardManagementPage')) },
    { key: 'digital_marketing', icon: DigitalMarketingIcon, locked: false, component: lazyPage(() => import('./components/pages/DigitalMarketing')) },
    { key: 'ai_automation', icon: AiIcon, locked: false, component: lazyPage(() => import('./components/pages/AiAutomation')) },
    { key: 'staff', icon: StaffIcon, locked: false, component: lazyPage(() => import('./components/pages/StaffPage')) },
    { key: 'help', icon: HelpSupportIcon, locked: true, component: lazyPage(() => import('./components/pages/HelpSupportPage')) },
    { key: 'settings', icon: SettingsIcon, locked: true, component: lazyPage(() => import('./components/pages/SettingsPage')) },
];

export const PLATFORM_MODULE = {
    key: 'platform' as const,
    icon: PlatformIcon,
    component: lazyPage(() => import('./components/pages/PlatformPage')),
};

export const PLACEHOLDER_MODULE = lazyPage(() => import('./components/pages/PlaceholderPage'));

const registryByKey = new Map(MODULE_REGISTRY.map((entry) => [entry.key, entry]));

export function getRegistryEntry(key: string): ModuleRegistryEntry | undefined {
    return registryByKey.get(key as ModuleKey);
}

export function getRegistryIcon(key: string): React.FC {
    if (key === PLATFORM_MODULE.key) return PLATFORM_MODULE.icon;
    return getRegistryEntry(key)?.icon ?? DashboardIcon;
}

/** Sidebar-shaped list for legacy consumers (permissions UI, placeholder page). */
export const SIDEBAR_MODULES_FROM_REGISTRY = MODULE_REGISTRY.map(({ key, icon, submenu }) => ({
    key,
    icon,
    submenu,
}));

export const SIDEBAR_MODULES_FOR_PERMISSIONS = SIDEBAR_MODULES_FROM_REGISTRY.filter(
    (m) => !['settings', 'help'].includes(m.key),
);

export function buildSidebarModulesFromOrg(
    orgModules: OrgModule[],
): { key: string; icon: React.FC; submenu?: ModuleSubmenuEntry[] }[] {
    const enabled = new Set(
        orgModules.filter((m) => m.enabled).map((m) => m.name),
    );

    return MODULE_REGISTRY.filter((entry) => enabled.has(entry.key))
        .sort((a, b) => {
            const orderA = orgModules.find((m) => m.name === a.key)?.sort_order ?? 0;
            const orderB = orgModules.find((m) => m.name === b.key)?.sort_order ?? 0;
            return orderA - orderB;
        })
        .map(({ key, icon, submenu }) => ({ key, icon, submenu }));
}

export function isOrgModuleAccessible(
    key: string,
    orgModules: OrgModule[] | undefined,
    canRead: (module: string) => boolean,
): boolean {
    if (key === PLATFORM_MODULE.key) return true;
    if (key === 'help') return true;

    const row = orgModules?.find((m) => m.name === key);
    if (row && !row.enabled) return false;

    if ((MODULE_KEYS as readonly string[]).includes(key)) {
        return canRead(key);
    }

    return false;
}

export function resolveModuleLabel(
    key: string,
    orgModules: OrgModule[] | undefined,
    language: 'en' | 'ar',
    fallback: (moduleKey: string) => string,
): string {
    const row = orgModules?.find((m) => m.name === key);
    if (row) {
        const override = language === 'ar' ? row.label_ar : row.label_en;
        if (override?.trim()) return override.trim();
    }
    return fallback(key);
}

export function isLockedModuleKey(key: string): boolean {
    return (LOCKED_MODULE_KEYS as readonly string[]).includes(key);
}
