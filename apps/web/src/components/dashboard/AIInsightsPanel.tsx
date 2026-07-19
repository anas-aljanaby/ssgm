import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '../icons/GenericIcons';
import { useLocalization } from '../../hooks/useLocalization';
import type { AiInsightsData, AiInsightItem } from '../../data/aiInsightsData';
import { Target, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';

interface AIInsightsPanelProps {
  insights: AiInsightsData;
  autoRefresh?: boolean;
  onViewMore?: () => void;
}

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^\* (.*)/gm, '<li class="ml-4 rtl:ml-0 rtl:mr-4 list-disc">$1</li>');
    return <div className="text-sm" dangerouslySetInnerHTML={{ __html: html.replace(/\n/g, '<br/>').replace(/<br\/><li/g, '<li') }} />;
};

const ImpactIndicator: React.FC<{ impact: 'high' | 'medium' | 'low' }> = ({ impact }) => {
    const { t } = useLocalization(['dashboard']);
    const config = {
        high: { color: 'bg-red-500', label: t('dashboard.aiInsights.impact.high', 'High') },
        medium: { color: 'bg-yellow-500', label: t('dashboard.aiInsights.impact.medium', 'Medium') },
        low: { color: 'bg-blue-500', label: t('dashboard.aiInsights.impact.low', 'Low') },
    };
    return (
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <div className={`w-2 h-2 rounded-full ${config[impact].color}`}></div>
            <span>{config[impact].label}</span>
        </div>
    );
};

const InsightItem: React.FC<{ item: AiInsightItem }> = ({ item }) => {
    const { t, pickLocalized } = useLocalization(['dashboard']);
    return (
         <div className="space-y-1">
            <SimpleMarkdown text={pickLocalized(item.text)} />
            <div className="flex items-center justify-end gap-3 text-xs text-gray-400 dark:text-gray-500">
                <ImpactIndicator impact={item.impact} />
                <span>{t('dashboard.aiInsights.confidence')}: {(item.confidence * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
};

const InsightSection: React.FC<{ title: string; items: AiInsightItem[]; icon: React.ReactNode; borderColor: string }> = ({ title, items, icon, borderColor }) => (
    <div className={`p-4 bg-white/50 dark:bg-black/20 rounded-lg border-l-4 ${borderColor}`}>
        <h4 className="font-bold flex items-center gap-2">
            {icon}
            {title}
        </h4>
        <div className="mt-2 space-y-3">
            {items.map((item, index) => (
                <InsightItem key={index} item={item} />
            ))}
        </div>
    </div>
);

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
    insights,
    autoRefresh = true,
    onViewMore,
}) => {
    const { t } = useLocalization();
    const [countdown, setCountdown] = useState(300);

    useEffect(() => {
        if (!autoRefresh) return;
        const timer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 300));
        }, 1000);
        return () => clearInterval(timer);
    }, [autoRefresh]);

    const sections = [
        { key: 'opportunities', icon: <Target size={20} className="text-green-500" />, borderColor: 'border-green-500' },
        { key: 'alerts', icon: <AlertTriangle size={20} className="text-yellow-500" />, borderColor: 'border-yellow-500' },
        { key: 'recommendations', icon: <Lightbulb size={20} className="text-blue-500" />, borderColor: 'border-blue-500' },
        { key: 'predictions', icon: <TrendingUp size={20} className="text-purple-500" />, borderColor: 'border-purple-500' },
    ];

    return (
        <div className="bg-card/30 dark:bg-dark-card/30 backdrop-blur-xl p-6 rounded-2xl shadow-soft border border-white/20 dark:border-slate-700/50 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <SparklesIcon className="text-primary dark:text-secondary" />
                    {t('dashboard.aiInsights.title')}
                </h3>
                {autoRefresh && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t('dashboard.aiInsights.refreshingIn', { seconds: countdown })}
                    </span>
                )}
            </div>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                {sections.map(section => (
                    <InsightSection
                        key={section.key}
                        title={t(`dashboard.aiInsights.${section.key === 'predictions' ? 'forecasts' : section.key}`)}
                        items={insights[section.key as keyof AiInsightsData]}
                        icon={section.icon}
                        borderColor={section.borderColor}
                    />
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 dark:border-slate-700/50 text-center">
                <button
                    type="button"
                    onClick={onViewMore}
                    className="text-sm font-semibold text-primary dark:text-secondary hover:underline"
                >
                    {t('dashboard.aiInsights.viewMore')}
                </button>
            </div>
        </div>
    );
};

export default AIInsightsPanel;