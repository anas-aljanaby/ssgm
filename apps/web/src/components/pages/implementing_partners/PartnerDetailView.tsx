import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Partner } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import Tabs from '../../common/Tabs';
import ProjectsTab from './tabs/ProjectsTab';
import EvaluationsTab from './tabs/EvaluationsTab';
import DocumentsTab from './tabs/DocumentsTab';
import ContactTab from './tabs/ContactTab';

interface PartnerDetailViewProps {
    partner: Partner;
    onBack: () => void;
}

const PartnerDetailView: React.FC<PartnerDetailViewProps> = ({ partner, onBack }) => {
    const { t } = useLocalization(['partners']);
    const [activeTab, setActiveTab] = useState('contact');

    const tabs = [
        { id: 'projects', label: t('partners.detail.tabs.projects') },
        { id: 'evaluations', label: t('partners.detail.tabs.evaluations') },
        { id: 'documents', label: t('partners.detail.tabs.documents') },
        { id: 'contact', label: t('partners.detail.tabs.contact') },
    ];

    const renderTab = () => {
        switch (activeTab) {
            case 'projects':
                return <ProjectsTab />;
            case 'evaluations':
                return <EvaluationsTab partnerRating={partner.rating} />;
            case 'documents':
                return <DocumentsTab />;
            case 'contact':
                return <ContactTab partner={partner} />;
            default:
                return null;
        }
    };

    return (
        <div dir="rtl" className="bg-gray-50 dark:bg-dark-background p-6 space-y-6 animate-fade-in">
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
