import React from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import {
    CalendarPlusIcon,
    PaperPlaneIcon,
    MegaphoneIcon,
} from '../../icons/MarketingIcons';
import { SparklesIcon } from '../../icons/GenericIcons';

interface QuickActionsPanelProps {
    onCreateCampaign: () => void;
    onOpenOutreach: () => void;
    onOpenCreatePostModal: () => void;
    onOpenSendEmailModal: () => void;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
    onCreateCampaign,
    onOpenOutreach,
    onOpenCreatePostModal,
    onOpenSendEmailModal,
}) => {
    const { t } = useLocalization(['digital_marketing', 'common']);

    const actions = [
        { label: t('digital_marketing.quickActions.createCampaign'), icon: <MegaphoneIcon />, action: onCreateCampaign },
        { label: t('digital_marketing.quickActions.quickEmail'), icon: <PaperPlaneIcon />, action: onOpenSendEmailModal },
        { label: t('digital_marketing.quickActions.openOutreach'), icon: <SparklesIcon />, action: onOpenOutreach },
        { label: t('digital_marketing.quickActions.scheduleSocial'), icon: <CalendarPlusIcon />, action: onOpenCreatePostModal },
    ];

    return (
        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft h-full border border-gray-200 dark:border-slate-700/50">
            <h3 className="text-lg font-bold p-4 border-b dark:border-slate-700">{t('digital_marketing.quickActions.title')}</h3>
            <div className="p-4 grid grid-cols-2 gap-4">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={action.action}
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg text-center hover:bg-primary-light/50 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-secondary-light transition-all duration-200 group"
                    >
                        <div className="p-3 bg-white dark:bg-slate-700 rounded-full mb-2 group-hover:scale-110 transition-transform">
                            {action.icon}
                        </div>
                        <span className="text-xs font-semibold">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActionsPanel;
