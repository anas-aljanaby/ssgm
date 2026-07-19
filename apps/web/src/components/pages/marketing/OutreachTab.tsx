import React, { useState, useMemo } from 'react';
import type { Role, IndividualDonor, MessageType, GeneratedMessage, Language } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { MOCK_INDIVIDUAL_DONORS } from '../../../data/individualDonorsData';
import { MOCK_MESSAGE_TEMPLATES } from '../../../data/smartMessagingData';
import { generatePersonalizedMessage } from '../../../lib/smartMessaging';
import { useOptimalTimingData } from '../../../hooks/useOptimalTimingData';
import { formatDate, formatCurrency } from '../../../lib/utils';
import Spinner from '../../common/Spinner';
import CampaignTypeSelector from '../smart_messaging/CampaignTypeSelector';
import TargetSelectionPanel from '../smart_messaging/TargetSelectionPanel';
import CampaignConfigPanel from '../smart_messaging/CampaignConfigPanel';
import LivePreviewPanel from '../smart_messaging/LivePreviewPanel';
import GeneratedMessages from '../smart_messaging/GeneratedMessages';
import { useToast } from '../../../hooks/useToast';

interface OutreachTabProps {
    role?: Role;
}

const OutreachTab: React.FC<OutreachTabProps> = () => {
    const { t, language } = useLocalization(['digital_marketing', 'smart_messaging', 'common']);
    const toast = useToast();
    const { donors: timingDonors, isLoading: timingLoading } = useOptimalTimingData();

    const [campaignType, setCampaignType] = useState<MessageType | null>(null);
    const [targetDonors, setTargetDonors] = useState<IndividualDonor[]>([]);
    const [preselectedIds, setPreselectedIds] = useState<Set<string>>(new Set());
    const [config, setConfig] = useState({
        timing: 'scheduleBest',
        channels: ['email'],
        personalizationLevel: 'Medium' as 'Low' | 'Medium' | 'High',
        language: 'auto' as 'auto' | Language,
    });
    const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState('');

    const readyQueue = useMemo(() => {
        const source = timingDonors.length > 0 ? timingDonors : MOCK_INDIVIDUAL_DONORS;
        const eligible = source.filter(d => d.status === 'Active' || d.status === 'Lapsed');
        const withSignals = eligible.filter(
            d => d.engagement_score != null || d.next_predicted_donation_date || d.best_contact_day_of_week
        );
        // Prefer donors with timing signals; fall back to active/lapsed list for BUILD mock.
        return (withSignals.length > 0 ? withSignals : eligible).slice(0, 12);
    }, [timingDonors]);

    const toggleQueueDonor = (donor: IndividualDonor) => {
        setPreselectedIds(prev => {
            const next = new Set(prev);
            if (next.has(donor.id)) next.delete(donor.id);
            else next.add(donor.id);
            return next;
        });
    };

    const useSelectedInMessage = () => {
        const selected = readyQueue.filter(d => preselectedIds.has(d.id));
        if (selected.length === 0) {
            toast.showWarning(t('digital_marketing.outreach.queue.selectWarning'), { title: t('toasts.warningTitle') });
            return;
        }
        setTargetDonors(selected);
        if (!campaignType) setCampaignType('thank_you');
        toast.showSuccess(t('digital_marketing.outreach.queue.added', { count: selected.length }), { title: t('toasts.successTitle') });
    };

    const handleGenerateMessages = async () => {
        if (targetDonors.length === 0 || !campaignType) {
            toast.showWarning(t('smart_messaging.generate.warning'), { title: t('toasts.warningTitle') });
            return;
        }

        setIsLoading(true);
        setGeneratedMessages([]);
        const newMessages: GeneratedMessage[] = [];

        for (let i = 0; i < targetDonors.length; i++) {
            const donor = targetDonors[i];
            setLoadingProgress(t('smart_messaging.generate.progress', { current: i + 1, total: targetDonors.length }));
            try {
                const generated = await generatePersonalizedMessage(
                    donor, campaignType, config.personalizationLevel, config.language, MOCK_MESSAGE_TEMPLATES
                );
                newMessages.push({
                    ...generated,
                    message_id: Date.now() + i,
                    created_at: new Date().toISOString(),
                });
            } catch (error) {
                console.error(`Failed to generate message for ${donor.fullName.en}:`, error);
                toast.showError(t('digital_marketing.outreach.generateError', { name: donor.fullName.en }), { title: t('toasts.errorTitle') });
            }
        }

        setGeneratedMessages(newMessages);
        setIsLoading(false);
        setLoadingProgress('');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Ready-to-contact queue */}
            <section className="bg-card dark:bg-dark-card rounded-2xl shadow-soft border border-gray-200 dark:border-slate-700/50 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b dark:border-slate-700">
                    <div>
                        <h2 className="text-lg font-bold text-foreground dark:text-dark-foreground">
                            {t('digital_marketing.outreach.queue.title')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('digital_marketing.outreach.queue.subtitle')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={useSelectedInMessage}
                        disabled={preselectedIds.size === 0}
                        className="px-4 py-2 text-sm font-semibold text-white bg-secondary hover:bg-secondary-dark rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('digital_marketing.outreach.queue.useInMessage')} ({preselectedIds.size})
                    </button>
                </div>

                {timingLoading ? (
                    <div className="flex justify-center py-12"><Spinner /></div>
                ) : readyQueue.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">{t('digital_marketing.outreach.queue.empty')}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-gray-50 dark:bg-dark-card/50 text-gray-600 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3 w-10" />
                                    <th className="px-4 py-3">{t('digital_marketing.outreach.queue.columns.name')}</th>
                                    <th className="px-4 py-3">{t('digital_marketing.outreach.queue.columns.bestTime')}</th>
                                    <th className="px-4 py-3">{t('digital_marketing.outreach.queue.columns.channel')}</th>
                                    <th className="px-4 py-3">{t('digital_marketing.outreach.queue.columns.engagement')}</th>
                                    <th className="px-4 py-3">{t('digital_marketing.outreach.queue.columns.nextGift')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {readyQueue.map(donor => (
                                    <tr key={donor.id} className="border-b dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={preselectedIds.has(donor.id)}
                                                onChange={() => toggleQueueDonor(donor)}
                                                className="w-4 h-4 text-primary rounded"
                                                aria-label={donor.fullName[language] || donor.fullName.en}
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-foreground dark:text-dark-foreground">
                                            {donor.fullName[language] || donor.fullName.en}
                                        </td>
                                        <td className="px-4 py-3">
                                            {[donor.best_contact_day_of_week, donor.best_contact_time].filter(Boolean).join(' · ') || '—'}
                                        </td>
                                        <td className="px-4 py-3 capitalize">{donor.preferred_contact_channel || '—'}</td>
                                        <td className="px-4 py-3">
                                            {donor.engagement_score != null ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${donor.engagement_score > 60 ? 'bg-green-500' : donor.engagement_score > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            style={{ width: `${donor.engagement_score}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs">{donor.engagement_score}</span>
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {donor.next_predicted_donation_date
                                                ? (
                                                    <span>
                                                        {formatDate(donor.next_predicted_donation_date, language)}
                                                        {donor.next_predicted_amount != null && (
                                                            <span className="text-xs text-gray-400 ms-1">
                                                                ({formatCurrency(donor.next_predicted_amount, language)})
                                                            </span>
                                                        )}
                                                    </span>
                                                )
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Message purpose + generation flow */}
            <CampaignTypeSelector selectedType={campaignType} onSelectType={setCampaignType} />

            {campaignType && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
                    <div className="lg:col-span-3 space-y-6">
                        {targetDonors.length > 0 && preselectedIds.size > 0 && (
                            <div className="p-3 rounded-lg bg-primary-light/40 dark:bg-primary/10 text-sm border border-primary/20">
                                {t('digital_marketing.outreach.queue.prefilled', { count: targetDonors.length })}
                            </div>
                        )}
                        <TargetSelectionPanel
                            allDonors={MOCK_INDIVIDUAL_DONORS}
                            onTargetsUpdate={setTargetDonors}
                            languageSelection={config.language}
                            externalTargets={preselectedIds.size > 0 ? targetDonors : undefined}
                        />
                        <CampaignConfigPanel
                            config={config}
                            onConfigChange={setConfig}
                            messageType={campaignType}
                        />
                        <button
                            type="button"
                            onClick={handleGenerateMessages}
                            disabled={isLoading || targetDonors.length === 0}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-lg font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Spinner /> : null}
                            {isLoading ? loadingProgress : t('smart_messaging.generate.button')}
                        </button>
                    </div>
                    <div className="lg:col-span-2">
                        <LivePreviewPanel
                            targetDonors={targetDonors}
                            campaignType={campaignType}
                            personalizationLevel={config.personalizationLevel}
                            languageSelection={config.language}
                        />
                    </div>
                </div>
            )}

            {generatedMessages.length > 0 && !isLoading && (
                <GeneratedMessages messages={generatedMessages} />
            )}
        </div>
    );
};

export default OutreachTab;
