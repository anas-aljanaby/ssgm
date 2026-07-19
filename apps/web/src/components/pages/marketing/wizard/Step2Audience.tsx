import React, { useState } from 'react';
import type { Campaign } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { MOCK_CAMPAIGN_SEGMENTS } from '../../../../data/campaignsData';
import { UsersIcon, SegmentIcon } from '../../../icons/MarketingIcons';
import { formatNumber } from '../../../../lib/utils';

interface Step2AudienceProps {
    campaignData: Partial<Campaign>;
    updateData: (data: Partial<Campaign>) => void;
    errors?: Record<string, string>;
}

const AudienceSourceCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    isSelected: boolean;
    onClick: () => void;
    details?: string;
}> = ({ title, description, icon, isSelected, onClick, details }) => (
    <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 text-center ${
            isSelected
                ? 'border-primary dark:border-secondary bg-primary-light/50 dark:bg-primary/10 shadow-lg'
                : 'border-gray-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-secondary/50 hover:bg-gray-50 dark:hover:bg-slate-800/50'
        }`}
    >
        <div className="text-primary dark:text-secondary mx-auto w-12 h-12 flex items-center justify-center">{icon}</div>
        <h4 className="font-bold mt-2 text-foreground dark:text-dark-foreground">{title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        {details && <p className="text-xs font-semibold mt-1 text-gray-600 dark:text-gray-300">{details}</p>}
    </div>
);

const Step2Audience: React.FC<Step2AudienceProps> = ({ campaignData, updateData, errors = {} }) => {
    const { t, language } = useLocalization(['digital_marketing', 'common']);
    const [source, setSource] = useState<'all' | 'segment' | null>(
        campaignData.audience?.name === 'All Contacts' ? 'all' : campaignData.audience ? 'segment' : null
    );

    const selectAll = () => {
        setSource('all');
        updateData({ audience: { name: 'All Contacts', size: 15432 } });
    };

    const selectSegmentSource = () => {
        setSource('segment');
        if (!campaignData.audience || campaignData.audience.name === 'All Contacts') {
            updateData({ audience: undefined });
        }
    };

    const handleSegmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const segmentId = e.target.value;
        const selectedSegment = MOCK_CAMPAIGN_SEGMENTS.find(s => s.id === segmentId);
        if (selectedSegment) {
            updateData({ audience: { name: selectedSegment.name, size: selectedSegment.contactCount } });
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{t('digital_marketing.wizard.step2.title')}</h2>
                <p className="text-gray-500">{t('digital_marketing.wizard.step2.description')}</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">{t('digital_marketing.wizard.step2.source')}</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('digital_marketing.wizard.step2.sourceHelp')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AudienceSourceCard
                            title={t('digital_marketing.wizard.step2.allContacts')}
                            description={t('digital_marketing.wizard.step2.allContactsDesc')}
                            icon={<UsersIcon />}
                            isSelected={source === 'all'}
                            onClick={selectAll}
                            details={`~${formatNumber(15432, language)} ${t('digital_marketing.wizard.step2.contacts')}`}
                        />
                        <AudienceSourceCard
                            title={t('digital_marketing.wizard.step2.existingSegment')}
                            description={t('digital_marketing.wizard.step2.existingSegmentDesc')}
                            icon={<SegmentIcon />}
                            isSelected={source === 'segment'}
                            onClick={selectSegmentSource}
                            details={`${MOCK_CAMPAIGN_SEGMENTS.length} ${t('digital_marketing.wizard.step2.segmentsAvailable')}`}
                        />
                    </div>
                    {errors.audience && <p className="mt-2 text-xs text-red-600">{errors.audience}</p>}
                </div>

                {source === 'all' && (
                    <div className="p-3 bg-yellow-100/50 dark:bg-yellow-900/20 border-s-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 text-sm rounded-e-lg animate-fade-in">
                        {t('digital_marketing.wizard.step2.allContactsWarning')}
                    </div>
                )}

                {source === 'segment' && (
                    <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg animate-fade-in">
                        <label className="block text-sm font-bold mb-2">{t('digital_marketing.wizard.step2.chooseSegment')}</label>
                        <select
                            onChange={handleSegmentChange}
                            defaultValue=""
                            className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        >
                            <option value="" disabled>{t('digital_marketing.wizard.step2.selectSegment')}</option>
                            {MOCK_CAMPAIGN_SEGMENTS.map(seg => (
                                <option key={seg.id} value={seg.id}>
                                    {seg.name} ({formatNumber(seg.contactCount, language)})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Step2Audience;
