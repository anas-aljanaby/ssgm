import React from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import { MOCK_CHANNEL_HEALTH } from '../../../data/digitalMarketingData';
import { formatCurrency, formatNumber } from '../../../lib/utils';

const ChannelHealthStrip: React.FC = () => {
    const { t, language } = useLocalization(['digital_marketing', 'common']);
    const { email, sms, whatsapp } = MOCK_CHANNEL_HEALTH;

    const items = [
        {
            label: t('digital_marketing.channelHealth.email'),
            value: email.deliverability != null
                ? `${formatNumber(email.deliverability, language)}% ${t('digital_marketing.channelHealth.deliverability')}`
                : '—',
        },
        {
            label: t('digital_marketing.channelHealth.sms'),
            value: sms.balance != null
                ? `${formatCurrency(sms.balance, language)} · ${sms.provider}`
                : '—',
        },
        {
            label: t('digital_marketing.channelHealth.whatsapp'),
            value: whatsapp.quality
                ? `${t('digital_marketing.channelHealth.quality')}: ${t(`digital_marketing.channelHealth.qualityLevels.${whatsapp.quality.toLowerCase()}`)}`
                : '—',
        },
    ];

    return (
        <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                <span className="font-semibold text-foreground dark:text-dark-foreground">
                    {t('digital_marketing.channelHealth.title')}
                </span>
                {items.map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                        <span className="font-medium text-foreground dark:text-dark-foreground">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChannelHealthStrip;
