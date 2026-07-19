import React from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import { MOCK_MARKETING_METRICS, MOCK_ACTIVITY_FEED } from '../../../data/digitalMarketingData';
import MarketingMetricCard from './MarketingMetricCard';
import RealTimeActivityFeed from './RealTimeActivityFeed';
import QuickActionsPanel from './QuickActionsPanel';

interface MarketingDashboardProps {
    setActiveTab: (tabId: string) => void;
    onOpenCreateCampaign: () => void;
    onOpenCreatePostModal: () => void;
    onOpenSendEmailModal: () => void;
}

const MarketingDashboard: React.FC<MarketingDashboardProps> = ({
    setActiveTab,
    onOpenCreateCampaign,
    onOpenCreatePostModal,
    onOpenSendEmailModal,
}) => {
    useLocalization(['digital_marketing', 'common']);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {MOCK_MARKETING_METRICS.map(metric => (
                    <MarketingMetricCard key={metric.id} metric={metric} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RealTimeActivityFeed activities={MOCK_ACTIVITY_FEED} />
                </div>
                <div className="lg:col-span-1">
                    <QuickActionsPanel
                        onCreateCampaign={onOpenCreateCampaign}
                        onOpenOutreach={() => setActiveTab('outreach')}
                        onOpenCreatePostModal={onOpenCreatePostModal}
                        onOpenSendEmailModal={onOpenSendEmailModal}
                    />
                </div>
            </div>
        </div>
    );
};

export default MarketingDashboard;
