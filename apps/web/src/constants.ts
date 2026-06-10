

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
} from './components/icons/ModuleIcons';
import {
    CommunityServiceIcon,
    ResearchIcon,
    InnovationIcon,
    LeadershipProjectIcon,
    EnvironmentalIcon,
    EducationalIcon,
    CulturalIcon,
} from './components/icons/ProjectIcons';
import type { Role } from './types';

export const SIDEBAR_MODULES: any[] = [
    { key: 'dashboard', icon: DashboardIcon },
    { key: 'bousala', icon: BousalaIcon },
    { key: 'stakeholder_management', icon: HrIcon },
    { key: 'donors', icon: DonorIcon },
    { key: 'institutional_donors', icon: DonorIcon },
    { key: 'beneficiaries', icon: BeneficiaryIcon },
    { key: 'projects', icon: ProjectIcon },
    { key: 'financials', icon: FinancialsIcon },
    { key: 'implementing_partners', icon: PartnerIcon },
    { key: 'staff', icon: StaffIcon },
    { key: 'help', icon: HelpSupportIcon },
    { key: 'settings', icon: SettingsIcon },
];

// Platform console is not in SIDEBAR_MODULES — it's injected conditionally for super admins.
export const PLATFORM_MODULE = { key: 'platform', icon: PlatformIcon };

export const SIDEBAR_MODULES_FOR_PERMISSIONS = SIDEBAR_MODULES.filter(m => !['settings', 'help'].includes(m.key));


export const USER_ROLES: Role[] = ['Admin', 'Manager', 'Staff', 'Volunteer'];


export const EVENT_TYPES = [
    { id: 'lecture', color: 'blue' },
    { id: 'course', color: 'indigo' },
    { id: 'camp', color: 'teal' },
    { id: 'workshop', color: 'purple' },
    { id: 'activity', color: 'orange' },
    { id: 'ceremony', color: 'pink' },
    { id: 'meeting', color: 'gray' },
    { id: 'event', color: 'red' },
];

export const PROJECT_CATEGORIES = [
    { id: 'community-service', icon: CommunityServiceIcon },
    { id: 'research', icon: ResearchIcon },
    { id: 'innovation', icon: InnovationIcon },
    { id: 'leadership', icon: LeadershipProjectIcon },
    { id: 'environmental', icon: EnvironmentalIcon },
    { id: 'educational', icon: EducationalIcon },
    { id: 'cultural', icon: CulturalIcon },
] as const;

export const PROJECT_STATUSES = ['active', 'completed', 'planned', 'on-hold'] as const;