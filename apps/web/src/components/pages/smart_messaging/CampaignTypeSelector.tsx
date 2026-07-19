
import React from 'react';
import type { MessageType } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { ThankYouIcon, ImpactIcon, RequestIcon, WinBackIcon, MilestoneIcon } from '../../icons/CampaignIcons';

interface CampaignTypeSelectorProps {
    selectedType: MessageType | null;
    onSelectType: (type: MessageType) => void;
}

const CampaignTypeSelector: React.FC<CampaignTypeSelectorProps> = ({ selectedType, onSelectType }) => {
    const { t } = useLocalization(['smart_messaging', 'common']);

    const campaignTypes = [
        { id: 'thank_you', title: t('smart_messaging.campaign_types.thank_you'), subtitle: t('smart_messaging.campaign_types.thank_you_sub'), icon: <ThankYouIcon />, color: 'green-500' },
        { id: 'update', title: t('smart_messaging.campaign_types.update'), subtitle: t('smart_messaging.campaign_types.update_sub'), icon: <ImpactIcon />, color: 'blue-500' },
        { id: 'request', title: t('smart_messaging.campaign_types.request'), subtitle: t('smart_messaging.campaign_types.request_sub'), icon: <RequestIcon />, color: 'orange-500' },
        { id: 're_engagement', title: t('smart_messaging.campaign_types.re_engagement'), subtitle: t('smart_messaging.campaign_types.re_engagement_sub'), icon: <WinBackIcon />, color: 'red-500' },
        { id: 'milestone', title: t('smart_messaging.campaign_types.milestone'), subtitle: t('smart_messaging.campaign_types.milestone_sub'), icon: <MilestoneIcon />, color: 'purple-500' },
    ] as const;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {campaignTypes.map(type => (
                <button
                    key={type.id}
                    onClick={() => onSelectType(type.id)}
                    className={`relative p-4 h-36 flex flex-col items-center justify-center text-center rounded-2xl border-2 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4
                        ${selectedType === type.id 
                            ? `border-green-500 ring-4 ring-green-500/20 bg-white dark:bg-slate-800` 
                            : 'border-gray-200 dark:border-slate-700 bg-card dark:bg-dark-card hover:shadow-lg'
                        }`
                    }
                >
                    <div className={`text-${type.color}`}>{type.icon}</div>
                    <h3 className="font-bold mt-2 text-foreground dark:text-dark-foreground">{type.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{type.subtitle}</p>
                </button>
            ))}
        </div>
    );
};

export default CampaignTypeSelector;
