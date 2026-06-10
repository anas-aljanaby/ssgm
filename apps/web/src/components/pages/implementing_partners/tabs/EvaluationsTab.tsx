import React from 'react';
import { Plus, Star, ThumbsUp } from 'lucide-react';
import { useLocalization } from '../../../../hooks/useLocalization';
import { MOCK_EVALUATION_KPIS, MOCK_PARTNER_REVIEWS, MOCK_RATING_BREAKDOWN } from '../partnerStaticData';

const TOTAL_REVIEWS = 15;

const StarRating: React.FC<{ rating: number; size?: number; showValue?: boolean }> = ({ rating, size = 16, showValue = false }) => (
    <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                size={size}
                className={i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
            />
        ))}
        {showValue && <span className="font-bold text-sm ml-1">({rating.toFixed(1)})</span>}
    </div>
);

const ReviewCard: React.FC<{ review: (typeof MOCK_PARTNER_REVIEWS)[0] }> = ({ review }) => {
    const { t } = useLocalization(['partners']);

    return (
        <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold">{review.reviewer}</h4>
                    <p className="text-xs text-gray-500">{review.date} | {t('partners.evaluations.projectLabel')}: {review.project}</p>
                </div>
                <StarRating rating={review.rating} />
            </div>
            <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">&quot;{review.comment}&quot;</p>
            <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                <ThumbsUp size={14} />
                <span>{t('partners.evaluations.helpful', { count: review.helpful })}</span>
            </div>
        </div>
    );
};

interface EvaluationsTabProps {
    partnerRating: number;
}

const EvaluationsTab: React.FC<EvaluationsTabProps> = ({ partnerRating }) => {
    const { t } = useLocalization(['partners']);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-gray-50 dark:bg-slate-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                    <p className="text-7xl font-bold text-blue-600">{partnerRating.toFixed(1)}</p>
                    <StarRating rating={partnerRating} size={24} />
                    <p className="text-sm text-gray-500 mt-2">{t('partners.evaluations.basedOn', { count: TOTAL_REVIEWS })}</p>
                    <button type="button" className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        <Plus size={16} /> {t('partners.evaluations.addEvaluation')}
                    </button>
                </div>
                <div className="lg:col-span-2 bg-gray-50 dark:bg-slate-700/50 p-6 rounded-xl">
                    <h3 className="font-bold mb-4">{t('partners.evaluations.breakdownTitle')}</h3>
                    <div className="space-y-3">
                        {Object.entries(MOCK_RATING_BREAKDOWN).reverse().map(([stars, count]) => {
                            const percent = (count / TOTAL_REVIEWS) * 100;
                            return (
                                <div key={stars} className="flex items-center gap-4 text-sm">
                                    <span className="w-16 text-gray-500">{t('partners.evaluations.stars', { count: stars })}</span>
                                    <div className="flex-grow bg-gray-200 dark:bg-slate-600 rounded-full h-4">
                                        <div className="bg-yellow-400 h-4 rounded-full" style={{ width: `${percent}%` }} />
                                    </div>
                                    <span className="w-24 text-right">{t('partners.evaluations.reviewsCount', { count, percent: percent.toFixed(0) })}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-xl">
                <h3 className="font-bold mb-4">{t('partners.evaluations.kpiTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                    {MOCK_EVALUATION_KPIS.map((kpi) => (
                        <div key={kpi.label}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold">{kpi.label}</span>
                                <StarRating rating={kpi.rating} showValue />
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${kpi.progress > 85 ? 'bg-green-500' : kpi.progress > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${kpi.progress}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4">{t('partners.evaluations.individualTitle')}</h3>
                <div className="space-y-4">
                    {MOCK_PARTNER_REVIEWS.map((review, index) => (
                        <ReviewCard key={index} review={review} />
                    ))}
                </div>
                <div className="text-center mt-6">
                    <button type="button" className="px-6 py-2 border border-gray-300 dark:border-slate-600 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                        {t('partners.evaluations.viewAll')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvaluationsTab;
