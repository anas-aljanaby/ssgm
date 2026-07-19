import React, { useState, useMemo } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import AiCard from './AiCard';
import Spinner from '../../common/Spinner';
import { SparklesIcon } from '../../icons/GenericIcons';
import { ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react';
import {
    MOCK_GENERATED_INSIGHTS,
    type GeneratedInsight,
    type InsightCategory,
} from '../../../data/aiAutomationInsightsData';

const categoryConfig: Record<InsightCategory, { icon: string; color: string }> = {
    Achievements: { icon: '🏆', color: 'border-green-500' },
    Warnings: { icon: '⚠️', color: 'border-red-500' },
    Opportunities: { icon: '🎯', color: 'border-blue-500' },
    Predictions: { icon: '📈', color: 'border-purple-500' },
};

const AIInsightsGenerator: React.FC = () => {
    const { t, language } = useLocalization(['ai_automation', 'common']);
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [insights, setInsights] = useState<GeneratedInsight[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

    const handleGenerate = async () => {
        setIsLoading(true);
        setInsights(null);
        setError(null);

        try {
            // Static demo insights — ACTIVATE generates from live module aggregates.
            await new Promise((r) => setTimeout(r, 800));
            setInsights(MOCK_GENERATED_INSIGHTS);
        } catch (err) {
            console.error('Error generating insights:', err);
            setError(t('ai_automation.insights.error'));
            toast.showError(t('ai_automation.insights.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExplanation = (key: string) => {
        setExpandedInsights((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const groupedInsights = useMemo(() => {
        if (!insights) return {};
        return insights.reduce(
            (acc, insight) => {
                (acc[insight.category] = acc[insight.category] || []).push(insight);
                return acc;
            },
            {} as Record<InsightCategory, GeneratedInsight[]>,
        );
    }, [insights]);

    const lang = language === 'ar' ? 'ar' : 'en';

    return (
        <AiCard
            title={t('ai_automation.insights.title')}
            icon={<SparklesIcon className="text-primary w-6 h-6" />}
        >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t('ai_automation.insights.description')}
            </p>
            <div className="text-center">
                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="px-6 py-3 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-secondary-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Spinner text={t('ai_automation.insights.generating')} />
                    ) : (
                        t('ai_automation.insights.generateButton')
                    )}
                </button>
            </div>

            {error && (
                <div className="mt-4 p-4 text-center text-red-600 bg-red-100 dark:bg-red-900/50 rounded-lg">
                    {error}
                </div>
            )}

            {insights && (
                <div className="mt-6 space-y-6">
                    <h3 className="text-xl font-bold">{t('ai_automation.insights.resultsTitle')}</h3>
                    {Object.keys(groupedInsights).length > 0 ? (
                        Object.entries(groupedInsights).map(([category, items]) => (
                            <div key={category}>
                                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    {categoryConfig[category as InsightCategory].icon}
                                    {t(`ai_automation.insights.categories.${category}`)}
                                </h4>
                                <div className="space-y-4">
                                    {(items as GeneratedInsight[]).map((insight, index) => {
                                        const key = `${category}-${index}`;
                                        return (
                                            <div
                                                key={key}
                                                className={`p-4 rounded-lg border-l-4 ${categoryConfig[category as InsightCategory].color} bg-gray-50 dark:bg-slate-800/50`}
                                            >
                                                <p>{insight.text[lang]}</p>
                                                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                                                    <div className="flex items-center gap-4">
                                                        <span>
                                                            {t('ai_automation.insights.confidence')}:{' '}
                                                            {insight.confidence}%
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExplanation(key)}
                                                            className="flex items-center gap-1 font-semibold hover:underline"
                                                        >
                                                            {t('ai_automation.insights.explain')}{' '}
                                                            <ChevronDown
                                                                className={`w-4 h-4 transition-transform ${expandedInsights.has(key) ? 'rotate-180' : ''}`}
                                                            />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span>
                                                            {t('ai_automation.insights.helpful')}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toast.showSuccess(
                                                                    t(
                                                                        'ai_automation.insights.feedbackThanks',
                                                                    ),
                                                                )
                                                            }
                                                            className="p-1 rounded-full hover:bg-green-100"
                                                        >
                                                            <ThumbsUp size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toast.showSuccess(
                                                                    t(
                                                                        'ai_automation.insights.feedbackThanks',
                                                                    ),
                                                                )
                                                            }
                                                            className="p-1 rounded-full hover:bg-red-100"
                                                        >
                                                            <ThumbsDown size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {expandedInsights.has(key) && (
                                                    <div className="mt-2 p-3 bg-white dark:bg-slate-700 rounded-md text-xs italic">
                                                        {insight.reasoning[lang]}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-8">
                            {t('ai_automation.insights.noResults')}
                        </p>
                    )}
                </div>
            )}

            {!insights && !isLoading && !error && (
                <p className="text-center text-gray-500 py-8 mt-4">
                    {t('ai_automation.insights.noResults')}
                </p>
            )}
        </AiCard>
    );
};

export default AIInsightsGenerator;
