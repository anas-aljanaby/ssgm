import React, { useState } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import { PlusCircleIcon } from '../../icons/GenericIcons';
import SocialDashboard from './social/SocialDashboard';
import SocialCalendar from './social/SocialCalendar';
import type { SocialPost } from '../../../types';

interface SocialMediaTabProps {
    posts: SocialPost[];
    openComposer: (date?: Date) => void;
}

const SocialMediaTab: React.FC<SocialMediaTabProps> = ({ posts, openComposer }) => {
    const { t } = useLocalization(['digital_marketing', 'common']);
    const [view, setView] = useState<'accounts' | 'calendar'>('accounts');

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="p-1 bg-gray-200 dark:bg-slate-700 rounded-lg flex">
                    <button
                        type="button"
                        onClick={() => setView('accounts')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'accounts' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}
                    >
                        {t('digital_marketing.social.connectedAccounts')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('calendar')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'calendar' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}
                    >
                        {t('digital_marketing.social.calendar')}
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => openComposer()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors shadow-sm"
                >
                    <PlusCircleIcon /> {t('digital_marketing.social.createPost')}
                </button>
            </div>

            {view === 'accounts' ? <SocialDashboard /> : <SocialCalendar posts={posts} openComposer={openComposer} />}
        </div>
    );
};

export default SocialMediaTab;
