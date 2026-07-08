import React, { useMemo, useState } from 'react';
import { Plus, Star, X } from 'lucide-react';
import type { Partner } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { useProjects } from '../../../../hooks/useProjects';
import { useToast } from '../../../../hooks/useToast';
import {
    type EvaluationScores,
    type PartnerEvaluation,
    CRITERIA_GROUPS,
    deriveRating,
    MOCK_PARTNER_EVALUATIONS,
} from '../../../../data/partnerEvaluationsData';
import { projectMatchesPartner } from '../partnerProjectUtils';
import ModalPortal from '../../../common/ModalPortal';
import { fieldClass } from '../shared';

interface PerformanceTabProps {
    partner: Partner;
    onPartnerUpdate: (updated: Partner) => void;
    isSaving?: boolean;
}

const EMPTY_SCORES: EvaluationScores = {
    timeline: 3,
    quality: 3,
    communication: 3,
    transparency: 3,
    flexibility: 3,
    budget: 3,
    resources: 3,
};

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

/** Interactive 1–5 star input for a single criterion. */
const CriterionStars: React.FC<{ value: number; onChange: (value: number) => void; label: string }> = ({ value, onChange, label }) => (
    <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <button
                    key={i}
                    type="button"
                    onClick={() => onChange(i + 1)}
                    className="p-0.5"
                    aria-label={`${label}: ${i + 1}`}
                >
                    <Star size={18} className={i < value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'} />
                </button>
            ))}
        </div>
    </div>
);

/** Read-only average bar for a single criterion (scaled from a 1–5 average). */
const CriterionBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
    const percent = (value / 5) * 100;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{value.toFixed(1)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-slate-700">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
};

const NoteBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => {
    if (!value.trim()) return null;
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{value}</p>
        </div>
    );
};

const EvaluationRecordCard: React.FC<{ review: PartnerEvaluation }> = ({ review }) => {
    const { t, language } = useLocalization(['partners']);
    const rating = deriveRating(review.scores);

    return (
        <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-600">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold">{review.reviewer}</h4>
                    <p className="text-xs text-gray-500">
                        {new Date(review.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })} · {t('partners.performance.projectLabel')}: {review.project}
                    </p>
                </div>
                <StarRating rating={rating} showValue />
            </div>
            <div className="mt-3 space-y-2">
                <NoteBlock label={t('partners.performance.strengths')} value={review.strengths} />
                <NoteBlock label={t('partners.performance.weaknesses')} value={review.weaknesses} />
                <NoteBlock label={t('partners.performance.recommendations')} value={review.recommendations} />
            </div>
        </div>
    );
};

const PerformanceTab: React.FC<PerformanceTabProps> = ({ partner, onPartnerUpdate }) => {
    const { t, language } = useLocalization(['partners', 'common']);
    const toast = useToast();
    const { data: allProjects = [] } = useProjects();
    const [reviews, setReviews] = useState<PartnerEvaluation[]>(MOCK_PARTNER_EVALUATIONS);
    const linkedProjects = useMemo(
        () => allProjects.filter((project) => projectMatchesPartner(project, partner)),
        [allProjects, partner],
    );
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        reviewer: '',
        project: '',
        scores: { ...EMPTY_SCORES },
        strengths: '',
        weaknesses: '',
        recommendations: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const overallRating = useMemo(() => {
        if (reviews.length === 0) return partner.rating;
        return reviews.reduce((sum, review) => sum + deriveRating(review.scores), 0) / reviews.length;
    }, [reviews, partner.rating]);

    const criteriaAverages = useMemo(() => {
        const totals = {} as Record<keyof EvaluationScores, number>;
        CRITERIA_GROUPS.forEach((group) =>
            group.criteria.forEach((key) => {
                totals[key] = reviews.reduce((sum, review) => sum + review.scores[key], 0) / reviews.length;
            }),
        );
        return totals;
    }, [reviews]);

    const derivedRating = useMemo(() => deriveRating(form.scores), [form.scores]);

    const setScore = (key: keyof EvaluationScores, value: number) =>
        setForm((f) => ({ ...f, scores: { ...f.scores, [key]: value } }));

    const resetForm = () => {
        setForm({ reviewer: '', project: '', scores: { ...EMPTY_SCORES }, strengths: '', weaknesses: '', recommendations: '' });
        setErrors({});
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!form.reviewer.trim()) next.reviewer = t('partners.validation.required');
        if (!form.project.trim()) next.project = t('partners.validation.required');
        if (!form.strengths.trim()) next.strengths = t('partners.validation.required');
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        // TODO: replace with useCreatePartnerEvaluation mutation when activated.
        setIsSubmitting(true);
        setTimeout(() => {
            const record: PartnerEvaluation = {
                id: `pe-${Date.now()}`,
                reviewer: form.reviewer.trim(),
                project: form.project.trim(),
                date: new Date().toISOString(),
                scores: { ...form.scores },
                strengths: form.strengths.trim(),
                weaknesses: form.weaknesses.trim(),
                recommendations: form.recommendations.trim(),
            };
            const nextReviews = [record, ...reviews];
            setReviews(nextReviews);
            const newOverall = nextReviews.reduce((sum, review) => sum + deriveRating(review.scores), 0) / nextReviews.length;
            onPartnerUpdate({ ...partner, rating: newOverall });
            toast.showSuccess(t('partners.performance.addSuccess'));
            resetForm();
            setModalOpen(false);
            setIsSubmitting(false);
        }, 500);
    };

    return (
        <div className="space-y-8">
            <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-right">
                    <p className="text-sm font-semibold text-gray-500">{t('partners.performance.overallScore')}</p>
                    <p className="text-5xl font-bold text-blue-600">{overallRating.toFixed(1)}</p>
                    <StarRating rating={overallRating} size={20} />
                    <p className="text-sm text-gray-500 mt-2">{t('partners.performance.basedOn', { count: reviews.length })}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={16} /> {t('partners.performance.addEvaluation')}
                </button>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-xl">
                <h3 className="font-bold mb-4">{t('partners.performance.criteriaTitle')}</h3>
                {reviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        {t('partners.performance.criteriaPlaceholder')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {CRITERIA_GROUPS.map((group) => (
                            <div key={group.section}>
                                <h4 className="text-sm font-bold text-gray-500 mb-3">{t(`partners.performance.sections.${group.section}`)}</h4>
                                <div className="space-y-4">
                                    {group.criteria.map((key) => (
                                        <CriterionBar
                                            key={key}
                                            label={t(`partners.performance.criteria.${key}`)}
                                            value={criteriaAverages[key]}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4">{t('partners.performance.recordsTitle')}</h3>
                {reviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                        <p>{t('partners.performance.empty')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <EvaluationRecordCard key={review.id} review={review} />
                        ))}
                    </div>
                )}
            </div>

            <ModalPortal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <form className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg m-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                        <h2 className="text-xl font-bold">{t('partners.performance.addModalTitle')}</h2>
                        <button type="button" onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                            <X />
                        </button>
                    </div>
                    <div className="p-6 space-y-5 overflow-y-auto">
                        <div>
                            <label className="text-sm font-semibold">{t('partners.performance.evaluatorLabel')} *</label>
                            <input className={fieldClass} value={form.reviewer} onChange={(e) => setForm((f) => ({ ...f, reviewer: e.target.value }))} />
                            {errors.reviewer && <p className="text-xs text-red-500 mt-1">{errors.reviewer}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-semibold">{t('partners.performance.projectLabel')} *</label>
                            {linkedProjects.length > 0 ? (
                                <select className={fieldClass} value={form.project} onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}>
                                    <option value="">{t('partners.performance.selectProject')}</option>
                                    {linkedProjects.map((project) => (
                                        <option key={project.id} value={language === 'ar' ? project.name.ar : project.name.en}>
                                            {language === 'ar' ? project.name.ar : project.name.en}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input className={fieldClass} value={form.project} onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))} />
                            )}
                            {errors.project && <p className="text-xs text-red-500 mt-1">{errors.project}</p>}
                        </div>

                        {CRITERIA_GROUPS.map((group) => (
                            <div key={group.section} className="p-4 border rounded-lg bg-gray-50/50 dark:bg-slate-800/30 dark:border-slate-700">
                                <h4 className="text-sm font-bold mb-3">{t(`partners.performance.sections.${group.section}`)}</h4>
                                <div className="space-y-3">
                                    {group.criteria.map((key) => (
                                        <CriterionStars
                                            key={key}
                                            label={t(`partners.performance.criteria.${key}`)}
                                            value={form.scores[key]}
                                            onChange={(value) => setScore(key, value)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="flex items-center justify-between px-1">
                            <span className="text-sm font-semibold">{t('partners.performance.overallRatingLabel')}</span>
                            <StarRating rating={derivedRating} showValue />
                        </div>

                        <div>
                            <label className="text-sm font-semibold">{t('partners.performance.strengths')} *</label>
                            <textarea className={fieldClass} rows={2} value={form.strengths} onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))} />
                            {errors.strengths && <p className="text-xs text-red-500 mt-1">{errors.strengths}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-semibold">{t('partners.performance.weaknesses')}</label>
                            <textarea className={fieldClass} rows={2} value={form.weaknesses} onChange={(e) => setForm((f) => ({ ...f, weaknesses: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-sm font-semibold">{t('partners.performance.recommendations')}</label>
                            <textarea className={fieldClass} rows={2} value={form.recommendations} onChange={(e) => setForm((f) => ({ ...f, recommendations: e.target.value }))} />
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
                        <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-semibold border rounded-lg">{t('common.cancel')}</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg disabled:opacity-50">
                            {isSubmitting ? t('common.loading') : t('common.save')}
                        </button>
                    </div>
                </form>
            </ModalPortal>
        </div>
    );
};

export default PerformanceTab;
