import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Partner } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import Tabs from '../../common/Tabs';
import OverviewTab from './tabs/OverviewTab';
import ProjectsTab from './tabs/ProjectsTab';
import PerformanceTab from './tabs/PerformanceTab';
import DocumentsTab from './tabs/DocumentsTab';
import ContactTab from './tabs/ContactTab';

interface PartnerDetailViewProps {
    partner: Partner;
    onBack: () => void;
    onPartnerUpdate: (updated: Partner) => void;
    isSaving?: boolean;
}

const PartnerDetailView: React.FC<PartnerDetailViewProps> = ({ partner, onBack, onPartnerUpdate, isSaving = false }) => {
    const { t } = useLocalization(['partners']);
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: t('partners.detail.tabs.overview') },
        { id: 'projects', label: t('partners.detail.tabs.projects') },
        { id: 'performance', label: t('partners.detail.tabs.performance') },
        { id: 'documents', label: t('partners.detail.tabs.documents') },
        { id: 'contacts', label: t('partners.detail.tabs.contacts') },
    ];

    const renderTab = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab partner={partner} onPartnerUpdate={onPartnerUpdate} isSaving={isSaving} />;
            case 'projects':
                return <ProjectsTab />;
            case 'performance':
                return (
                    <PerformanceTab
                        partnerRating={partner.rating}
                        onRatingChange={(rating) => onPartnerUpdate({ ...partner, rating })}
                    />
                );
            case 'documents':
                return <DocumentsTab />;
            case 'contacts':
                return <ContactTab partner={partner} onPartnerUpdate={onPartnerUpdate} isSaving={isSaving} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-dark-background p-6 space-y-6 animate-fade-in">
            <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                <ArrowLeft size={16} className="rotate-180" /> {t('partners.detail.backToList')}
            </button>

            <div className="bg-white dark:bg-dark-card rounded-xl shadow p-6">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 text-4xl">
                        {partner.logo}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">{partner.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{partner.country} | {partner.sector}</p>
                    </div>
                </div>
                <div className="mt-6">
                    <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
                </div>
                <div className="mt-6">{renderTab()}</div>
            </div>
        </div>
    );
};

export default PartnerDetailView;
