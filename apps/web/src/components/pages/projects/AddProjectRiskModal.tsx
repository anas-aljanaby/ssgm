import React, { useEffect, useState } from 'react';
import type { Risk, RiskLevel } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import ModalPortal from '../../common/ModalPortal';
import { Check, X } from 'lucide-react';

export type AddProjectRiskPayload = Omit<Risk, 'id'>;

const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high'];
const RISK_CATEGORIES: Risk['category'][] = ['financial', 'security', 'operational', 'political', 'reputational'];
const RISK_RESPONSES: Risk['responseStrategy'][] = ['avoid', 'mitigate', 'transfer', 'accept'];
const RISK_STATUSES: Risk['status'][] = ['open', 'in-progress', 'closed'];

const emptyForm = (): AddProjectRiskPayload => ({
    description: '',
    category: 'operational',
    probability: 'medium',
    impact: 'medium',
    responseStrategy: 'mitigate',
    contingencyPlan: '',
    owner: '',
    status: 'open',
});

type FormErrors = {
    description?: string;
};

interface AddProjectRiskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: AddProjectRiskPayload) => void;
}

const AddProjectRiskModal: React.FC<AddProjectRiskModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useLocalization(['common', 'projects']);
    const [form, setForm] = useState<AddProjectRiskPayload>(emptyForm);
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        if (!isOpen) return;
        setForm(emptyForm());
        setErrors({});
    }, [isOpen]);

    const clearError = (field: keyof FormErrors) => {
        setErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const validate = (): boolean => {
        const next: FormErrors = {};
        if (!form.description.trim()) {
            next.description = t('projects.risks.errors.descriptionRequired');
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSubmit({
            ...form,
            description: form.description.trim(),
            owner: form.owner.trim(),
            contingencyPlan: form.contingencyPlan.trim(),
        });
        setForm(emptyForm());
        setErrors({});
        onClose();
    };

    const inputClass = (hasError: boolean) =>
        `w-full rounded-lg border bg-white px-3 py-1.5 text-sm dark:bg-slate-800 dark:text-dark-foreground focus:ring-1 focus:ring-primary ${
            hasError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
        }`;
    const selectClass = inputClass(false);
    const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';

    if (!isOpen) return null;

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div
                className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold">{t('projects.risks.addRisk')}</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label={t('common.close')}>
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-slate-600 dark:bg-slate-800/40 dark:text-gray-300 mb-3">
                        <span className="text-red-500">*</span> {t('projects.risks.requiredHint')}
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className={labelClass}>
                                {t('projects.risks.description')} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={2}
                                className={inputClass(!!errors.description)}
                                value={form.description}
                                onChange={(e) => {
                                    setForm((f) => ({ ...f, description: e.target.value }));
                                    clearError('description');
                                }}
                            />
                            {errors.description && (
                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>{t('projects.risks.category')}</label>
                                <select
                                    className={selectClass}
                                    value={form.category}
                                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Risk['category'] }))}
                                >
                                    {RISK_CATEGORIES.map((c) => (
                                        <option key={c} value={c}>
                                            {t(`projects.risks.categories.${c}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.risks.probability')}</label>
                                <select
                                    className={selectClass}
                                    value={form.probability}
                                    onChange={(e) => setForm((f) => ({ ...f, probability: e.target.value as RiskLevel }))}
                                >
                                    {RISK_LEVELS.map((l) => (
                                        <option key={l} value={l}>
                                            {t(`projects.risks.levels.${l}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.risks.impact')}</label>
                                <select
                                    className={selectClass}
                                    value={form.impact}
                                    onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value as RiskLevel }))}
                                >
                                    {RISK_LEVELS.map((l) => (
                                        <option key={l} value={l}>
                                            {t(`projects.risks.levels.${l}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.risks.response')}</label>
                                <select
                                    className={selectClass}
                                    value={form.responseStrategy}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, responseStrategy: e.target.value as Risk['responseStrategy'] }))
                                    }
                                >
                                    {RISK_RESPONSES.map((r) => (
                                        <option key={r} value={r}>
                                            {t(`projects.risks.responses.${r}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.risks.owner')}</label>
                                <input
                                    className={selectClass}
                                    value={form.owner}
                                    onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.risks.status')}</label>
                                <select
                                    className={selectClass}
                                    value={form.status}
                                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Risk['status'] }))}
                                >
                                    {RISK_STATUSES.map((s) => (
                                        <option key={s} value={s}>
                                            {t(`projects.risks.statuses.${s}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t('projects.risks.contingencyPlan')}</label>
                            <textarea
                                rows={2}
                                className={selectClass}
                                value={form.contingencyPlan}
                                onChange={(e) => setForm((f) => ({ ...f, contingencyPlan: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg"
                        >
                            <Check size={14} /> {t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default AddProjectRiskModal;
