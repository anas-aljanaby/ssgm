import React from 'react';
import type { SocialAccount } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { formatNumber } from '../../../../lib/utils';
import { FacebookIcon, InstagramIcon, TwitterIcon, LinkedinIcon, YoutubeIcon, TiktokIcon } from '../../../icons/SocialMediaIcons';

const platformIcons: Record<string, React.FC> = {
    facebook: FacebookIcon,
    instagram: InstagramIcon,
    twitter: TwitterIcon,
    linkedin: LinkedinIcon,
    youtube: YoutubeIcon,
    tiktok: TiktokIcon,
};

const AccountCard: React.FC<{ account: SocialAccount }> = ({ account }) => {
    const { t, language } = useLocalization(['digital_marketing', 'common']);
    const Icon = platformIcons[account.id];

    const isConnected = account.status === 'connected';

    return (
        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft border border-gray-200 dark:border-slate-700/50 p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    {Icon && <Icon />}
                    <span className="font-bold text-lg">{account.name}</span>
                </div>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {t(`digital_marketing.social.statuses.${account.status}`)}
                </span>
            </div>
            
            {isConnected ? (
                <div className="mt-4">
                    <div className="flex items-center gap-3">
                        <img src={account.profile.avatar} alt={account.profile.name} className="w-12 h-12 rounded-full" loading="lazy" />
                        <div>
                            <p className="font-semibold">{account.profile.name}</p>
                            <p className="text-sm text-gray-500">{account.profile.handle}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-baseline mt-4">
                        <div>
                            <p className="text-2xl font-bold">{formatNumber(account.stats.followers, language)}</p>
                            <p className="text-xs text-gray-500">{t('digital_marketing.social.followers')}</p>
                        </div>
                        <p className={`text-sm font-bold ${account.stats.followerTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {account.stats.followerTrend >= 0 ? '▲' : '▼'} {Math.abs(account.stats.followerTrend)}%
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center mt-4">
                    <p className="text-sm text-gray-500 mb-3">{t('digital_marketing.social.connectAccountHelp', { platform: account.name })}</p>
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg">
                        {t('digital_marketing.social.connect')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AccountCard;