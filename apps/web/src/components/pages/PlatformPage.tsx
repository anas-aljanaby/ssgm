import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalization } from '../../hooks/useLocalization';
import { PLATFORM_ORGS_KEY, useCreateOrg, useDeleteOrg, usePlatformOrgs } from '../../hooks/usePlatform';
import { useOrg } from '../../contexts/OrgContext';
import { useToast } from '../../hooks/useToast';
import { useDestructiveConfirmation } from '../../hooks/useDestructiveConfirmation';
import ModalPortal from '../common/ModalPortal';
import ConfirmationModal from '../common/ConfirmationModal';
import type { PlatformOrg } from '../../hooks/usePlatform';

interface PlatformPageProps {
    setActiveModule: (module: string) => void;
}

interface CreateOrgModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: { name: string }) => void;
}

const OPTIMISTIC_ORG_PREFIX = 'optimistic-platform-org-';
const HIGHLIGHT_DURATION_MS = 2000;

function sortPlatformOrgs(items: PlatformOrg[]) {
    return [...items].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (aTime !== bTime) return aTime - bTime;
        return a.name.localeCompare(b.name);
    });
}

function isOptimisticOrg(orgId: string) {
    return orgId.startsWith(OPTIMISTIC_ORG_PREFIX);
}

const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useLocalization(['platform', 'common']);
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setNameError(null);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedName = name.trim();
        if (!normalizedName) {
            setNameError(t('platform.org_name_required', 'Organization name is required.'));
            return;
        }

        onSubmit({ name: normalizedName });
        setName('');
        setNameError(null);
        onClose();
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="bg-card dark:bg-dark-card rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground">{t('platform.create_org')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('platform.required_helper', 'Fields marked * are required.')}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                        <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('platform.org_name')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="org-name"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (nameError) setNameError(null);
                            }}
                            aria-invalid={!!nameError}
                            className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 text-foreground dark:text-dark-foreground ${
                                nameError
                                    ? 'border-red-400 dark:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30'
                                    : 'border-gray-300 dark:border-slate-600'
                            }`}
                            placeholder={t('platform.org_name_placeholder')}
                            autoFocus
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('platform.org_name_helper', 'Enter a clear organization name you can recognize later.')}</p>
                        {nameError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{nameError}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark"
                        >
                            {t('platform.create_submit')}
                        </button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

const PlatformPage: React.FC<PlatformPageProps> = ({ setActiveModule }) => {
    const { t } = useLocalization(['platform', 'common']);
    const queryClient = useQueryClient();
    const { data: orgs = [], isLoading } = usePlatformOrgs();
    const { activeOrgId, orgs: myOrgs, setActiveOrg } = useOrg();
    const createMutation = useCreateOrg();
    const deleteMutation = useDeleteOrg();
    const { showSuccess, showError } = useToast();

    const [createOpen, setCreateOpen] = useState(false);
    const [manageTarget, setManageTarget] = useState<PlatformOrg | null>(null);
    const [optimisticOrgs, setOptimisticOrgs] = useState<PlatformOrg[]>([]);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const deletion = useDestructiveConfirmation<PlatformOrg>({ getRowId: (org) => org.id });

    useEffect(() => {
        if (!highlightedId) return;
        const timeout = window.setTimeout(() => setHighlightedId(null), HIGHLIGHT_DURATION_MS);
        return () => window.clearTimeout(timeout);
    }, [highlightedId]);

    const visibleOrgs = sortPlatformOrgs([...orgs, ...optimisticOrgs]);

    const enterOrg = (orgId: string, orgName: string) => {
        setActiveOrg(orgId, orgName);
        setActiveModule('dashboard');
    };

    const handleCreate = ({ name }: { name: string }) => {
        const optimisticOrg: PlatformOrg = {
            id: `${OPTIMISTIC_ORG_PREFIX}${Date.now()}`,
            name,
            created_at: new Date().toISOString(),
            member_count: 1,
        };

        setOptimisticOrgs((prev) => sortPlatformOrgs([...prev, optimisticOrg]));

        void createMutation.mutateAsync({ name }).then((createdOrg) => {
            setOptimisticOrgs((prev) => prev.filter((org) => org.id !== optimisticOrg.id));
            queryClient.setQueryData<PlatformOrg[]>([...PLATFORM_ORGS_KEY], (current = []) =>
                sortPlatformOrgs([...current.filter((org) => org.id !== createdOrg.id), createdOrg]),
            );
            setHighlightedId(createdOrg.id);
            showSuccess(t('platform.create_success'));
        }).catch((err) => {
            setOptimisticOrgs((prev) => prev.filter((org) => org.id !== optimisticOrg.id));
            showError(err instanceof Error ? err.message : t('common.error'));
        });
    };

    const mapDeleteError = (err: unknown) => {
        const message = err instanceof Error ? err.message : t('common.error');
        return message === 'last_org' ? t('platform.delete_last_org') : message;
    };

    const handleDelete = () =>
        deletion.confirm(async (org) => {
            await deleteMutation.mutateAsync(org.id);
        }).then((removed) => {
            if (!removed) return;
            queryClient.setQueryData<PlatformOrg[]>([...PLATFORM_ORGS_KEY], (current = []) =>
                current.filter((org) => org.id !== removed.id),
            );
            if (activeOrgId === removed.id) {
                const fallback = myOrgs.find((o) => o.id !== removed.id)?.id ?? null;
                setActiveOrg(fallback);
            }
            showSuccess(t('platform.delete_success'));
        }).catch((err) => {
            showError(mapDeleteError(err));
        });

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground dark:text-dark-foreground">{t('platform.title')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('platform.subtitle')}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="shrink-0 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    {t('platform.create_org')}
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-dashed border-primary" />
                </div>
            ) : visibleOrgs.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-lg font-medium">{t('platform.no_orgs')}</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleOrgs.map((org) => {
                        const optimistic = isOptimisticOrg(org.id);
                        const highlighted = highlightedId === org.id;
                        const rowPending = deletion.isRowPending(org.id);
                        const rowExiting = deletion.isRowExiting(org.id);
                        const rowBusy = deletion.isRowBusy(org.id);
                        return (
                            <div
                                key={org.id}
                                className={`bg-card dark:bg-dark-card rounded-xl border p-5 flex flex-col gap-4 transition-all duration-200 ${
                                    rowExiting
                                        ? 'opacity-0 -translate-x-2 scale-[0.98]'
                                        : rowPending
                                            ? 'border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-900/15 opacity-80'
                                            : optimistic
                                                ? 'border-primary/30 opacity-70 animate-pulse'
                                                : highlighted
                                                    ? 'border-primary shadow-[0_0_0_1px_rgba(59,130,246,0.35)]'
                                                    : 'border-gray-200 dark:border-slate-700 hover:border-primary/40'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-foreground dark:text-dark-foreground text-lg">{org.name}</h3>
                                            {optimistic && (
                                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                    {t('common.saving')}
                                                </span>
                                            )}
                                            {rowPending && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300/40 border-t-red-600 dark:border-red-700/40 dark:border-t-red-300" aria-hidden="true" />
                                                    {t('common.deleting')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                            {org.created_at ? new Date(org.created_at).toLocaleDateString() : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                                        {org.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {org.member_count} {t('platform.members')}
                                    </span>
                                </div>

                                <div className="mt-auto flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => enterOrg(org.id, org.name)}
                                        disabled={optimistic || rowBusy || deletion.isPending}
                                        className="flex-1 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t('platform.enter')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setManageTarget(org)}
                                        disabled={optimistic || rowBusy || deletion.isPending}
                                        className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t('platform.manage_org')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <CreateOrgModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} />

            <ModalPortal isOpen={!!manageTarget} onClose={() => !deletion.isPending && setManageTarget(null)}>
                <div className="bg-card dark:bg-dark-card rounded-xl shadow-xl w-full max-w-lg p-6 space-y-6">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground">
                            {t('platform.manage_org_title', { name: manageTarget?.name ?? '' })}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('platform.manage_org_description')}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h4 className="font-medium text-foreground dark:text-dark-foreground">{t('platform.enter')}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('platform.enter_description')}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!manageTarget) return;
                                    enterOrg(manageTarget.id, manageTarget.name);
                                    setManageTarget(null);
                                }}
                                className="shrink-0 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                {t('platform.enter')}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-red-200 dark:border-red-900/60 p-4 space-y-3">
                        <div>
                            <h4 className="font-medium text-red-700 dark:text-red-300">{t('platform.danger_zone')}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('platform.delete_hint')}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (!manageTarget) return;
                                deletion.open(manageTarget);
                                setManageTarget(null);
                            }}
                            disabled={deletion.isPending}
                            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                            {t('platform.delete_org')}
                        </button>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setManageTarget(null)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            </ModalPortal>

            <ConfirmationModal
                isOpen={deletion.isOpen}
                onClose={deletion.close}
                onConfirm={handleDelete}
                isConfirming={deletion.isPending}
                title={t('platform.delete_org')}
                message={t('platform.delete_confirm', { name: deletion.target?.name ?? '' })}
                confirmLabel={t('common.delete')}
                confirmingLabel={t('common.deleting')}
            />
        </div>
    );
};

export default PlatformPage;
