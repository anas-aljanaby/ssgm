
import React, { useState, useMemo } from 'react';
import type { SocialPost } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { FacebookIcon, InstagramIcon, TwitterIcon } from '../../../icons/SocialMediaIcons';
import { ChevronDownIcon } from '../../../icons/GenericIcons';

const platformIcons: Record<string, React.FC<{className?: string}>> = {
    facebook: FacebookIcon,
    instagram: InstagramIcon,
    twitter: TwitterIcon,
};

interface SocialCalendarProps {
    posts: SocialPost[];
    openComposer: (date?: Date) => void;
}

const SocialCalendar: React.FC<SocialCalendarProps> = ({ posts, openComposer }) => {
    const { t, language } = useLocalization(['digital_marketing', 'common']);
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const postsByDate = useMemo(() => {
        const grouped: Record<string, SocialPost[]> = {};
        posts.forEach(post => {
            const dateKey = new Date(post.scheduledTime).toISOString().split('T')[0];
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(post);
        });
        return grouped;
    }, [posts]);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const calendarDays = useMemo(() => {
        const days = [];
        let day = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            days.push(new Date(day));
            day.setDate(day.getDate() + 1);
        }
        return days;
    }, [startDate]);

    const dayNames = useMemo(() => {
        const formatter = new Intl.DateTimeFormat(language, { weekday: 'short' });
        return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2023, 0, i + 1)));
    }, [language]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const handleToday = () => setCurrentDate(new Date());

    return (
        <div className="bg-card dark:bg-dark-card p-4 sm:p-6 rounded-2xl shadow-soft border border-gray-200 dark:border-slate-700/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} title={t('leadership.previousMonth')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                        <span className="transform rtl:-rotate-90 ltr:rotate-90 inline-block"><ChevronDownIcon /></span>
                    </button>
                    <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground text-center w-48">
                        {new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(currentDate)}
                    </h2>
                    <button onClick={handleNextMonth} title={t('leadership.nextMonth')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                        <span className="transform rtl:rotate-90 ltr:-rotate-90 inline-block"><ChevronDownIcon /></span>
                    </button>
                    <button onClick={handleToday} className="px-4 py-1.5 text-sm font-semibold border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
                        {t('leadership.today')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {dayNames.map(dayName => (
                    <div key={dayName} className="text-center py-2 bg-gray-50 dark:bg-slate-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{dayName}</div>
                ))}

                {calendarDays.map((day, index) => {
                    const dateKey = day.toISOString().split('T')[0];
                    const postsForDay = postsByDate[dateKey] || [];
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = day.toDateString() === new Date().toDateString();

                    return (
                        <div key={index} onClick={() => openComposer(day)} className={`relative p-2 h-28 sm:h-36 bg-card dark:bg-dark-card cursor-pointer transition-colors hover:bg-primary-light/30 dark:hover:bg-primary/10 ${!isCurrentMonth ? 'bg-gray-50 dark:bg-slate-800/50' : ''}`}>
                            <span className={`text-sm font-semibold flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-primary text-white' : ''} ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                                {day.getDate()}
                            </span>
                            <div className="mt-1 space-y-1">
                                {postsForDay.slice(0, 3).map(post => {
                                    const Icon = platformIcons[post.platform];
                                    return (
                                        <div key={post.id} className="flex items-center gap-1 text-xs truncate">
                                            {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
                                            <span className="truncate">{post.content}</span>
                                        </div>
                                    );
                                })}
                                {postsForDay.length > 3 && <div className="text-xs text-gray-500 font-bold mt-1">+{postsForDay.length-3} more</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SocialCalendar;
