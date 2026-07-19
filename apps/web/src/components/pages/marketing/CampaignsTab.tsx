import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { Campaign, SortDirection } from '../../../types';
import CampaignsDashboard from './CampaignsDashboard';
import CampaignsTable from './CampaignsTable';
import ChannelHealthStrip from './ChannelHealthStrip';
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
    const { language } = useLocalization(['digital_marketing', 'common']);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<keyof Campaign | null>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [channelFilter, setChannelFilter] = useState('all');

    useEffect(() => {
        if (openWizard) {
            setIsWizardOpen(true);
            onWizardOpened?.();
        }
    }, [openWizard, onWizardOpened]);

    const filteredAndSortedCampaigns = useMemo(() => {
        let filtered = campaigns.filter(campaign => {
            const searchLower = searchTerm.toLowerCase();
            const name = campaign.name[language] || campaign.name.en;
            return name.toLowerCase().includes(searchLower) ||
                   campaign.owner.toLowerCase().includes(searchLower);
        });

        if (statusFilter !== 'all') {
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(c => {
                switch (statusFilter) {
                    case 'active': return c.status === 'Active';
                    case 'endingSoon': {
                        const endDate = new Date(c.endDate);
                        return c.status === 'Active' && endDate > now && endDate <= thirtyDaysFromNow;
                    }
                    default: return true;
                }
            });
        }

        if (channelFilter !== 'all') {
            filtered = filtered.filter(c =>
                c.channels.some(ch => ch.toLowerCase() === channelFilter.toLowerCase())
            );
        }

        if (sortColumn) {
            filtered = [...filtered].sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];

                if (sortColumn === 'name') {
                    const aName = a.name[language] || a.name.en;
                    const bName = b.name[language] || b.name.en;
                    return sortDirection === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
                }

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                }

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    if (sortColumn === 'startDate' || sortColumn === 'endDate' || sortColumn === 'createdAt') {
                        return sortDirection === 'asc'
                            ? new Date(aVal).getTime() - new Date(bVal).getTime()
                            : new Date(bVal).getTime() - new Date(aVal).getTime();
                    }
                    return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }

                return 0;
            });
        }

        return filtered;
    }, [campaigns, searchTerm, sortColumn, sortDirection, language, statusFilter, channelFilter]);

    const handleSort = useCallback((column: keyof Campaign) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }, [sortColumn]);

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                <CampaignsDashboard
                    campaigns={campaigns}
                    statusFilter={statusFilter}
                    channelFilter={channelFilter}
                    onStatusFilterChange={setStatusFilter}
                    onChannelFilterChange={setChannelFilter}
                    onOpenWizard={() => setIsWizardOpen(true)}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />

                <ChannelHealthStrip />

                <CampaignsTable
                    campaigns={filteredAndSortedCampaigns}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    onDelete={onDeleteCampaign}
                />
            </div>
            <CreateCampaignWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSubmit={onCreateCampaign}
            />
        </>
    );
};

export default CampaignsTab;
