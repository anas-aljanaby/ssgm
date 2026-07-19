
import React from 'react';
import type { MarketingMetric } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatNumber, formatCurrency } from '../../../lib/utils';
import { useCountUp } from '../../../hooks/useCountUp';

interface MarketingMetricCardProps {
    metric: MarketingMetric;
}

const MarketingMetricCard: React.FC<MarketingMetricCardProps> = ({ metric }) => {
    const { t, language } = useLocalization(['digital_marketing', 'common']);
    const animatedValue = useCountUp(metric.value, 1500);

    const formatValue = (value: number) => {
        switch (metric.format) {
            case 'currency': return formatCurrency(value, language);
            case 'percentage': return `${value.toFixed(1)}%`;
            case 'number':
            default:
                return value > 10000 ? `${(value / 1000).toFixed(1)}k` : formatNumber(value, language);
        }
    };
    
    const isPositive = metric.trend >= 0;

    return (
        <div className="bg-card dark:bg-dark-card p-5 rounded-2xl shadow-soft transition-transform hover:-translate-y-1 duration-300">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{t(`digital_marketing.kpi.${metric.id}`)}</h3>
            <div className="flex justify-between items-baseline">
                <p className="text-3xl font-bold text-foreground dark:text-dark-foreground">
                    {formatValue(animatedValue)}
                </p>
                <div className={`flex items-center text-sm font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '▲' : '▼'} {Math.abs(metric.trend)}%
                </div>
            </div>
             <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('digital_marketing.kpi.vsLast30d')}</p>
             {/* Placeholder for Sparkline */}
             <div className="h-8 mt-2 bg-gray-100 dark:bg-slate-700/50 rounded-md"></div>
        </div>
    );
};

export default MarketingMetricCard;
