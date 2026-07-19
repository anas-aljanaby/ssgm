import React from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatNumber, formatCurrency } from '../../../lib/utils';
import { useCountUp } from '../../../hooks/useCountUp';

interface CampaignKpiCardProps {
    title: string;
    value: number;
    format: 'number' | 'currency' | 'percentage';
}

const CampaignKpiCard: React.FC<CampaignKpiCardProps> = ({ title, value, format }) => {
    const { language } = useLocalization();
    const animatedValue = useCountUp(value, 1500);

    const formatValue = (val: number) => {
        switch (format) {
            case 'currency': return formatCurrency(val, language);
            case 'percentage': return `${val.toFixed(1)}%`;
            case 'number':
            default:
                 return formatNumber(Math.round(val), language);
        }
    };

    return (
        <div className="bg-card dark:bg-dark-card p-5 rounded-2xl shadow-soft">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">{title}</h3>
            <p className="text-3xl font-bold text-foreground dark:text-dark-foreground mt-2">
                {formatValue(animatedValue)}
            </p>
        </div>
    );
};

export default CampaignKpiCard;