import React, { useState } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useTabParam } from '../../../hooks/useTabParam';
import type { DocumentType, FolderTemplate, MetadataTag, RetentionPolicy } from '../../../types';
import { MOCK_DOCUMENT_TYPES, MOCK_FOLDER_TEMPLATES, MOCK_METADATA_TAGS, MOCK_RETENTION_POLICIES } from '../../../data/documentData';
import Tabs from '../../common/Tabs';
import SettingsCard from './SettingsCard';
import ToggleSwitch from './ToggleSwitch';
import FormField from './FormField';
import * as DocumentIcons from '../../icons/DocumentIcons';
import { EditIcon } from '../../icons/ActionIcons';
import { PlusCircleIcon, XIcon } from '../../icons/GenericIcons';

const iconMap: { [key: string]: React.FC } = {
    ContractIcon: DocumentIcons.ContractIcon,
    InvoiceIcon: DocumentIcons.InvoiceIcon,
    PolicyIcon: DocumentIcons.PolicyIcon,
    ReportIcon: DocumentIcons.ReportIcon,
};


const DocumentTypesConfig: React.FC = () => {
    const { t } = useLocalization();
    return <SettingsCard title={t('settings.documents.types.title')} description={t('settings.documents.types.desc')}><p>{t('settings.documents.types.placeholder')}</p></SettingsCard>
};
const FolderTemplatesConfig: React.FC = () => {
    const { t } = useLocalization();
    return <SettingsCard title={t('settings.documents.templates.title')} description={t('settings.documents.templates.desc')}><p>{t('settings.documents.templates.placeholder')}</p></SettingsCard>
};

const MetadataConfig: React.FC = () => {
    const { t } = useLocalization();
    const [tags, setTags] = useState<MetadataTag[]>(MOCK_METADATA_TAGS);
    const [newTagName, setNewTagName] = useState('');

    const handleAddTag = () => {
        if (newTagName.trim()) {
            const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            setTags([...tags, { id: `tag-${Date.now()}`, name: newTagName.trim(), color: randomColor }]);
            setNewTagName('');
        }
    };

    return (
        <SettingsCard
            title={t('settings.documents.metadata.title')}
            description={t('settings.documents.metadata.desc')}
        >
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <input 
                        type="text" 
                        placeholder={t('settings.documents.metadata.tagName')} 
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        className="flex-grow block w-full p-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    />
                    <button onClick={handleAddTag} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg shrink-0">
                        {t('settings.documents.metadata.addTag')}
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2 min-h-[40px] p-3 bg-white dark:bg-slate-800/50 rounded-lg border dark:border-slate-700">
                    {tags.map(tag => (
                        <span key={tag.id} className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${tag.color} flex items-center gap-2 animate-scale-in-fast`}>
                            {tag.name}
                            <button onClick={() => setTags(tags.filter(t => t.id !== tag.id))} className="opacity-70 hover:opacity-100">
                                <XIcon className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            </div>
        </SettingsCard>
    );
};

const VersioningRetentionConfig: React.FC = () => {
    const { t } = useLocalization();
    return <SettingsCard title={t('settings.documents.versioning.title')} description={t('settings.documents.versioning.desc')}><p>{t('settings.documents.versioning.placeholder')}</p></SettingsCard>
};

const DOCUMENT_SETTINGS_TABS = ['types', 'templates', 'metadata', 'versioning'] as const;

const DocumentSettings: React.FC = () => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useTabParam('documentsTab', 'metadata', DOCUMENT_SETTINGS_TABS);
    
    const tabs = [
        { id: 'types', label: t('settings.documents.tabs.types') },
        { id: 'templates', label: t('settings.documents.tabs.templates') },
        { id: 'metadata', label: t('settings.documents.tabs.metadata') },
        { id: 'versioning', label: `${t('settings.documents.tabs.versioning')} & ${t('settings.documents.tabs.retention')}` },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'types':
                return <DocumentTypesConfig />;
            case 'templates':
                return <FolderTemplatesConfig />;
            case 'metadata':
                return <MetadataConfig />;
            case 'versioning':
                return <VersioningRetentionConfig />;
            default:
                return null;
        }
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground mb-4">{t('settings.documents.title')}</h2>
            <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
            <div className="mt-6">
                {renderContent()}
            </div>
            <div className="flex justify-end pt-6 mt-6 border-t dark:border-slate-700">
                 <button className="px-6 py-2.5 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-secondary-dark transition-colors">
                    {t('settings.saveChanges')}
                </button>
            </div>
        </div>
    );
};

export default DocumentSettings;