import React, { useEffect, useMemo, useState } from 'react';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import { useBeneficiaries } from '../../../hooks/useBeneficiaries';
import type { Beneficiary } from '../../../types';
import { Check, X } from 'lucide-react';

type FormErrors = {
    beneficiaryId?: string;
};

interface LinkProjectBeneficiaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    linkedIds: Set<string>;
    onSubmit: (beneficiary: Beneficiary) => void;
}

const LinkProjectBeneficiaryModal: React.FC<LinkProjectBeneficiaryModalProps> = ({
    isOpen,
    onClose,
    projectId,
    linkedIds,
    onSubmit,
}) => {
    const { t, language } = useLocalization(['common', 'projects', 'beneficiaries']);
    const { data: allBeneficiaries = [], isLoading } = useBeneficiaries();
    const [selectedId, setSelectedId] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        if (!isOpen) return;
        setSelectedId('');
        setErrors({});
    }, [isOpen]);

    const available = useMemo(
        () =>
            allBeneficiaries.filter(
                (b) => !linkedIds.has(b.id) && b.projectId !== projectId,
            ),
        [allBeneficiaries, linkedIds, projectId],
    );

    const validate = (): Beneficiary | null => {
        const next: FormErrors = {};
        if (!selectedId) {
            next.beneficiaryId = t('projects.beneficiariesTab.errors.selectBeneficiary');
        }
        setErrors(next);
        if (Object.keys(next).length > 0) return null;
        return available.find((b) => b.id === selectedId) ?? null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const beneficiary = validate();
        if (!beneficiary) return;
        onSubmit(beneficiary);
        setSelectedId('');
        setErrors({});
        onClose();
    };

    const selectClass = (hasError: boolean) =>
        `w-full rounded-lg border bg-white px-3 py-1.5 text-sm dark:bg-slate-800 dark:text-dark-foreground focus:ring-1 focus:ring-primary ${
            hasError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
        }`;
    const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';

    if (!isOpen) return null;

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div
                className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700 p-6 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold">{t('projects.beneficiariesTab.linkBeneficiary')}</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label={t('common.close')}>
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-slate-600 dark:bg-slate-800/40 dark:text-gray-300 mb-3">
                        <span className="text-red-500">*</span> {t('projects.beneficiariesTab.requiredHint')}
                    </div>
                    <div>
                        <label className={labelClass}>
                            {t('projects.beneficiariesTab.selectBeneficiary')} <span className="text-red-500">*</span>
                        </label>
                        <select
                            className={selectClass(!!errors.beneficiaryId)}
                            value={selectedId}
                            onChange={(e) => {
                                setSelectedId(e.target.value);
                                if (errors.beneficiaryId) {
                                    setErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.beneficiaryId;
                                        return next;
                                    });
                                }
                            }}
                            disabled={isLoading || available.length === 0}
                        >
                            <option value="">
                                {isLoading
                                    ? t('common.loading')
                                    : available.length === 0
                                      ? t('projects.beneficiariesTab.noAvailableBeneficiaries')
                                      : t('projects.beneficiariesTab.selectPlaceholder')}
                            </option>
                            {available.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name[language] || b.name.en}
                                </option>
                            ))}
                        </select>
                        {errors.beneficiaryId && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.beneficiaryId}</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 mt-5">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || available.length === 0}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50"
                        >
                            <Check size={14} /> {t('projects.beneficiariesTab.linkAction')}
                        </button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default LinkProjectBeneficiaryModal;
