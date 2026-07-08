import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { Partner } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import Tabs from '../../common/Tabs';
import ConfirmationModal from '../../common/ConfirmationModal';
import OverviewTab from './tabs/OverviewTab';
import ProjectsTab from './tabs/ProjectsTab';
import PerformanceTab from './tabs/PerformanceTab';
import DocumentsTab from './tabs/DocumentsTab';
import ContactTab from './tabs/ContactTab';
import { EditActions, fieldClass } from './shared';

interface PartnerDetailViewProps {
    partner: Partner;
    onBack: () => void;
    onPartnerUpdate: (updated: Partner) => void;
    onPartnerDelete?: (partnerId: string) => void;
    isSaving?: boolean;
    isDeleting?: boolean;
    initialTab?: string;
}

const PartnerDetailView: React.FC<PartnerDetailViewProps> = ({
    partner,
    onBack,
    onPartnerUpdate,
    onPartnerDelete,
    isSaving = false,
    isDeleting = false,
    initialTab = 'overview',
}) => {
    const { t } = useLocalization(['partners', 'common']);
    const toast = useToast();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isHeaderEditing, setIsHeaderEditing] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [headerForm, setHeaderForm] = useState({
        nameAr: partner.nameAr,
        nameEn: partner.nameEn,
        description: partner.description ?? '',
    });

    useEffect(() => {
        if (!isHeaderEditing) {
            setHeaderForm({
                nameAr: partner.nameAr,
                nameEn: partner.nameEn,
                description: partner.description ?? '',
            });
        }
    }, [partner, isHeaderEditing]);

    const tabs = [
        { id: 'overview', label: t('partners.detail.tabs.overview') },
        { id: 'projects', label: t('partners.detail.tabs.projects') },
        { id: 'performance', label: t('partners.detail.tabs.performance') },
        { id: 'documents', label: t('partners.detail.tabs.documents') },
        { id: 'contacts', label: t('partners.detail.tabs.contacts') },
    ];

    const handleHeaderSave = () => {
        if (!headerForm.nameAr.trim() && !headerForm.nameEn.trim()) {
            toast.showError(t('partners.validation.required'));
            return;
        }
        onPartnerUpdate({
            ...partner,
            nameAr: headerForm.nameAr.trim(),
            nameEn: headerForm.nameEn.trim(),
            description: headerForm.description.trim(),
        });
        setIsHeaderEditing(false);
        toast.showSuccess(t('partners.detail.headerSaveSuccess'));
    };

    const handleHeaderCancel = () => {
        setHeaderForm({
            nameAr: partner.nameAr,
            nameEn: partner.nameEn,
            description: partner.description ?? '',
        });
        setIsHeaderEditing(false);
    };

    const handleDeleteConfirm = () => {
        onPartnerDelete?.(partner.id);
        setDeleteOpen(false);
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab partner={partner} onPartnerUpdate={onPartnerUpdate} isSaving={isSaving} />;
            case 'projects':
                return <ProjectsTab key={partner.id} partner={partner} />;
            case 'performance':
                return (
                    <PerformanceTab
                        key={partner.id}
                        partner={partner}
                        onPartnerUpdate={onPartnerUpdate}
                        isSaving={isSaving}
                    />
                );
            case 'documents':
                return <DocumentsTab key={partner.id} partner={partner} />;
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
                <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-6 flex-1">
                        <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 text-4xl flex-shrink-0">
                            {partner.logo}
                        </div>
                        <div className="flex-1 space-y-3">
                            {isHeaderEditing ? (
                                <div className="space-y-3 max-w-2xl">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-500">{t('partners.detail.nameAr')}</label>
                                        <input className={fieldClass} value={headerForm.nameAr} onChange={(e) => setHeaderForm((f) => ({ ...f, nameAr: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-500">{t('partners.detail.nameEn')}</label>
                                        <input className={fieldClass} value={headerForm.nameEn} onChange={(e) => setHeaderForm((f) => ({ ...f, nameEn: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-500">{t('partners.detail.description')}</label>
                                        <textarea className={fieldClass} rows={3} value={headerForm.description} onChange={(e) => setHeaderForm((f) => ({ ...f, description: e.target.value }))} />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">{partner.name}</h1>
                                    <p className="text-gray-500 dark:text-gray-400">{partner.country} | {partner.sector}</p>
                                    {partner.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-3xl">{partner.description}</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <EditActions
                            isEditing={isHeaderEditing}
                            isSaving={isSaving}
                            onEdit={() => setIsHeaderEditing(true)}
                            onSave={handleHeaderSave}
                            onCancel={handleHeaderCancel}
                            editLabel={t('common.edit')}
                            saveLabel={t('common.save')}
                            cancelLabel={t('common.cancel')}
                            savingLabel={t('common.loading')}
                        />
                        {onPartnerDelete && (
                            <button
                                type="button"
                                onClick={() => setDeleteOpen(true)}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            >
                                <Trash2 size={16} />
                                {t('common.delete')}
                            </button>
                        )}
                    </div>
                </div>
                <div className="mt-6">
                    <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
                </div>
                <div className="mt-6">{renderTab()}</div>
            </div>

            <ConfirmationModal
                isOpen={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={t('partners.detail.deleteTitle')}
                message={t('partners.detail.deleteMessage', { name: partner.name })}
                confirmLabel={t('common.delete')}
                isConfirming={isDeleting}
            />
        </div>
    );
};

export default PartnerDetailView;
