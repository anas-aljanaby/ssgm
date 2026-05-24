import React, { useMemo, useEffect } from 'react';
import { useTabParam } from '../../../hooks/useTabParam';
import type { Beneficiary, BeneficiaryType, Language, ProgramProject } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatCurrency, formatNumber } from '../../../lib/utils';
import { GraduationCapIcon, DollarSignCircleIcon, DocumentTextIcon } from '../../icons/UtilityIcons';
import Tabs from '../../common/Tabs';
import BeneficiaryStatusBadge from './BeneficiaryStatusBadge';
import OverviewTab from './tabs/OverviewTab';
import AidLogTab from './AidLogTab';
import NeedsAssessmentTab from './NeedsAssessmentTab';
import BeneficiaryDocumentsTab from './BeneficiaryDocumentsTab';
import AcademicsTab from './tabs/AcademicsTab';
import SponsorshipTab from './tabs/SponsorshipTab';
import GuardianTab from './tabs/GuardianTab';
import { ArrowLeft, Users, CheckCircle } from 'lucide-react';
import { getBeneficiarySubtitle } from './beneficiaryUtils';
import { getCountryDisplayName } from '../../../lib/countryOptions';

// =================================================================
// Tab configuration per beneficiary type
// =================================================================
const TAB_CONFIG: Record<BeneficiaryType, string[]> = {
    student: ['overview', 'academics', 'sponsorship', 'aid_log', 'needs_assessment', 'documents'],
    orphan: ['overview', 'guardian', 'sponsorship', 'aid_log', 'needs_assessment', 'documents'],
    hafiz: ['overview', 'sponsorship', 'aid_log', 'documents'],
    family: ['overview', 'aid_log', 'needs_assessment', 'documents'],
    institution: ['overview', 'aid_log', 'documents'],
    community: ['overview', 'aid_log', 'documents'],
};

// =================================================================
// KPI helpers
// =================================================================
const getKpis = (b: Beneficiary, t: (k: string, o?: any) => string, language: Language) => {
    const kpis: Array<{ label: string; value: string; icon: React.ReactNode }> = [];

    const p = b.profile;
    const aidLog = Array.isArray(b.aidLog) ? b.aidLog : [];
    const milestones = Array.isArray(b.milestones) ? b.milestones : [];
    const documents = Array.isArray(b.documents) ? b.documents : [];

    // Type-specific KPIs
    if (p.type === 'student' && p.academicInfo?.gpa) {
        kpis.push({ label: t('beneficiaries.kpi.gpa'), value: p.academicInfo.gpa.toFixed(2), icon: <GraduationCapIcon className="w-5 h-5" /> });
    }
    if (p.type === 'family' && p.memberCount) {
        kpis.push({ label: t('beneficiaries.kpi.members'), value: String(p.memberCount), icon: <Users className="w-5 h-5" /> });
    }
    if (p.type === 'orphan' && p.guardian) {
        kpis.push({ label: t('beneficiaries.kpi.guardian'), value: p.guardian.name, icon: <Users className="w-5 h-5" /> });
    }

    // Aid total (for all types)
    const aidTotal = aidLog
        .filter(a => a.status === 'Delivered' && a.type === 'financial')
        .reduce((sum, a) => sum + (a.value || 0), 0);
    if (aidTotal > 0) {
        kpis.push({ label: t('beneficiaries.kpi.aidReceived'), value: formatCurrency(aidTotal, language), icon: <DollarSignCircleIcon className="w-5 h-5" /> });
    }

    // Milestones
    if (milestones.length > 0) {
        const achieved = milestones.filter(m => m.status === 'achieved').length;
        kpis.push({ label: t('beneficiaries.kpi.milestones'), value: `${achieved}/${milestones.length}`, icon: <CheckCircle className="w-5 h-5" /> });
    }

    // Documents
    if (documents.length > 0) {
        kpis.push({ label: t('beneficiaries.kpi.documents'), value: formatNumber(documents.length, language), icon: <DocumentTextIcon className="w-5 h-5" /> });
    }

    return kpis;
};

// =================================================================
// Main component
// =================================================================
interface BeneficiaryDetailViewProps {
    beneficiary: Beneficiary;
    onBack: () => void;
    onUpdate: (beneficiary: Beneficiary) => void;
    projects?: ProgramProject[];
    existingCountries?: string[];
    initialTab?: string;
}

export const BeneficiaryProfileRoute: React.FC<{
    beneficiaryId: string;
    beneficiaries: Beneficiary[];
    isLoading: boolean;
    onBack: () => void;
    onUpdate: (beneficiary: Beneficiary) => void;
    projects?: ProgramProject[];
    existingCountries?: string[];
    initialTab?: string;
}> = ({ beneficiaryId, beneficiaries, isLoading, onBack, onUpdate, projects, existingCountries, initialTab }) => {
    const { t } = useLocalization(['common', 'beneficiaries']);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
                <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" />
                <div className="h-80 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" />
            </div>
        );
    }

    const beneficiary = beneficiaries.find((b) => b.id === beneficiaryId);
    if (!beneficiary) {
        return (
            <div className="space-y-4">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('beneficiaries.backToList')}
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('beneficiaries.profileLoadFailed', 'Unable to load this beneficiary profile.')}
                </p>
            </div>
        );
    }

    return <BeneficiaryDetailView beneficiary={beneficiary} onBack={onBack} onUpdate={onUpdate} projects={projects} existingCountries={existingCountries} initialTab={initialTab} />;
};

const BeneficiaryDetailView: React.FC<BeneficiaryDetailViewProps> = ({ beneficiary, onBack, onUpdate, projects, existingCountries, initialTab }) => {
    const { t, language } = useLocalization(['common', 'beneficiaries']);
    const tabIds = TAB_CONFIG[beneficiary.beneficiaryType] || TAB_CONFIG.student;
    const [activeTab, setActiveTab] = useTabParam('tab', 'overview', tabIds);

    useEffect(() => {
        if (initialTab && tabIds.includes(initialTab)) {
            setActiveTab(initialTab);
        }
    }, [initialTab, tabIds, setActiveTab]);
    const tabs = useMemo(() => tabIds.map(id => ({
        id,
        label: t(`beneficiaries.tabs.${id}`),
    })), [tabIds, t]);

    const kpis = getKpis(beneficiary, t, language);
    const name = beneficiary.name[language] || beneficiary.name.en || beneficiary.name.ar;
    const subtitle = getBeneficiarySubtitle(beneficiary, language, t);
    const localizedCountry = getCountryDisplayName(beneficiary.country, language === 'ar' ? 'ar' : 'en');

    const typeColor: Record<string, string> = {
        student: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        orphan: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
        hafiz: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
        family: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        institution: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
        community: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    };

    const handleProfileUpdate = (partial: any) => {
        onUpdate({ ...beneficiary, profile: { ...beneficiary.profile, ...partial } });
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab beneficiary={beneficiary} onUpdate={onUpdate} projects={projects} existingCountries={existingCountries} />;
            case 'academics':
                return beneficiary.profile.type === 'student' ? <AcademicsTab profile={beneficiary.profile} onUpdate={handleProfileUpdate} /> : null;
            case 'sponsorship':
                return <SponsorshipTab beneficiary={beneficiary} onUpdate={onUpdate} />;
            case 'guardian':
                return beneficiary.profile.type === 'orphan' ? <GuardianTab profile={beneficiary.profile} onUpdate={handleProfileUpdate} /> : null;
            case 'aid_log':
                return (
                    <AidLogTab
                        beneficiary={beneficiary}
                        onUpdate={(aidLog) => onUpdate({ ...beneficiary, aidLog })}
                        projects={projects}
                    />
                );
            case 'needs_assessment':
                return <NeedsAssessmentTab beneficiary={beneficiary} onUpdate={onUpdate} />;
            case 'documents':
                return (
                    <BeneficiaryDocumentsTab
                        documents={beneficiary.documents}
                        beneficiaryName={name}
                        onUpdate={(documents) => onUpdate({ ...beneficiary, documents })}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="animate-fade-in space-y-6 pb-24 md:pb-0">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('beneficiaries.backToList')}
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start gap-5">
                <img
                    src={beneficiary.photo}
                    alt={name}
                    className="w-20 h-20 rounded-full border-4 border-primary-light dark:border-primary/20 shadow-lg object-cover"
                    loading="lazy"
                />
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">{name}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <BeneficiaryStatusBadge status={beneficiary.status} />
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColor[beneficiary.beneficiaryType]}`}>
                            {t(`beneficiaries.types.${beneficiary.beneficiaryType}`)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {localizedCountry}
                        </span>
                    </div>
                </div>
            </div>

            {/* KPI cards */}
            {kpis.length > 0 && (
                <div className={`grid gap-4 ${kpis.length <= 2 ? 'grid-cols-2' : kpis.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
                    {kpis.map((kpi, i) => (
                        <div key={i} className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-soft border dark:border-slate-700/50 flex items-center gap-3">
                            <div className="text-primary dark:text-secondary">{kpi.icon}</div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{kpi.label}</p>
                                <p className="text-xl font-bold text-foreground dark:text-dark-foreground">{kpi.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft border dark:border-slate-700/50">
                <div className="px-6 pt-2">
                    <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
                </div>
                <div className="p-6">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default BeneficiaryDetailView;
