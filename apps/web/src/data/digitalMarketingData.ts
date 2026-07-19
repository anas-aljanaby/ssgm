import type { MarketingMetric, ActivityFeedItem } from '../types';

/** Overview KPIs — fundraising-relevant only (spec: 4 cards). */
export const MOCK_MARKETING_METRICS: MarketingMetric[] = [
    { id: 'digitalDonations', value: 25678, trend: 22.8, format: 'currency' },
    { id: 'campaignsActive', value: 3, trend: 0, format: 'number' },
    { id: 'emailPerformance', value: 42.5, trend: -2.1, format: 'percentage' },
    { id: 'messagesSent', value: 18420, trend: 12.4, format: 'number' },
];

export const MOCK_ACTIVITY_FEED: ActivityFeedItem[] = [
    {
        id: 'act-1', type: 'donation', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        description: { en: 'New digital donation from', ar: 'تبرع رقمي جديد من' },
        subject: 'Aisha Al-Farsi', link: '#'
    },
    {
        id: 'act-2', type: 'emailSent', timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
        description: { en: 'Email campaign sent:', ar: 'تم إرسال حملة البريد:' },
        subject: 'Q3 Stewardship Update', link: '#'
    },
    {
        id: 'act-3', type: 'socialPost', timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
        description: { en: 'Social post scheduled on', ar: 'تمت جدولة منشور على' },
        subject: 'Facebook', link: '#'
    },
    {
        id: 'act-4', type: 'emailSent', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        description: { en: 'SMS campaign delivered:', ar: 'تم تسليم حملة الرسائل:' },
        subject: 'Ramadan Impact Update', link: '#'
    },
    {
        id: 'act-5', type: 'donation', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        description: { en: 'Donation attributed to campaign', ar: 'تبرع منسوب للحملة' },
        subject: 'Education for All', link: '#'
    },
];

/** Compact channel health for Campaigns tab. */
export const MOCK_CHANNEL_HEALTH = {
    email: { deliverability: 97.2, label: 'email' as const },
    sms: { balance: 245.8, provider: 'Twilio', label: 'sms' as const },
    whatsapp: { quality: 'High' as const, label: 'whatsapp' as const },
};
