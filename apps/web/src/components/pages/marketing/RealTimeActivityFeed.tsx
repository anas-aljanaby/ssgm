
import React from 'react';
import type { ActivityFeedItem, ActivityFeedItemType } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import {
    DollarSignIcon,
    PaperPlaneIcon,
    ThumbsUpIcon,
    MegaphoneIcon,
    FileClickIcon,
    MessageSquareIcon,
    ClipboardListIcon,
} from '../../icons/MarketingIcons';

interface RealTimeActivityFeedProps {
    activities: ActivityFeedItem[];
}

const RealTimeActivityFeed: React.FC<RealTimeActivityFeedProps> = ({ activities }) => {
    const { t, language } = useLocalization(['digital_marketing', 'common']);
    
    const ICONS: Record<ActivityFeedItemType, React.FC> = {
        donation: DollarSignIcon,
        emailSent: PaperPlaneIcon,
        socialPost: ThumbsUpIcon,
        adStarted: MegaphoneIcon,
        landingPage: FileClickIcon,
        comment: MessageSquareIcon,
        formSubmission: ClipboardListIcon,
    };
    
    const COLORS: Record<ActivityFeedItemType, string> = {
        donation: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300',
        emailSent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
        socialPost: 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300',
        adStarted: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300',
        landingPage: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300',
        comment: 'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300',
        formSubmission: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300',
    };

    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    return (
        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft h-full border border-gray-200 dark:border-slate-700/50">
            <h3 className="text-lg font-bold p-4 border-b dark:border-slate-700">{t('digital_marketing.activityFeed.title')}</h3>
            <ul className="p-4 space-y-4">
                {activities.map(activity => {
                    const Icon = ICONS[activity.type];
                    const color = COLORS[activity.type];
                    return (
                        <li key={activity.id} className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${color}`}>
                                <Icon />
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm">
                                    {activity.description[language]} <a href={activity.link} className="font-bold text-primary hover:underline">{activity.subject}</a>
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{timeSince(activity.timestamp)}</p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default RealTimeActivityFeed;