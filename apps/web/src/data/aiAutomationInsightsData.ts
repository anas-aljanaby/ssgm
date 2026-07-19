export type InsightCategory = 'Achievements' | 'Warnings' | 'Opportunities' | 'Predictions';

export interface GeneratedInsight {
    category: InsightCategory;
    text: { en: string; ar: string };
    confidence: number;
    reasoning: { en: string; ar: string };
}

/** Static insights for BUILD; ACTIVATE will generate from live aggregates. */
export const MOCK_GENERATED_INSIGHTS: GeneratedInsight[] = [
    {
        category: 'Achievements',
        text: {
            en: 'Major donor retention improved 8% this quarter versus last year.',
            ar: 'تحسن الاحتفاظ بكبار المانحين بنسبة 8% هذا الربع مقارنة بالعام الماضي.',
        },
        confidence: 91,
        reasoning: {
            en: 'Compared active major donors with gifts in both periods.',
            ar: 'مقارنة كبار المانحين النشطين الذين تبرعوا في الفترتين.',
        },
    },
    {
        category: 'Warnings',
        text: {
            en: 'Donations in February were unusually low compared to the trailing 6-month average.',
            ar: 'كانت التبرعات في فبراير منخفضة بشكل غير معتاد مقارنة بمتوسط الأشهر الستة السابقة.',
        },
        confidence: 88,
        reasoning: {
            en: 'February fell more than two standard deviations below the rolling mean.',
            ar: 'انخفض فبراير بأكثر من انحرافين معياريين عن المتوسط المتحرك.',
        },
    },
    {
        category: 'Warnings',
        text: {
            en: 'Three active projects are underspending relative to timeline — review disbursements.',
            ar: 'ثلاثة مشاريع نشطة تنفق أقل من المتوقع نسبةً للجدول — راجع الصرف.',
        },
        confidence: 82,
        reasoning: {
            en: 'Spend-to-schedule ratio below 0.7 on three open projects.',
            ar: 'نسبة الصرف إلى الجدول أقل من 0.7 في ثلاثة مشاريع مفتوحة.',
        },
    },
    {
        category: 'Opportunities',
        text: {
            en: 'Launch a reactivation campaign for dormant donors interested in healthcare programs.',
            ar: 'أطلق حملة إعادة تفعيل للمانحين الخاملين المهتمين ببرامج الرعاية الصحية.',
        },
        confidence: 79,
        reasoning: {
            en: 'Dormant cohort historically responds to healthcare appeals.',
            ar: 'الشريحة الخاملة تستجيب تاريخياً لنداءات الرعاية الصحية.',
        },
    },
    {
        category: 'Predictions',
        text: {
            en: 'Expect donation velocity to rise if stewardship outreach increases in August ahead of the seasonal peak.',
            ar: 'يُتوقع ارتفاع وتيرة التبرعات إذا زاد تواصل الرعاية في أغسطس قبل الذروة الموسمية.',
        },
        confidence: 74,
        reasoning: {
            en: 'Historical Q3 peaks follow August stewardship touchpoints.',
            ar: 'ذروات الربع الثالث تاريخياً تتبع نقاط تواصل الرعاية في أغسطس.',
        },
    },
];
