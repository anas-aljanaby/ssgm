import React, { useMemo } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { Campaign } from '../../../types';
import CampaignKpiCard from './CampaignKpiCard';
import { PlusCircleIcon } from '../../icons/GenericIcons';

interface CampaignsDashboardProps {
    campaigns: Campaign[];
    statusFilter: string;
    channelFilter: string;
    onStatusFilterChange: (filter: string) => void;
    onChannelFilterChange: (filter: string) => void;
    onOpenWizard: () => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

const CampaignsDashboard: React.FC<CampaignsDashboardProps> = ({
    campaigns,
    statusFilter,
    channelFilter,
    onStatusFilterChange,
    onChannelFilterChange,
    onOpenWizard,
    searchTerm,
    onSearchChange,
}) => {
    const { t } = useLocalization(['digital_marketing', 'common']);

    const stats = useMemo(() => {
        const activeCampaigns = campaigns.filter(c => c.status === 'Active');
        const totalSpend = activeCampaigns.reduce((sum, c) => sum + c.spent, 0);
        const messagesSent = campaigns.reduce((sum, c) => sum + (c.messagesSent ?? 0), 0);
        const withOpenRate = campaigns.filter(c => typeof c.openRate === 'number');
        const avgOpenRate = withOpenRate.length > 0
            ? withOpenRate.reduce((sum, c) => sum + (c.openRate ?? 0), 0) / withOpenRate.length
            : 0;

        return {
            active: activeCampaigns.length,
            spend: totalSpend,
            messagesSent,
            avgOpenRate,
        };
    }, [campaigns]);

    const statusFilters = [
        { id: 'all', label: t('digital_marketing.campaigns.filters.all') },
        { id: 'active', label: t('digital_marketing.campaigns.filters.active') },
        { id: 'endingSoon', label: t('digital_marketing.campaigns.filters.endingSoon') },
    ];

    const channelFilters = [
        { id: 'all', label: t('digital_marketing.campaigns.channels.all') },
        { id: 'email', label: t('digital_marketing.campaigns.channels.email') },
        { id: 'sms', label: t('digital_marketing.campaigns.channels.sms') },
        { id: 'whatsapp', label: t('digital_marketing.campaigns.channels.whatsapp') },
        { id: 'social', label: t('digital_marketing.campaigns.channels.social') },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
                <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">
                    {t('digital_marketing.campaigns.title')}
                </h2>
                <button
                    type="button"
                    onClick={onOpenWizard}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg transition-colors"
                >
                    <PlusCircleIcon /> {t('digital_marketing.campaigns.create')}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <CampaignKpiCard title={t('digital_marketing.campaigns.kpi.active')} value={stats.active} format="number" />
                <CampaignKpiCard title={t('digital_marketing.campaigns.kpi.spend')} value={stats.spend} format="currency" />
                <CampaignKpiCard title={t('digital_marketing.campaigns.kpi.messagesSent')} value={stats.messagesSent} format="number" />
                <CampaignKpiCard title={t('digital_marketing.campaigns.kpi.avgOpenRate')} value={stats.avgOpenRate} format="percentage" />
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {statusFilters.map(filter => (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() => onStatusFilterChange(filter.id)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                statusFilter === filter.id
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" aria-hidden />
                    {channelFilters.map(filter => (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() => onChannelFilterChange(filter.id)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                channelFilter === filter.id
                                    ? 'bg-secondary text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
                <input
                    type="search"
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder={t('digital_marketing.campaigns.searchPlaceholder')}
                    className="w-full max-w-md p-2.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
            </div>
        </div>
    );
};

export default CampaignsDashboard;
