import React from 'react';
import {
    ArrowLeft,
    ArrowUpLeft,
    CalendarDays,
    CircleDollarSign,
    Clock3,
    Mail,
    Megaphone,
    MessageSquareText,
    Send,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { MOCK_MARKETING_METRICS, MOCK_ACTIVITY_FEED } from '../../../data/digitalMarketingData';
import { MOCK_CAMPAIGNS } from '../../../data/campaignsData';

interface MarketingDashboardProps {
    setActiveTab: (tabId: string) => void;
    onOpenCreateCampaign: () => void;
    onOpenCreatePostModal: () => void;
    onOpenSendEmailModal: () => void;
}

const MarketingDashboard: React.FC<MarketingDashboardProps> = ({
    setActiveTab,
    onOpenCreateCampaign,
    onOpenCreatePostModal,
    onOpenSendEmailModal,
}) => {
    const { t, language } = useLocalization(['digital_marketing', 'common']);
    const featuredCampaign = MOCK_CAMPAIGNS.find(campaign => campaign.status === 'Active') ?? MOCK_CAMPAIGNS[0];
    const featuredProgress = Math.min(
        100,
        Math.round((featuredCampaign.goal.current / featuredCampaign.goal.target) * 100),
    );
    const compactNumber = new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
    });

    const supportingMetrics = [
        {
            id: 'campaignsActive',
            value: MOCK_MARKETING_METRICS[1].value.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US'),
            trend: t('digital_marketing.redesign.metricCampaignNote'),
            icon: Megaphone,
            accent: '#e7a83e',
        },
        {
            id: 'emailPerformance',
            value: `${MOCK_MARKETING_METRICS[2].value}%`,
            trend: t('digital_marketing.redesign.metricOpenNote'),
            icon: Mail,
            accent: '#d66c55',
        },
        {
            id: 'messagesSent',
            value: compactNumber.format(MOCK_MARKETING_METRICS[3].value),
            trend: `+${MOCK_MARKETING_METRICS[3].trend}%`,
            icon: Send,
            accent: '#42658f',
        },
    ];

    const activityIcons = {
        donation: CircleDollarSign,
        emailSent: Mail,
        socialPost: MessageSquareText,
    };

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-12 gap-5">
                <section className="relative col-span-8 min-h-[330px] overflow-hidden rounded-xl bg-[#142542] p-7 text-white shadow-[0_24px_60px_rgba(20,37,66,0.16)]">
                    <div
                        className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full opacity-40 blur-3xl"
                        style={{ background: 'radial-gradient(circle, #456993 0%, transparent 68%)' }}
                    />
                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div className="flex items-start justify-between gap-6">
                            <div>
                                <div className="mb-5 flex items-center gap-2 text-xs font-bold text-[#becbde]">
                                    <Sparkles className="h-4 w-4 text-[#f0b95c]" />
                                    {t('digital_marketing.redesign.performanceTitle')}
                                </div>
                                <p className="text-sm text-[#bdc9da]">
                                    {t('digital_marketing.kpi.digitalDonations')}
                                </p>
                                <div className="mt-2 flex items-end gap-3">
                                    <strong className="text-[3.35rem] font-black leading-none tracking-[-0.05em]">
                                        {MOCK_MARKETING_METRICS[0].value.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                    </strong>
                                    <span className="pb-1 text-sm font-bold text-[#e0e6ef]">
                                        {t('digital_marketing.redesign.sar')}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-[#d8a343] px-2.5 py-1 font-black text-[#182238]">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        {MOCK_MARKETING_METRICS[0].trend}%
                                    </span>
                                    <span className="text-[#a5b4ca]">
                                        {t('digital_marketing.kpi.vsLast30d')}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenCreateCampaign}
                                className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold backdrop-blur-sm transition hover:bg-white/20"
                            >
                                {t('digital_marketing.quickActions.createCampaign')}
                                <ArrowUpLeft className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="relative mt-8 h-28" aria-hidden="true">
                            <div className="absolute inset-x-0 bottom-0 flex justify-between border-b border-white/10 pb-2 text-[10px] text-[#93a3bb]">
                                <span>{t('digital_marketing.redesign.week4')}</span>
                                <span>{t('digital_marketing.redesign.week3')}</span>
                                <span>{t('digital_marketing.redesign.week2')}</span>
                                <span>{t('digital_marketing.redesign.week1')}</span>
                            </div>
                            <svg className="absolute inset-x-0 top-0 h-24 w-full" viewBox="0 0 700 100" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="marketingArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#e7a83e" stopOpacity="0.42" />
                                        <stop offset="100%" stopColor="#e7a83e" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d="M0,80 C70,77 98,51 158,60 C222,70 247,23 314,38 C378,52 404,64 464,39 C530,12 574,40 625,20 C655,8 680,12 700,7 L700,100 L0,100 Z" fill="url(#marketingArea)" />
                                <path d="M0,80 C70,77 98,51 158,60 C222,70 247,23 314,38 C378,52 404,64 464,39 C530,12 574,40 625,20 C655,8 680,12 700,7" fill="none" stroke="#f0b95c" strokeWidth="3" strokeLinecap="round" />
                                <circle cx="700" cy="7" r="5" fill="#f0b95c" stroke="#142542" strokeWidth="3" />
                            </svg>
                        </div>
                    </div>
                </section>

                <section className="col-span-4 flex flex-col rounded-xl border border-[#dfe3ea] bg-white p-6 shadow-[0_16px_45px_rgba(19,36,66,0.06)]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-black text-[#d28c2f]">
                                {t('digital_marketing.redesign.campaignPulse')}
                            </p>
                            <h2 className="mt-2 text-xl font-black leading-8 text-[#14233d]">
                                {featuredCampaign.name[language] || featuredCampaign.name.ar}
                            </h2>
                        </div>
                        <span className="mt-1 flex items-center gap-1.5 rounded-md bg-[#eaf0f8] px-2.5 py-1 text-[11px] font-bold text-[#31577f]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#426d9d]" />
                            {t(`digital_marketing.campaigns.statuses.${featuredCampaign.status}`)}
                        </span>
                    </div>

                    <div className="my-6 flex items-center gap-5">
                        <div
                            className="grid h-28 w-28 shrink-0 place-items-center rounded-full"
                            style={{ background: `conic-gradient(#dca144 ${featuredProgress * 3.6}deg, #e9edf3 0deg)` }}
                        >
                            <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-white text-center">
                                <div>
                                    <strong className="block text-2xl font-black text-[#14233d]">{featuredProgress}%</strong>
                                    <span className="text-[10px] font-bold text-[#84918f]">
                                        {t('digital_marketing.redesign.ofGoal')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="min-w-0 space-y-3 text-xs">
                            <div className="flex items-center gap-2 text-[#647774]">
                                <Users className="h-4 w-4 text-[#365f8b]" />
                                <span>{featuredCampaign.audience.size.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {t('digital_marketing.redesign.recipient')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#647774]">
                                <Mail className="h-4 w-4 text-[#365f8b]" />
                                <span>{featuredCampaign.openRate}% {t('digital_marketing.redesign.openRate')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#647774]">
                                <CalendarDays className="h-4 w-4 text-[#365f8b]" />
                                <span>{t('digital_marketing.redesign.activeNow')}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setActiveTab('campaigns')}
                        className="mt-auto flex w-full items-center justify-between rounded-md bg-[#edf1f6] px-4 py-3 text-xs font-black text-[#263f64] transition hover:bg-[#e3e9f1]"
                    >
                        {t('digital_marketing.redesign.viewCampaign')}
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                </section>
            </div>

            <section className="grid grid-cols-3 overflow-hidden rounded-lg border border-[#dfe3ea] bg-white shadow-[0_12px_35px_rgba(19,36,66,0.045)]">
                {supportingMetrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                        <div
                            key={metric.id}
                            className={`flex items-center justify-between px-6 py-5 ${index < supportingMetrics.length - 1 ? 'border-l border-[#e8ece9]' : ''}`}
                        >
                            <div>
                                <p className="text-xs font-bold text-[#7c8b89]">
                                    {t(`digital_marketing.kpi.${metric.id}`)}
                                </p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <strong className="text-2xl font-black tracking-tight text-[#14233d]">{metric.value}</strong>
                                    <span className="text-[11px] font-bold text-[#355f8c]">{metric.trend}</span>
                                </div>
                            </div>
                            <div className="grid h-11 w-11 place-items-center rounded-md" style={{ backgroundColor: `${metric.accent}18`, color: metric.accent }}>
                                <Icon className="h-5 w-5" strokeWidth={2} />
                            </div>
                        </div>
                    );
                })}
            </section>

            <div className="grid grid-cols-12 gap-5">
                <section className="col-span-8 rounded-lg border border-[#dfe3ea] bg-white p-6 shadow-[0_12px_35px_rgba(19,36,66,0.045)]">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-[#14233d]">
                                {t('digital_marketing.activityFeed.title')}
                            </h2>
                            <p className="mt-1 text-xs text-[#85928f]">
                                {t('digital_marketing.redesign.activitySubtitle')}
                            </p>
                        </div>
                        <span className="rounded-md bg-[#f0f2f6] px-3 py-1.5 text-[10px] font-bold text-[#6b7688]">
                            {t('digital_marketing.redesign.live')}
                        </span>
                    </div>

                    <div className="divide-y divide-[#edf0ed]">
                        {MOCK_ACTIVITY_FEED.slice(0, 4).map((activity, index) => {
                            const Icon = activityIcons[activity.type];
                            return (
                                <div key={activity.id} className="group flex items-center gap-4 py-3.5 first:pt-1 last:pb-0">
                                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${
                                        activity.type === 'donation'
                                            ? 'bg-[#fff4df] text-[#bd7d23]'
                                            : activity.type === 'emailSent'
                                                ? 'bg-[#e9eef6] text-[#355f8c]'
                                                : 'bg-[#fbece8] text-[#c76550]'
                                    }`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-[#344d4a]">
                                            {activity.description[language]} <span className="font-black text-[#14233d]">{activity.subject}</span>
                                        </p>
                                        <p className="mt-1 flex items-center gap-1 text-[10px] text-[#9aa5a3]">
                                            <Clock3 className="h-3 w-3" />
                                            {t(`digital_marketing.redesign.activityTime${index + 1}`)}
                                        </p>
                                    </div>
                                    <ArrowLeft className="h-4 w-4 text-[#c5cad3] transition group-hover:-translate-x-1 group-hover:text-[#365f8b]" />
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="col-span-4 rounded-lg border border-[#dfe3ea] bg-[#eef1f5] p-6">
                    <h2 className="text-lg font-black text-[#14233d]">
                        {t('digital_marketing.quickActions.title')}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-[#7d8d8a]">
                        {t('digital_marketing.redesign.actionsSubtitle')}
                    </p>
                    <div className="mt-5 space-y-2.5">
                        {[
                            { label: t('digital_marketing.quickActions.createCampaign'), icon: Megaphone, action: onOpenCreateCampaign, color: 'bg-[#142542] text-white' },
                            { label: t('digital_marketing.quickActions.quickEmail'), icon: Mail, action: onOpenSendEmailModal, color: 'bg-white text-[#263b5b]' },
                            { label: t('digital_marketing.quickActions.scheduleSocial'), icon: CalendarDays, action: onOpenCreatePostModal, color: 'bg-white text-[#263b5b]' },
                        ].map(item => (
                            <button
                                key={item.label}
                                type="button"
                                onClick={item.action}
                                className={`flex w-full items-center justify-between rounded-md px-4 py-3 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.color}`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </span>
                                <ArrowLeft className="h-3.5 w-3.5 opacity-60" />
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default MarketingDashboard;
