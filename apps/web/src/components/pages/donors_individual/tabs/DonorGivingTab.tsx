import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Gift, ReceiptText, Target, TrendingUp } from 'lucide-react';
import { PIPELINE_STAGES } from '@gms/shared';
import type { DonorProfileSummary, ProfileDonation } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { formatCurrency, formatDate, formatRelativeFromEvent } from '../../../../lib/utils';
import { Chip, EmptyPanel, MetricCard, Section } from './profileUi';

const STAGES_REQUIRING_ASK = new Set(['solicited', 'pledged']);

interface DonorGivingTabProps {
    summary: DonorProfileSummary;
    donations: ProfileDonation[];
    isLoading?: boolean;
    onSavePipelineAsk?: (data: { pipelineStage: string; askAmount: number | null }) => Promise<void> | void;
    saveDisabledReason?: string;
    isSavingPipelineAsk?: boolean;
}

const DonorGivingTab: React.FC<DonorGivingTabProps> = ({
    summary,
    donations,
    isLoading,
    onSavePipelineAsk,
    saveDisabledReason,
    isSavingPipelineAsk,
}) => {
    const { t, language } = useLocalization(['common', 'individual_donors', 'donors']);
    const suggestedAsk = summary.computed.suggestedAskAmount;
    const askAvailable = suggestedAsk !== null && suggestedAsk > 0;
    const [pipelineStage, setPipelineStage] = useState(summary.relationship.pipelineStage || 'prospect');
    const [askAmount, setAskAmount] = useState(askAvailable ? String(suggestedAsk) : '');
    const [askError, setAskError] = useState<string | null>(null);

    useEffect(() => {
        setPipelineStage(summary.relationship.pipelineStage || 'prospect');
        setAskAmount(summary.computed.suggestedAskAmount !== null ? String(summary.computed.suggestedAskAmount) : '');
    }, [summary.computed.suggestedAskAmount, summary.relationship.pipelineStage]);

    const validateAsk = useMemo(() => {
        const trimmed = askAmount.trim();
        if (!trimmed) {
            if (STAGES_REQUIRING_ASK.has(pipelineStage)) {
                return t('individual_donors.detailView.askRequired');
            }
            return null;
        }
        const parsed = Number(askAmount);
        if (!Number.isFinite(parsed) || parsed < 0) {
            return t('individual_donors.detailView.askInvalid');
        }
        if (STAGES_REQUIRING_ASK.has(pipelineStage) && parsed <= 0) {
            return t('individual_donors.detailView.askRequired');
        }
        return null;
    }, [askAmount, pipelineStage, t]);

    useEffect(() => {
        setAskError(validateAsk);
    }, [validateAsk]);

    const handlePipelineAskSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (validateAsk) {
            setAskError(validateAsk);
            return;
        }
        const parsedAskAmount = askAmount.trim() ? Number(askAmount) : null;
        onSavePipelineAsk?.({
            pipelineStage,
            askAmount: parsedAskAmount !== null && Number.isFinite(parsedAskAmount) ? parsedAskAmount : null,
        });
    };

    const canSave = Boolean(onSavePipelineAsk) && !validateAsk && !isSavingPipelineAsk;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard title={t('individual_donors.columns.totalDonations')} value={formatCurrency(summary.giving.lifetimeGiving, language)} icon={<DollarSign size={19} />} accent="text-emerald-600 dark:text-emerald-300" />
                <MetricCard title={t('individual_donors.columns.lastGift')} value={summary.giving.lastGiftAmount !== null ? formatCurrency(summary.giving.lastGiftAmount, language) : 'N/A'} icon={<Gift size={19} />} subtext={(summary.giving.lastGiftRecordedAt ?? summary.giving.lastGiftDate) ? formatRelativeFromEvent(summary.giving.lastGiftRecordedAt ?? summary.giving.lastGiftDate!, language) : undefined} accent="text-blue-600 dark:text-blue-300" />
                <MetricCard title={t('individual_donors.kpi.avgGift')} value={summary.giving.averageGift !== null ? formatCurrency(summary.giving.averageGift, language) : 'N/A'} icon={<TrendingUp size={19} />} accent="text-amber-600 dark:text-amber-300" />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(290px,0.65fr)_minmax(0,1.35fr)]">
                <Section title={t('individual_donors.detailView.pipelineAsk')} icon={<Target size={18} />}>
                    <form onSubmit={handlePipelineAskSubmit} className="space-y-4">
                        <label className="block">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('individual_donors.columns.pipelineStage')}</span>
                            <select value={pipelineStage} onChange={(event) => setPipelineStage(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900">
                                {PIPELINE_STAGES.map((stage) => (
                                    <option key={stage} value={stage}>{t(`donors.stages.${stage}`, stage)}</option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('donors.kanban.suggestedAsk')}</span>
                            <input type="number" min="0" step="0.01" value={askAmount} onChange={(event) => setAskAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                            {askError && <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{askError}</p>}
                        </label>
                        <div className="rounded-lg bg-gray-50 p-4 text-sm font-semibold leading-6 text-gray-600 dark:bg-slate-900/40 dark:text-gray-300">
                            {askAvailable
                                ? t('individual_donors.detailView.askRationale', { defaultValue: 'Suggested ask is manager-provided.' })
                                : t('individual_donors.detailView.askUnavailable', { defaultValue: 'Suggested ask is unavailable until there is a defensible calculation or a manager override.' })}
                        </div>
                        {!askAvailable && <Chip>Not enough data</Chip>}
                        {(onSavePipelineAsk || saveDisabledReason) && (
                            <>
                                <button type="submit" disabled={!canSave} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">
                                    {isSavingPipelineAsk ? t('common.loading') : t('common.save')}
                                </button>
                                {saveDisabledReason && (
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{saveDisabledReason}</p>
                                )}
                            </>
                        )}
                    </form>
                </Section>

                <Section title={t('individual_donors.detailView.donationHistory')} icon={<ReceiptText size={18} />}>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />)}
                        </div>
                    ) : donations.length === 0 ? (
                        <EmptyPanel text={t('individual_donors.detailView.noDonations')} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="px-3 py-2 text-start">{t('individual_donors.detailView.date')}</th>
                                        <th className="px-3 py-2 text-start">{t('individual_donors.detailView.program')}</th>
                                        <th className="px-3 py-2 text-start">{t('individual_donors.detailView.payment', 'Payment')}</th>
                                        <th className="px-3 py-2 text-start">{t('individual_donors.detailView.status', 'Status')}</th>
                                        <th className="px-3 py-2 text-end">{t('individual_donors.detailView.amount')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {donations.map((donation) => (
                                        <tr key={donation.id}>
                                            <td className="px-3 py-3 whitespace-nowrap">{donation.date ? formatDate(donation.date, language) : 'N/A'}</td>
                                            <td className="px-3 py-3">
                                                <p className="font-bold text-foreground dark:text-dark-foreground">{donation.designation || donation.program || 'General'}</p>
                                                {donation.campaign && <p className="text-xs text-gray-500 dark:text-gray-400">{donation.campaign}</p>}
                                            </td>
                                            <td className="px-3 py-3">{donation.payment_method || 'N/A'}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <Chip tone={donation.status === 'posted' ? 'green' : 'amber'}>{donation.status}</Chip>
                                                    {donation.refund_state !== 'none' && <Chip tone="red">{donation.refund_state}</Chip>}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-end font-bold">{formatCurrency(donation.amount, language)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Section>
            </div>
        </div>
    );
};

export default DonorGivingTab;
