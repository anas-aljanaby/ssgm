
import React from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
// FIX: Corrected import to CampaignStatus and added Scheduled status to config.
import type { CampaignStatus } from '../../../types';
import {
    DraftIcon,
    ClockIcon,
    PlayIcon,
    PauseIcon,
    CheckCircleIcon,
} from '../../icons/MarketingIcons';

interface CampaignStatusBadgeProps {
    status: CampaignStatus;
}

const CampaignStatusBadge: React.FC<CampaignStatusBadgeProps> = ({ status }) => {
    const { t } = useLocalization(['digital_marketing', 'common']);

    const statusConfig: Record<CampaignStatus, { icon: React.FC; color: string; pulse?: boolean }> = {
        Draft: { icon: DraftIcon, color: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
        Scheduled: { icon: ClockIcon, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
        Active: { icon: PlayIcon, color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', pulse: true },
        Paused: { icon: PauseIcon, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' },
        Completed: { icon: CheckCircleIcon, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
    };

    const config = statusConfig[status];
    if (!config) {
        return null; // or a default badge
    }
    const { icon: Icon, color, pulse } = config;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${color}`}>
            <Icon />
            {t(`digital_marketing.campaigns.statuses.${status}`)}
            {pulse && <span className="relative -top-0.5 -right-0.5 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}
        </span>
    );
};

export default CampaignStatusBadge;
