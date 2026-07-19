import React from 'react';
import type { Campaign } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { formatCurrency, formatDate } from '../../../../lib/utils';

interface Step4ReviewProps {
    campaignData: Partial<Campaign>;
    launchStatus: 'Draft' | 'Scheduled' | 'Active';
    onLaunchStatusChange: (status: 'Draft' | 'Scheduled' | 'Active') => void;
}

const Step4Review: React.FC<Step4ReviewProps> = ({ campaignData, launchStatus, onLaunchStatusChange }) => {
    const { t, language } = useLocalization(['digital_marketing', 'common']);
    const name = campaignData.name?.[language] || campaignData.name?.en || '—';
    const channel = campaignData.channels?.[0] || '—';

    const rows: { label: string; value: string }[] = [
        { label: t('digital_marketing.wizard.step4.name'), value: name },
        {
            label: t('digital_marketing.wizard.step4.objective'),
            value: campaignData.objective
                ? t(`digital_marketing.wizard.step1.objectives.${campaignData.objective}`)
                : '—',
        },
        {
            label: t('digital_marketing.wizard.step4.dates'),
            value: campaignData.startDate && campaignData.endDate
                ? `${formatDate(campaignData.startDate, language)} – ${formatDate(campaignData.endDate, language)}`
                : '—',
        },
        { label: t('digital_marketing.wizard.step4.owner'), value: campaignData.owner || '—' },
        {
            label: t('digital_marketing.wizard.step4.budget'),
            value: formatCurrency(campaignData.budget ?? 0, language),
        },
        {
            label: t('digital_marketing.wizard.step4.audience'),
            value: campaignData.audience
                ? `${campaignData.audience.name} (${campaignData.audience.size.toLocaleString()})`
                : '—',
        },
        { label: t('digital_marketing.wizard.step4.channel'), value: String(channel) },
        {
            label: t('digital_marketing.wizard.step4.content'),
            value: campaignData.contentDraft?.subject || campaignData.contentDraft?.body?.slice(0, 80) || '—',
        },
    ];

    const statusOptions: { id: 'Draft' | 'Scheduled' | 'Active'; label: string }[] = [
        { id: 'Draft', label: t('digital_marketing.wizard.step4.saveDraft') },
        { id: 'Scheduled', label: t('digital_marketing.wizard.step4.schedule') },
        { id: 'Active', label: t('digital_marketing.wizard.step4.launchNow') },
    ];

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{t('digital_marketing.wizard.step4.title')}</h2>
                <p className="text-gray-500">{t('digital_marketing.wizard.step4.description')}</p>
            </div>

            <div className="max-w-2xl mx-auto bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 divide-y dark:divide-slate-700">
                {rows.map(row => (
                    <div key={row.label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">{row.label}</span>
                        <span className="text-foreground dark:text-dark-foreground font-semibold text-end">{row.value}</span>
                    </div>
                ))}
            </div>

            <div className="max-w-2xl mx-auto">
                <label className="block text-sm font-bold mb-2">{t('digital_marketing.wizard.step4.launchAs')}</label>
                <div className="grid grid-cols-3 gap-3">
                    {statusOptions.map(opt => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => onLaunchStatusChange(opt.id)}
                            className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                                launchStatus === opt.id
                                    ? 'border-primary bg-primary-light/40 dark:bg-primary/20 text-primary'
                                    : 'border-gray-200 dark:border-slate-700'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Step4Review;
