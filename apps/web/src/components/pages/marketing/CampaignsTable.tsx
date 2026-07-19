import React, { useState } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { Campaign, SortDirection } from '../../../types';
import { formatDate } from '../../../lib/utils';
import { ChevronDownIcon } from '../../icons/GenericIcons';
import { TrashIcon } from '../../icons/MarketingIcons';
import CampaignStatusBadge from './CampaignStatusBadge';

interface CampaignsTableProps {
    campaigns: Campaign[];
    sortColumn: keyof Campaign | null;
    sortDirection: SortDirection;
    onSort: (column: keyof Campaign) => void;
    onDelete: (id: string) => void;
}

const CampaignsTable: React.FC<CampaignsTableProps> = ({
    campaigns,
    sortColumn,
    sortDirection,
    onSort,
    onDelete,
}) => {
    const { t, language } = useLocalization(['digital_marketing', 'common']);
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const rowsPerPage = 10;

    const paginatedCampaigns = campaigns.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const totalPages = Math.max(1, Math.ceil(campaigns.length / rowsPerPage));

    const SortableHeader: React.FC<{ column: keyof Campaign; labelKey: string }> = ({ column, labelKey }) => (
        <th scope="col" className="px-6 py-3">
            <div
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => onSort(column)}
            >
                {t(labelKey)}
                {sortColumn === column && (
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                )}
            </div>
        </th>
    );

    const progressPct = (campaign: Campaign) => {
        if (!campaign.goal?.target) return 0;
        return Math.min(100, Math.round((campaign.goal.current / campaign.goal.target) * 100));
    };

    return (
        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft overflow-hidden border border-gray-200 dark:border-slate-700/50">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-card/50 dark:text-gray-400">
                        <tr>
                            <SortableHeader column="name" labelKey="digital_marketing.campaigns.table.name" />
                            <SortableHeader column="status" labelKey="digital_marketing.campaigns.table.status" />
                            <th scope="col" className="px-6 py-3">{t('digital_marketing.campaigns.table.channel')}</th>
                            <SortableHeader column="startDate" labelKey="digital_marketing.campaigns.table.duration" />
                            <th scope="col" className="px-6 py-3">{t('digital_marketing.campaigns.table.audience')}</th>
                            <th scope="col" className="px-6 py-3">{t('digital_marketing.campaigns.table.progress')}</th>
                            <SortableHeader column="owner" labelKey="digital_marketing.campaigns.table.owner" />
                            <th scope="col" className="px-6 py-3 text-right">{t('digital_marketing.campaigns.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedCampaigns.map(campaign => (
                            <tr key={campaign.id} className="bg-card dark:bg-dark-card border-b dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                                <td className="px-6 py-4 font-bold text-foreground dark:text-dark-foreground">
                                    {campaign.name[language] || campaign.name.en}
                                </td>
                                <td className="px-6 py-4"><CampaignStatusBadge status={campaign.status} /></td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {campaign.channels.map(ch => (
                                            <span
                                                key={ch}
                                                className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
                                            >
                                                {ch}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {formatDate(campaign.startDate, language)} – {formatDate(campaign.endDate, language)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-foreground dark:text-dark-foreground">{campaign.audience.size.toLocaleString()}</div>
                                    <div className="text-xs text-gray-400">{campaign.audience.name}</div>
                                </td>
                                <td className="px-6 py-4 min-w-[120px]">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-slate-700">
                                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progressPct(campaign)}%` }} />
                                    </div>
                                    <div className="text-xs text-right mt-1">{progressPct(campaign)}%</div>
                                </td>
                                <td className="px-6 py-4">{campaign.owner}</td>
                                <td className="px-6 py-4 text-right">
                                    {confirmDeleteId === campaign.id ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { onDelete(campaign.id); setConfirmDeleteId(null); }}
                                                className="px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded"
                                            >
                                                {t('common.confirm')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="px-2 py-1 text-xs font-semibold border rounded dark:border-slate-600"
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId(campaign.id)}
                                            className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                                            aria-label={t('common.delete')}
                                        >
                                            <TrashIcon />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {campaigns.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {t('digital_marketing.campaigns.empty')}
                    </div>
                )}
            </div>
            {campaigns.length > 0 && (
                <nav className="flex items-center justify-between p-4" aria-label="Table navigation">
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        {t('digital_marketing.campaigns.showing', {
                            from: Math.min((currentPage - 1) * rowsPerPage + 1, campaigns.length),
                            to: Math.min(currentPage * rowsPerPage, campaigns.length),
                            total: campaigns.length,
                        })}
                    </span>
                    <ul className="inline-flex items-center -space-x-px">
                        <li>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 ml-0 leading-tight border rounded-l-lg disabled:opacity-50"
                            >
                                {t('common.previous')}
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 leading-tight border rounded-r-lg disabled:opacity-50"
                            >
                                {t('common.next')}
                            </button>
                        </li>
                    </ul>
                </nav>
            )}
        </div>
    );
};

export default CampaignsTable;
