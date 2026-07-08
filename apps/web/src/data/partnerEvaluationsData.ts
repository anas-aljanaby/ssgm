// Mock partner-evaluation records for the Implementing Partners → Performance tab.
// Shaped for the ACTIVATE stage: each record carries the 7 per-criterion scores
// (1–5) plus qualitative notes; the overall rating is derived from the scores.
// TODO: wire to usePartnerEvaluations / useCreatePartnerEvaluation when activated.

export interface EvaluationScores {
    // Commitment
    timeline: number;
    quality: number;
    // Cooperation
    communication: number;
    transparency: number;
    flexibility: number;
    // Efficiency
    budget: number;
    resources: number;
}

export interface PartnerEvaluation {
    id: string;
    reviewer: string;
    project: string;
    date: string; // ISO date
    scores: EvaluationScores;
    strengths: string;
    weaknesses: string;
    recommendations: string;
}

export const CRITERIA_KEYS: (keyof EvaluationScores)[] = [
    'timeline',
    'quality',
    'communication',
    'transparency',
    'flexibility',
    'budget',
    'resources',
];

/** Section → the criteria it groups, in display order. */
export const CRITERIA_GROUPS: { section: string; criteria: (keyof EvaluationScores)[] }[] = [
    { section: 'commitment', criteria: ['timeline', 'quality'] },
    { section: 'cooperation', criteria: ['communication', 'transparency', 'flexibility'] },
    { section: 'efficiency', criteria: ['budget', 'resources'] },
];

/** Overall rating (1–5) derived as the average of the 7 criteria scores. */
export const deriveRating = (scores: EvaluationScores): number => {
    const values = CRITERIA_KEYS.map((key) => scores[key]);
    return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const MOCK_PARTNER_EVALUATIONS: PartnerEvaluation[] = [
    {
        id: 'pe-1',
        reviewer: 'سارة عبدالله',
        project: 'برنامج المياه النظيفة',
        date: '2024-11-18',
        scores: { timeline: 5, quality: 5, communication: 4, transparency: 5, flexibility: 4, budget: 5, resources: 4 },
        strengths: 'التزام دقيق بالجدول الزمني وجودة عالية في المخرجات مع تقارير مالية شفافة.',
        weaknesses: 'بطء نسبي في الاستجابة لطلبات التعديل الميدانية.',
        recommendations: 'الاستمرار في الشراكة وتوسيع نطاق المشاريع المشتركة في المرحلة القادمة.',
    },
    {
        id: 'pe-2',
        reviewer: 'أحمد خالد',
        project: 'مبادرة التعليم المجتمعي',
        date: '2024-08-05',
        scores: { timeline: 4, quality: 4, communication: 5, transparency: 4, flexibility: 5, budget: 3, resources: 4 },
        strengths: 'تواصل ممتاز ومرونة عالية في التعامل مع المتغيرات الميدانية.',
        weaknesses: 'تجاوز طفيف في الميزانية بسبب تكاليف لوجستية غير متوقعة.',
        recommendations: 'تحسين آلية تقدير الميزانية ووضع هامش للطوارئ في المشاريع المستقبلية.',
    },
];
