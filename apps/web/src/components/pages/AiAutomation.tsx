import React, { useEffect, useState } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import Tabs from '../common/Tabs';
import AiAssistant from './ai/AiAssistant';
import AIInsightsGenerator from './ai/AIInsightsGenerator';
import DataQuality from './ai/DataQuality';
import AutomationsTab from './ai/AutomationsTab';
import AnomalyDetectionPage from './AnomalyDetectionPage';

const TAB_IDS = ['assistant', 'insights', 'data_quality', 'automations', 'anomalies'] as const;
type TabId = (typeof TAB_IDS)[number];

interface AiAutomationProps {
    setActiveModule?: (module: string) => void;
    initialTab?: string;
}

const AiAutomation: React.FC<AiAutomationProps> = ({
    setActiveModule = () => undefined,
    initialTab,
}) => {
    const { t } = useLocalization(['ai_automation', 'anomaly_detection', 'common']);
    const [activeTab, setActiveTab] = useState<TabId>(() =>
        initialTab && (TAB_IDS as readonly string[]).includes(initialTab)
            ? (initialTab as TabId)
            : 'assistant',
    );

    useEffect(() => {
        if (initialTab && (TAB_IDS as readonly string[]).includes(initialTab)) {
            setActiveTab(initialTab as TabId);
        }
    }, [initialTab]);

    const tabs = TAB_IDS.map((id) => ({
        id,
        label: t(`ai_automation.tabs.${id}`),
    }));

    const renderContent = () => {
        switch (activeTab) {
            case 'assistant':
                return <AiAssistant setActiveModule={setActiveModule} />;
            case 'insights':
                return <AIInsightsGenerator />;
            case 'data_quality':
                return <DataQuality />;
            case 'automations':
                return <AutomationsTab />;
            case 'anomalies':
                return <AnomalyDetectionPage embedded />;
            default:
                return null;
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">
                    {t('ai_automation.title')}
                </h1>
                <p className="mt-2 max-w-3xl text-gray-500 dark:text-gray-400">
                    {t('ai_automation.description')}
                </p>
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onTabClick={(id) => setActiveTab(id as TabId)} />

            <div className="mt-4">{renderContent()}</div>
        </div>
    );
};

export default AiAutomation;
