import React, { useState, useMemo, useEffect } from 'react';
import {
    CalendarRange,
    CheckCircle2,
    ChevronDown,
    CircleDollarSign,
    Clock3,
    Eye,
    Facebook,
    Mail,
    Megaphone,
    MessageCircle,
    MoreHorizontal,
    Plus,
    Search,
    Send,
    Sparkles,
    Trash2,
    Users,
    WalletCards,
} from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { Campaign, CampaignStatus } from '../../../types';
import { MOCK_CHANNEL_HEALTH } from '../../../data/digitalMarketingData';
import { useDestructiveConfirmation } from '../../../hooks/useDestructiveConfirmation';
import ConfirmationModal from '../../common/ConfirmationModal';
import CreateCampaignWizard from './CreateCampaignWizard';

interface CampaignsTabProps {
    campaigns: Campaign[];
    onCreateCampaign: (campaign: Campaign) => void;
    onDeleteCampaign: (id: string) => void;
    openWizard?: boolean;
    onWizardOpened?: () => void;
}

const CampaignsTab: React.FC<CampaignsTabProps> = ({
    campaigns,
    onCreateCampaign,
    onDeleteCampaign,
    openWizard = false,
    onWizardOpened,
}) => {
    const { t, language } = useLocalization(['digital_marketing', 'common']);
    const [searchTerm, setSearchTerm] = useState('');
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [channelFilter, setChannelFilter] = useState('all');
    const deletion = useDestructiveConfirmation<Campaign>({ getRowId: campaign => campaign.id });

    useEffect(() => {
        if (openWizard) {
            setIsWizardOpen(true);
            onWizardOpened?.();
        }
    }, [openWizard, onWizardOpened]);

    const filteredCampaigns = useMemo(() => {
        let filtered = campaigns.filter(campaign => {
            const searchLower = searchTerm.toLowerCase();
            const name = campaign.name[language] || campaign.name.en;
            return name.toLowerCase().includes(searchLower) ||
                   campaign.owner.toLowerCase().includes(searchLower);
        });

        if (statusFilter !== 'all') {
            filtered = filtered.filter(campaign => campaign.status.toLowerCase() === statusFilter);
        }

        if (channelFilter !== 'all') {
            filtered = filtered.filter(c =>
                c.channels.some(ch => ch.toLowerCase() === channelFilter.toLowerCase())
            );
        }

        return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [campaigns, searchTerm, language, statusFilter, channelFilter]);

    const stats = useMemo(() => {
        const activeCampaigns = campaigns.filter(campaign => campaign.status === 'Active');
        const campaignsWithOpenRate = campaigns.filter(campaign => typeof campaign.openRate === 'number');
        return {
            active: activeCampaigns.length,
            spend: activeCampaigns.reduce((total, campaign) => total + campaign.spent, 0),
            messages: campaigns.reduce((total, campaign) => total + (campaign.messagesSent ?? 0), 0),
            openRate: campaignsWithOpenRate.length
                ? campaignsWithOpenRate.reduce((total, campaign) => total + (campaign.openRate ?? 0), 0) / campaignsWithOpenRate.length
                : 0,
        };
    }, [campaigns]);

    const locale = language === 'ar' ? 'ar-SA' : 'en-US';
    const compactNumber = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
    const dateFormatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });

    const statusStyles: Record<CampaignStatus, string> = {
        Active: 'bg-[#e8eef7] text-[#315b88]',
        Completed: 'bg-[#edf2f4] text-[#526b71]',
        Scheduled: 'bg-[#fff3dc] text-[#a76b15]',
        Draft: 'bg-[#f1eef5] text-[#735f82]',
        Paused: 'bg-[#fbeae5] text-[#b65945]',
    };

    const channelIcons = {
        Email: Mail,
        SMS: MessageCircle,
        WhatsApp: MessageCircle,
        Social: Facebook,
    };

    const channelLabels: Record<string, string> = {
        Email: t('digital_marketing.campaigns.channels.email'),
        SMS: t('digital_marketing.campaigns.channels.sms'),
        WhatsApp: t('digital_marketing.campaigns.channels.whatsapp'),
        Social: t('digital_marketing.campaigns.channels.social'),
    };

    const handleDelete = () =>
        deletion.confirm(async () => Promise.resolve()).then(removed => {
            if (removed) onDeleteCampaign(removed.id);
        });

    return (
        <>
            <div className="space-y-5 animate-fade-in">
                <section className="flex items-center justify-between rounded-xl bg-[#142542] px-7 py-6 text-white shadow-[0_20px_50px_rgba(20,37,66,0.14)]">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#edb24d]">
                            <Sparkles className="h-4 w-4" />
                            {t('digital_marketing.redesign.campaignCommand')}
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">
                            {t('digital_marketing.redesign.campaignHeading')}
                        </h2>
                        <p className="mt-1.5 text-sm text-[#b9c6d9]">
                            {t('digital_marketing.redesign.campaignSubtitle')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsWizardOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#e3a640] px-5 py-3 text-sm font-black text-[#182238] shadow-[0_8px_25px_rgba(227,166,64,0.22)] transition hover:-translate-y-0.5 hover:bg-[#edb34f]"
                    >
                        <Plus className="h-4 w-4" strokeWidth={3} />
                        {t('digital_marketing.campaigns.create')}
                    </button>
                </section>

                <section className="grid grid-cols-4 overflow-hidden rounded-xl border border-[#dfe3ea] bg-white shadow-[0_12px_35px_rgba(19,36,66,0.045)]">
                    {[
                        { label: t('digital_marketing.campaigns.kpi.active'), value: stats.active.toLocaleString(locale), note: t('digital_marketing.redesign.runningNow'), icon: Megaphone, color: '#365f8b' },
                        { label: t('digital_marketing.campaigns.kpi.spend'), value: compactNumber.format(stats.spend), note: t('digital_marketing.redesign.sar'), icon: WalletCards, color: '#d39732' },
                        { label: t('digital_marketing.campaigns.kpi.messagesSent'), value: compactNumber.format(stats.messages), note: t('digital_marketing.redesign.acrossChannels'), icon: Send, color: '#cc6852' },
                        { label: t('digital_marketing.campaigns.kpi.avgOpenRate'), value: `${stats.openRate.toFixed(1)}%`, note: t('digital_marketing.redesign.healthyRate'), icon: Eye, color: '#387981' },
                    ].map((stat, index) => (
                        <div key={stat.label} className={`flex items-center gap-4 px-5 py-5 ${index < 3 ? 'border-l border-[#e8ece9]' : ''}`}>
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px]" style={{ backgroundColor: `${stat.color}14`, color: stat.color }}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-[#7a8a87]">{stat.label}</p>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <strong className="text-xl font-black text-[#14233d]">{stat.value}</strong>
                                    <span className="text-[9px] font-bold text-[#9aa5a3]">{stat.note}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="overflow-hidden rounded-xl border border-[#dfe3ea] bg-white shadow-[0_14px_40px_rgba(19,36,66,0.05)]">
                    <div className="flex items-center justify-between gap-5 border-b border-[#e9eeea] p-5">
                        <div className="relative min-w-0 flex-1 max-w-md">
                            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#84938f]" />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={event => setSearchTerm(event.target.value)}
                                placeholder={t('digital_marketing.campaigns.searchPlaceholder')}
                                className="h-11 w-full rounded-lg border border-[#dfe3ea] bg-[#fafbfc] pr-10 pl-4 text-sm font-semibold text-[#263957] outline-none transition placeholder:font-normal placeholder:text-[#a2a9b4] focus:border-[#58769d] focus:bg-white focus:ring-4 focus:ring-[#58769d]/10"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex rounded-lg bg-[#f0f2f5] p-1">
                                {[
                                    ['all', t('digital_marketing.campaigns.filters.all')],
                                    ['active', t('digital_marketing.campaigns.filters.active')],
                                    ['scheduled', t('digital_marketing.campaigns.statuses.Scheduled')],
                                    ['completed', t('digital_marketing.campaigns.statuses.Completed')],
                                ].map(([id, label]) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setStatusFilter(id)}
                                        className={`rounded-md px-3.5 py-2 text-xs font-bold transition ${
                                            statusFilter === id
                                                ? 'bg-white text-[#263f64] shadow-sm'
                                                : 'text-[#78818f] hover:text-[#354b6d]'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <label className="relative">
                                <span className="sr-only">{t('digital_marketing.campaigns.channels.all')}</span>
                                <select
                                    value={channelFilter}
                                    onChange={event => setChannelFilter(event.target.value)}
                                    className="h-11 appearance-none rounded-lg border border-[#dfe3ea] bg-white pr-4 pl-9 text-xs font-bold text-[#56637a] outline-none focus:border-[#58769d]"
                                >
                                    <option value="all">{t('digital_marketing.campaigns.channels.all')}</option>
                                    <option value="email">{t('digital_marketing.campaigns.channels.email')}</option>
                                    <option value="sms">{t('digital_marketing.campaigns.channels.sms')}</option>
                                    <option value="whatsapp">{t('digital_marketing.campaigns.channels.whatsapp')}</option>
                                    <option value="social">{t('digital_marketing.campaigns.channels.social')}</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#758683]" />
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-[minmax(270px,1.6fr)_120px_minmax(170px,1fr)_155px_150px_44px] items-center gap-4 border-b border-[#e7eaf0] bg-[#f8f9fb] px-5 py-3 text-[10px] font-black uppercase tracking-wide text-[#858e9d]">
                        <span>{t('digital_marketing.campaigns.table.name')}</span>
                        <span>{t('digital_marketing.campaigns.table.status')}</span>
                        <span>{t('digital_marketing.campaigns.table.progress')}</span>
                        <span>{t('digital_marketing.campaigns.table.channel')}</span>
                        <span>{t('digital_marketing.campaigns.table.duration')}</span>
                        <span className="sr-only">{t('digital_marketing.campaigns.table.actions')}</span>
                    </div>

                    <div className="divide-y divide-[#edf0ed]">
                        {filteredCampaigns.map(campaign => {
                            const progress = Math.min(100, Math.round((campaign.goal.current / campaign.goal.target) * 100));
                            const rowPending = deletion.isRowPending(campaign.id);
                            const rowExiting = deletion.isRowExiting(campaign.id);
                            return (
                                <article
                                    key={campaign.id}
                                    className={`group grid grid-cols-[minmax(270px,1.6fr)_120px_minmax(170px,1fr)_155px_150px_44px] items-center gap-4 px-5 py-4 transition-all duration-200 ${
                                        rowExiting
                                            ? 'scale-[0.98] -translate-x-2 opacity-0'
                                            : rowPending
                                                ? 'bg-red-50/70 opacity-80'
                                                : 'hover:bg-[#fafbfc]'
                                    }`}
                                >
                                    <div className="flex min-w-0 items-center gap-3.5">
                                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-[#edf1f6] text-[#365f8b]">
                                            <Megaphone className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-black text-[#14233d]">
                                                {campaign.name[language] || campaign.name.en}
                                            </h3>
                                            <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-[#8b9895]">
                                                <Users className="h-3 w-3" />
                                                {campaign.audience.size.toLocaleString(locale)} {t('digital_marketing.redesign.recipient')}
                                            </p>
                                            {rowPending && (
                                                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                                    <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-red-300/50 border-t-red-600" />
                                                    {t('common.deleting')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <span className={`w-fit rounded-full px-2.5 py-1.5 text-[10px] font-black ${statusStyles[campaign.status]}`}>
                                        {t(`digital_marketing.campaigns.statuses.${campaign.status}`)}
                                    </span>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between text-[10px] font-bold">
                                            <span className="text-[#667875]">{t('digital_marketing.redesign.ofGoal')}</span>
                                            <span className="text-[#315b88]">{progress}%</span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-[#e9eeea]">
                                            <div
                                                className={`h-full rounded-full ${progress >= 100 ? 'bg-[#d8a142]' : 'bg-[#426991]'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="mt-1.5 text-[9px] font-semibold text-[#9aa5a3]">
                                            {compactNumber.format(campaign.goal.current)} / {compactNumber.format(campaign.goal.target)}
                                        </p>
                                    </div>

                                    <div className="flex items-center">
                                        {campaign.channels.slice(0, 3).map((channel, index) => {
                                            const Icon = channelIcons[channel as keyof typeof channelIcons] ?? Send;
                                            return (
                                                <span
                                                    key={channel}
                                                    title={channelLabels[channel] ?? channel}
                                                    className={`grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#edf1f6] text-[#42658b] ${index ? '-mr-1.5' : ''}`}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                </span>
                                            );
                                        })}
                                    </div>

                                    <div className="text-[10px] font-bold text-[#637673]">
                                        <p className="flex items-center gap-1.5">
                                            <CalendarRange className="h-3.5 w-3.5 text-[#82918e]" />
                                            {dateFormatter.format(new Date(campaign.startDate))}
                                            <span className="text-[#bcc5c2]">—</span>
                                            {dateFormatter.format(new Date(campaign.endDate))}
                                        </p>
                                        <p className="mt-1.5 truncate text-[#9aa5a3]">{campaign.owner}</p>
                                    </div>

                                    <div className="flex items-center justify-end">
                                        <button
                                            type="button"
                                            onClick={() => deletion.open(campaign)}
                                            disabled={deletion.isRowBusy(campaign.id) || deletion.isPending}
                                            aria-label={t('digital_marketing.redesign.deleteCampaign', { name: campaign.name[language] || campaign.name.en })}
                                            className="grid h-8 w-8 place-items-center rounded-lg text-[#a0aaa8] opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </article>
                            );
                        })}

                        {filteredCampaigns.length === 0 && (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="grid h-14 w-14 place-items-center rounded-[10px] bg-[#edf1f6] text-[#68768b]">
                                    <Search className="h-6 w-6" />
                                </div>
                                <p className="mt-4 text-sm font-black text-[#30445f]">
                                    {t('digital_marketing.campaigns.empty')}
                                </p>
                            </div>
                        )}
                    </div>

                    <footer className="flex items-center justify-between border-t border-[#e7eaf0] bg-[#f8f9fb] px-5 py-3 text-[10px] font-bold text-[#818b9a]">
                        <span>
                            {t('digital_marketing.campaigns.showing', {
                                from: filteredCampaigns.length ? 1 : 0,
                                to: filteredCampaigns.length,
                                total: filteredCampaigns.length,
                            })}
                        </span>
                        <span>{t('digital_marketing.redesign.sortedRecent')}</span>
                    </footer>
                </section>

                <section className="grid grid-cols-[1.1fr_1fr_1fr] overflow-hidden rounded-xl border border-[#dfe3ea] bg-white">
                    <div className="flex items-center gap-3 bg-[#edf1f6] px-5 py-4">
                        <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-white text-[#365f8b] shadow-sm">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-[#263f64]">{t('digital_marketing.channelHealth.title')}</p>
                            <p className="mt-0.5 text-[10px] text-[#83918e]">{t('digital_marketing.redesign.systemsHealthy')}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between border-r border-[#e8ece9] px-5 py-4">
                        <span className="flex items-center gap-2 text-xs font-bold text-[#56637a]"><Mail className="h-4 w-4 text-[#42658b]" />{t('digital_marketing.channelHealth.email')}</span>
                        <strong className="text-sm font-black text-[#315b88]">{MOCK_CHANNEL_HEALTH.email.deliverability}%</strong>
                    </div>
                    <div className="flex items-center justify-between border-r border-[#e8ece9] px-5 py-4">
                        <span className="flex items-center gap-2 text-xs font-bold text-[#56637a]"><MessageCircle className="h-4 w-4 text-[#42658b]" />{t('digital_marketing.channelHealth.whatsapp')}</span>
                        <strong className="text-xs font-black text-[#315b88]">{t('digital_marketing.channelHealth.qualityLevels.high')}</strong>
                    </div>
                </section>
            </div>
            <CreateCampaignWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSubmit={onCreateCampaign}
            />
            <ConfirmationModal
                isOpen={deletion.isOpen}
                onClose={deletion.close}
                onConfirm={handleDelete}
                isConfirming={deletion.isPending}
                title={t('digital_marketing.redesign.deleteTitle')}
                message={t('digital_marketing.redesign.deleteConfirm', {
                    name: deletion.target?.name[language] || deletion.target?.name.en || '',
                })}
                confirmLabel={t('common.delete')}
                confirmingLabel={t('common.deleting')}
            />
        </>
    );
};

export default CampaignsTab;
