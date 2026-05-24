import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link2 } from 'lucide-react';
import { useLocalization } from '../../../../hooks/useLocalization';
import type { Beneficiary, Project } from '../../../../types';
import { formatNumber } from '../../../../lib/utils';
import { getCountryDisplayName } from '../../../../lib/countryOptions';
import { getLocalizedTargetBeneficiaries } from '../utils/location';
import { resolveProjectBeneficiaryTarget } from '../utils/beneficiaryTarget';
import {
    projectBeneficiariesQueryKey,
    useProjectBeneficiaries,
    useUpdateBeneficiary,
} from '../../../../hooks/useBeneficiaries';
import { useToast } from '../../../../hooks/useToast';
import { OPTIMISTIC_HIGHLIGHT_MS } from '../../../../lib/optimisticSubmit';
import LinkProjectBeneficiaryModal from '../LinkProjectBeneficiaryModal';
import SkeletonLoader from '../../../common/SkeletonLoader';

interface BeneficiariesTabProps {
    project: Project;
}

/** Newest-first, matching GET /projects/:id/beneficiaries order. */
function prependLinkedBeneficiary(list: Beneficiary[], beneficiary: Beneficiary): Beneficiary[] {
    return [beneficiary, ...list.filter((b) => b.id !== beneficiary.id)];
}

const BeneficiariesTab: React.FC<BeneficiariesTabProps> = ({ project }) => {
    const { t, language } = useLocalization(['common', 'projects', 'beneficiaries']);
    const toast = useToast();
    const queryClient = useQueryClient();
    const { data: projectBeneficiaries = [], isLoading, isError, refetch } = useProjectBeneficiaries(project.id);
    const updateBeneficiary = useUpdateBeneficiary();
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkingId, setLinkingId] = useState<string | null>(null);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        };
    }, []);

    const flashHighlight = useCallback((id: string) => {
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        setHighlightedId(id);
        highlightTimerRef.current = setTimeout(() => setHighlightedId(null), OPTIMISTIC_HIGHLIGHT_MS);
    }, []);

    const description = getLocalizedTargetBeneficiaries(
        project.stakeholders.targetBeneficiaries,
        t,
        language,
    );
    const target = resolveProjectBeneficiaryTarget(project);
    const reached = projectBeneficiaries.length;
    const percentage = target > 0 ? Math.min(100, Math.round((reached / target) * 100)) : 0;

    const linkedIds = useMemo(() => {
        const ids = new Set(projectBeneficiaries.map((b) => b.id));
        if (linkingId) ids.add(linkingId);
        return ids;
    }, [projectBeneficiaries, linkingId]);

    const handleLinkBeneficiary = (beneficiary: Beneficiary) => {
        const key = projectBeneficiariesQueryKey(project.id);
        const previous = queryClient.getQueryData<Beneficiary[]>(key);
        const linked = { ...beneficiary, projectId: project.id };

        queryClient.setQueryData<Beneficiary[]>(key, (old) =>
            prependLinkedBeneficiary(old ?? [], linked),
        );
        setLinkingId(beneficiary.id);

        updateBeneficiary.mutate(linked, {
            onSuccess: (updated) => {
                queryClient.setQueryData<Beneficiary[]>(key, (old) =>
                    prependLinkedBeneficiary(old ?? [], updated),
                );
                setLinkingId(null);
                flashHighlight(updated.id);
                toast.showSuccess(t('projects.beneficiariesTab.linkSuccess'));
            },
            onError: () => {
                if (previous !== undefined) {
                    queryClient.setQueryData(key, previous);
                } else {
                    void refetch();
                }
                setLinkingId(null);
                toast.showError(t('projects.beneficiariesTab.linkFailed'));
            },
        });
    };

    const gradeLabel = (b: Beneficiary) => {
        if (b.profile.type === 'student') {
            return b.profile.academicInfo?.level?.[language] ?? '—';
        }
        return t(`beneficiaries.types.${b.beneficiaryType}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">{t('beneficiaries.title')}</h2>
                <button
                    type="button"
                    onClick={() => setLinkModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                >
                    <Link2 size={15} /> {t('projects.beneficiariesTab.linkBeneficiary')}
                </button>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex justify-between mb-1 text-sm font-medium">
                            <span>{t('beneficiaries.reached')}</span>
                            <span>
                                {formatNumber(reached, language)} / {formatNumber(target, language)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-slate-700">
                            <div
                                className="bg-primary h-4 rounded-full text-center text-white text-xs leading-4 transition-all"
                                style={{ width: `${percentage}%` }}
                            >
                                {percentage > 10 ? `${percentage}%` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="font-bold text-lg mb-2">{t('beneficiaries.linkedBeneficiaries')}</h3>
                {isLoading ? (
                    <SkeletonLoader type="table" className="h-40 w-full rounded-lg" rows={3} columns={3} />
                ) : isError ? (
                    <div className="text-center p-8 text-gray-500 space-y-3">
                        <p>{t('common.error')}</p>
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            {t('common.retry', 'Retry')}
                        </button>
                    </div>
                ) : (
                    <div className="bg-card dark:bg-dark-card rounded-lg border dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="p-3 text-start">{t('beneficiaries.table.name')}</th>
                                    <th className="p-3 text-start">{t('beneficiaries.table.country')}</th>
                                    <th className="p-3 text-start">{t('beneficiaries.fields.grade')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectBeneficiaries.map((b) => {
                                    const saving = linkingId === b.id;
                                    const highlighted = highlightedId === b.id;
                                    return (
                                        <tr
                                            key={b.id}
                                            className={`border-t dark:border-slate-700 transition-colors ${
                                                saving ? 'opacity-70 animate-pulse bg-blue-50/60 dark:bg-blue-950/30' : ''
                                            } ${highlighted ? 'ring-2 ring-inset ring-emerald-300 dark:ring-emerald-700' : ''}`}
                                        >
                                            <td className="p-3 font-semibold">
                                                {b.name[language]}
                                                {saving && (
                                                    <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                                                        {t('projects.beneficiariesTab.saving')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">{getCountryDisplayName(b.country, language)}</td>
                                            <td className="p-3">{gradeLabel(b)}</td>
                                        </tr>
                                    );
                                })}
                                {projectBeneficiaries.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center p-8 text-gray-500">
                                            {t('beneficiaries.noLinked')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <LinkProjectBeneficiaryModal
                isOpen={linkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                projectId={project.id}
                linkedIds={linkedIds}
                onSubmit={handleLinkBeneficiary}
            />
        </div>
    );
};

export default BeneficiariesTab;
