import React, { useEffect, useMemo, useState } from 'react';
import type { AidItem, AidStatus, Beneficiary, ProgramProject } from '../../../types';
import type { Disbursement, DisbursementStatus } from '../../../types/financials';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { HIGHLIGHT_CARD_CLASS, useUrlHighlight } from '../../../hooks/useUrlHighlight';
import { useBeneficiaryDisbursements, useCancelDisbursement, useCreateDisbursement } from '../../../hooks/useDisbursements';
import { formatDate, formatCurrency, formatNumber } from '../../../lib/utils';
import { mapDisbursementToAidStatus, openFinancialsTab } from '../../../lib/aidDisbursement';
import { FinancialAidIcon, InKindAidIcon, ServiceAidIcon } from '../../icons/AidIcons';
import { Clock, CheckCircle, AlertCircle, PlusCircle, Pencil, Trash2, ExternalLink, Landmark } from 'lucide-react';
import AidItemModal, { type AidItemFormInput } from './AidItemModal';
import ConfirmationModal from '../../common/ConfirmationModal';

interface AidLogTabProps {
    beneficiary: Beneficiary;
    onUpdate?: (aidLog: AidItem[]) => void;
    // TODO: Replace with real API when projects module is activated
    projects?: ProgramProject[];
}

type TimelineEntry =
    | { kind: 'aid'; item: AidItem }
    | { kind: 'disbursement'; disbursement: Disbursement };

const AidLogTab: React.FC<AidLogTabProps> = ({ beneficiary, onUpdate, projects = [] }) => {
    const aidLog = Array.isArray(beneficiary.aidLog) ? beneficiary.aidLog : [];
    const { language, dir, t } = useLocalization(['common', 'beneficiaries', 'financials']);
    const toast = useToast();
    const { data: disbursements = [] } = useBeneficiaryDisbursements(beneficiary.id);
    const createDisbursement = useCreateDisbursement();
    const cancelDisbursement = useCancelDisbursement();
    const { highlightedId, consumeHighlightParam } = useUrlHighlight();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AidItem | null>(null);
    const [itemToRemove, setItemToRemove] = useState<AidItem | null>(null);
    const [disbursementToCancel, setDisbursementToCancel] = useState<Disbursement | null>(null);

    const linkedDisbursementIds = useMemo(
        () => new Set(aidLog.map((item) => item.disbursementId).filter(Boolean) as string[]),
        [aidLog],
    );

    const disbursementById = useMemo(
        () => new Map(disbursements.map((d) => [d.id, d])),
        [disbursements],
    );

    useEffect(() => {
        if (!onUpdate || disbursements.length === 0) return;
        let changed = false;
        const nextLog = aidLog.map((item) => {
            if (item.type !== 'financial' || !item.disbursementId) return item;
            const linked = disbursementById.get(item.disbursementId);
            if (!linked) return item;
            const derived = mapDisbursementToAidStatus(linked.status);
            if (item.status !== derived) {
                changed = true;
                return { ...item, status: derived };
            }
            return item;
        });
        if (changed) onUpdate(nextLog);
    }, [aidLog, disbursements, disbursementById, onUpdate]);

    const getEffectiveStatus = (item: AidItem): { aidStatus: AidStatus; disbursementStatus?: DisbursementStatus } => {
        if (item.type === 'financial' && item.disbursementId) {
            const linked = disbursementById.get(item.disbursementId);
            if (linked) {
                return { aidStatus: mapDisbursementToAidStatus(linked.status), disbursementStatus: linked.status };
            }
        }
        return { aidStatus: item.status };
    };

    const timeline = useMemo(() => {
        const entries: TimelineEntry[] = [
            ...aidLog.map((item) => ({ kind: 'aid' as const, item })),
            ...disbursements
                .filter((d) => !linkedDisbursementIds.has(d.id))
                .map((disbursement) => ({ kind: 'disbursement' as const, disbursement })),
        ];
        return entries.sort((a, b) => {
            const dateA = a.kind === 'aid' ? a.item.date : (a.disbursement.processedDate || a.disbursement.scheduledDate);
            const dateB = b.kind === 'aid' ? b.item.date : (b.disbursement.processedDate || b.disbursement.scheduledDate);
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
    }, [aidLog, disbursements, linkedDisbursementIds]);

    useEffect(() => {
        if (timeline.length === 0) return;
        consumeHighlightParam((disbursementId) => {
            const matches = timeline.some((entry) =>
                entry.kind === 'disbursement'
                    ? entry.disbursement.id === disbursementId
                    : entry.item.disbursementId === disbursementId,
            );
            return matches ? disbursementId : null;
        });
    }, [timeline, consumeHighlightParam]);

    const isEntryHighlighted = (entry: TimelineEntry) => {
        if (!highlightedId) return false;
        if (entry.kind === 'disbursement') return entry.disbursement.id === highlightedId;
        return entry.item.disbursementId === highlightedId;
    };

    const getEntryHighlightId = (entry: TimelineEntry) =>
        entry.kind === 'disbursement' ? entry.disbursement.id : (entry.item.disbursementId ?? entry.item.id);

    const aidTypeConfig: Record<AidItem['type'], { icon: React.FC, color: string }> = {
        financial: { icon: FinancialAidIcon, color: 'text-green-500' },
        'in-kind': { icon: InKindAidIcon, color: 'text-blue-500' },
        service: { icon: ServiceAidIcon, color: 'text-purple-500' },
    };
    const aidTypeBadgeConfig: Record<AidItem['type'], string> = {
        financial: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        'in-kind': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        service: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    };

    const statusConfig: Record<AidStatus, { icon: React.FC, color: string }> = {
        Delivered: { icon: CheckCircle, color: 'text-green-500' },
        Pending: { icon: AlertCircle, color: 'text-yellow-500' },
        Scheduled: { icon: Clock, color: 'text-blue-500' },
    };

    const buildAidItem = (form: AidItemFormInput, existingId?: string, disbursementId?: string): AidItem => ({
        id: existingId || `aid-${Date.now()}`,
        type: form.type,
        date: new Date(form.date).toISOString(),
        description: { en: form.descriptionEn, ar: form.descriptionAr || form.descriptionEn },
        value: form.value ? parseFloat(form.value) : undefined,
        unit: form.unit || undefined,
        status: form.status,
        relatedProjectId: form.relatedProjectId || undefined,
        disbursementId,
    });

    const validateForm = (form: AidItemFormInput): boolean => {
        if (!form.descriptionEn.trim() && !form.descriptionAr.trim()) {
            toast.showError(t('beneficiaries.validation.descriptionRequired'));
            return false;
        }

        const rawValue = form.value.trim();
        if (!rawValue) {
            toast.showError(t(form.type === 'financial' ? 'beneficiaries.validation.amountRequired' : 'beneficiaries.validation.quantityRequired'));
            return false;
        }

        const value = parseFloat(rawValue);
        if (Number.isNaN(value) || value < 0) {
            toast.showError(t('beneficiaries.validation.invalidAmount'));
            return false;
        }

        const rawUnit = form.unit.trim();
        if (!rawUnit) {
            toast.showError(t(form.type === 'financial' ? 'beneficiaries.validation.currencyRequired' : 'beneficiaries.validation.unitRequired'));
            return false;
        }

        return true;
    };

    const handleSubmit = async (form: AidItemFormInput) => {
        if (!onUpdate || !validateForm(form)) return;

        let disbursementId = editingItem?.disbursementId;
        let linkedDisbursementStatus: DisbursementStatus | undefined;
        if (form.type === 'financial' && !disbursementId) {
            try {
                const created = await createDisbursement.mutateAsync({
                    beneficiaryId: beneficiary.id,
                    beneficiaryNameEn: beneficiary.name.en,
                    beneficiaryNameAr: beneficiary.name.ar,
                    type: 'aid_payment',
                    amount: parseFloat(form.value),
                    currency: form.unit,
                    scheduledDate: form.date,
                    method: 'bank_transfer',
                    notes: form.descriptionEn,
                });
                disbursementId = created.id;
                linkedDisbursementStatus = created.status;
                toast.showSuccess(t('beneficiaries.aidLog.disbursementRequested'));
            } catch {
                toast.showError(t('beneficiaries.aidLog.disbursementRequestFailed'));
                return;
            }
        }

        const item = buildAidItem(form, editingItem?.id, disbursementId);
        if (form.type === 'financial') {
            const linked = linkedDisbursementStatus
                ? { status: linkedDisbursementStatus }
                : (disbursementId ? disbursementById.get(disbursementId) : undefined);
            item.status = linked ? mapDisbursementToAidStatus(linked.status) : 'Pending';
        }
        const nextLog = editingItem
            ? aidLog.map((entry) => (entry.id === editingItem.id ? item : entry))
            : [item, ...aidLog];

        onUpdate(nextLog);
        setEditingItem(null);
        toast.showSuccess(t('beneficiaries.actions.saved'));
    };

    const handleRemove = async () => {
        if (!onUpdate || !itemToRemove) return;

        if (itemToRemove.disbursementId) {
            try {
                await cancelDisbursement.mutateAsync(itemToRemove.disbursementId);
            } catch {
                toast.showError(t('beneficiaries.aidLog.disbursementCancelFailed'));
                return;
            }
        }

        onUpdate(aidLog.filter((entry) => entry.id !== itemToRemove.id));
        setItemToRemove(null);
        toast.showSuccess(t('beneficiaries.actions.saved'));
    };

    const handleCancelDisbursement = async () => {
        if (!disbursementToCancel) return;
        try {
            await cancelDisbursement.mutateAsync(disbursementToCancel.id);
            setDisbursementToCancel(null);
            toast.showSuccess(t('beneficiaries.aidLog.disbursementCancelled'));
        } catch {
            toast.showError(t('beneficiaries.aidLog.disbursementCancelFailed'));
        }
    };

    const openAddModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item: AidItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const projectName = (projectId?: string) => {
        if (!projectId) return null;
        return projects.find((p) => p.id === projectId)?.name[language];
    };

    const openFinancialsForDisbursement = (disbursementId: string, status?: DisbursementStatus) => {
        openFinancialsTab(status === 'pending_approval' ? 'approvals' : 'disbursements', disbursementId);
    };

    const renderAidEntry = (item: AidItem) => {
        const TypeIcon = aidTypeConfig[item.type].icon;
        const { aidStatus, disbursementStatus } = getEffectiveStatus(item);
        const StatusIcon = statusConfig[aidStatus].icon;
        const statusColor = statusConfig[aidStatus].color;
        const statusLabel = item.type === 'financial' && disbursementStatus
            ? t(`financials.status.${disbursementStatus}`)
            : t(`beneficiaries.aidLog.status.${aidStatus.toLowerCase()}`);
        const linkedProject = projectName(item.relatedProjectId);

        return (
            <div key={item.id} className="mb-8 relative group">
                <div className={`absolute top-1 w-10 h-10 rounded-full bg-card dark:bg-dark-card border-2 border-gray-200 dark:border-slate-700 flex items-center justify-center ${aidTypeConfig[item.type].color} ${dir === 'rtl' ? 'right-[-52px]' : 'left-[-52px]'}`}>
                    <TypeIcon />
                </div>
                <div
                    data-highlight-id={getEntryHighlightId({ kind: 'aid', item })}
                    className={`bg-card dark:bg-dark-card/50 p-4 rounded-xl shadow-md border dark:border-slate-700 transition-colors duration-500 ${
                        isEntryHighlighted({ kind: 'aid', item }) ? HIGHLIGHT_CARD_CLASS : ''
                    }`}
                >
                    <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-foreground dark:text-dark-foreground">{item.description[language] || item.description.en}</p>
                            <p className="text-sm text-gray-500">{formatDate(item.date, language, 'long')}</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${aidTypeBadgeConfig[item.type]}`}>
                                {t(`beneficiaries.aidLog.types.${item.type}`)}
                            </span>
                            <div className={`flex items-center gap-1 text-xs font-semibold ${statusColor}`}>
                                <StatusIcon className="w-4 h-4" />
                                {statusLabel}
                            </div>
                            {onUpdate && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEditModal(item)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                                        aria-label={t('beneficiaries.aidLog.editItem')}
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        onClick={() => setItemToRemove(item)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        aria-label={t('beneficiaries.aidLog.removeItem')}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t dark:border-slate-600 text-sm space-y-1">
                        {item.value !== undefined && (
                            <p>
                                <strong>{t('beneficiaries.aidLog.value')}:</strong>{' '}
                                {item.type === 'financial' && item.unit
                                    ? formatCurrency(item.value, language, item.unit)
                                    : `${formatNumber(item.value, language)} ${item.unit || ''}`}
                            </p>
                        )}
                        {linkedProject && (
                            <p><strong>{t('beneficiaries.fields.project')}:</strong> {linkedProject}</p>
                        )}
                        {item.disbursementId && (
                            <p className="text-gray-600 dark:text-gray-300">
                                <strong>{t('beneficiaries.aidLog.linkedDisbursement')}:</strong>{' '}
                                <button type="button" onClick={() => item.disbursementId && openFinancialsForDisbursement(item.disbursementId, disbursementStatus)} className="inline-flex items-center gap-1 text-primary hover:underline">
                                    {t('beneficiaries.aidLog.viewInFinancials')}
                                    <ExternalLink size={12} />
                                </button>
                            </p>
                        )}
                        {item.inventoryItemId && (
                            <p className="text-gray-500 dark:text-gray-400">
                                <strong>{t('beneficiaries.aidLog.inventoryRef')}:</strong> {item.inventoryItemId}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderDisbursementEntry = (disbursement: Disbursement) => {
        const mappedStatus = mapDisbursementToAidStatus(disbursement.status);
        const StatusIcon = statusConfig[mappedStatus].icon;
        const statusColor = statusConfig[mappedStatus].color;
        const displayDate = disbursement.processedDate || disbursement.scheduledDate;
        const title = t(`financials.disbursementType.${disbursement.type}`);

        return (
            <div key={`disbursement-${disbursement.id}`} className="mb-8 relative group">
                <div className={`absolute top-1 w-10 h-10 rounded-full bg-card dark:bg-dark-card border-2 border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 ${dir === 'rtl' ? 'right-[-52px]' : 'left-[-52px]'}`}>
                    <Landmark size={18} />
                </div>
                <div
                    data-highlight-id={getEntryHighlightId({ kind: 'disbursement', disbursement })}
                    className={`bg-card dark:bg-dark-card/50 p-4 rounded-xl shadow-md border border-amber-100 dark:border-amber-900/40 transition-colors duration-500 ${
                        isEntryHighlighted({ kind: 'disbursement', disbursement }) ? HIGHLIGHT_CARD_CLASS : ''
                    }`}
                >
                    <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-foreground dark:text-dark-foreground">{title}</p>
                            <p className="text-sm text-gray-500">{formatDate(displayDate, language, 'long')}</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                {t('beneficiaries.aidLog.fromFinancials')}
                            </span>
                            <div className={`flex items-center gap-1 text-xs font-semibold ${statusColor}`}>
                                <StatusIcon className="w-4 h-4" />
                                {t(`financials.status.${disbursement.status}`)}
                            </div>
                            {disbursement.status === 'pending_approval' && (
                                <button
                                    type="button"
                                    onClick={() => setDisbursementToCancel(disbursement)}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    aria-label={t('beneficiaries.aidLog.withdrawDisbursement')}
                                >
                                    <Trash2 size={13} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t dark:border-slate-600 text-sm space-y-1">
                        <p>
                            <strong>{t('beneficiaries.aidLog.value')}:</strong>{' '}
                            {formatCurrency(disbursement.amount, language, disbursement.currency)}
                        </p>
                        {disbursement.notes && (
                            <p><strong>{t('beneficiaries.aidLog.notes')}:</strong> {disbursement.notes}</p>
                        )}
                        <button type="button" onClick={() => openFinancialsForDisbursement(disbursement.id, disbursement.status)} className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-semibold">
                            {t('beneficiaries.aidLog.viewInFinancials')}
                            <ExternalLink size={12} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const linkedDisbursementStatus = editingItem?.disbursementId
        ? disbursementById.get(editingItem.disbursementId)?.status
        : undefined;

    if (timeline.length === 0) {
        return (
            <>
                <div className="text-center py-16 px-6 bg-card dark:bg-dark-card rounded-2xl shadow-inner">
                    <h3 className="text-xl font-semibold text-foreground dark:text-dark-foreground">{t('beneficiaries.aidLog.noItems')}</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('beneficiaries.aidLog.noItemsDesc')}</p>
                    {onUpdate && (
                        <button
                            onClick={openAddModal}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary-dark transition-colors"
                        >
                            <PlusCircle size={16} /> {t('beneficiaries.aidLog.addItem')}
                        </button>
                    )}
                </div>
                <AidItemModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
                    onSubmit={handleSubmit}
                    initialItem={editingItem}
                    linkedDisbursementStatus={linkedDisbursementStatus}
                    projects={projects}
                />
            </>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">{t('beneficiaries.aidLog.title')}</h2>
                    {onUpdate && (
                        <button
                            onClick={openAddModal}
                            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-white hover:bg-secondary-dark transition-colors"
                        >
                            <PlusCircle size={16} /> {t('beneficiaries.aidLog.addItem')}
                        </button>
                    )}
                </div>
                <div className={`relative border-gray-200 dark:border-slate-700 ${dir === 'rtl' ? 'border-r-2 pr-8' : 'border-l-2 pl-8'}`}>
                    {timeline.map((entry) =>
                        entry.kind === 'aid'
                            ? renderAidEntry(entry.item)
                            : renderDisbursementEntry(entry.disbursement),
                    )}
                </div>
            </div>

            <AidItemModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
                onSubmit={handleSubmit}
                initialItem={editingItem}
                linkedDisbursementStatus={linkedDisbursementStatus}
                projects={projects}
            />

            <ConfirmationModal
                isOpen={!!itemToRemove}
                onClose={() => setItemToRemove(null)}
                onConfirm={handleRemove}
                title={t('beneficiaries.aidLog.removeItem')}
                message={t('beneficiaries.aidLog.removeConfirm')}
            />

            <ConfirmationModal
                isOpen={!!disbursementToCancel}
                onClose={() => setDisbursementToCancel(null)}
                onConfirm={handleCancelDisbursement}
                title={t('beneficiaries.aidLog.withdrawDisbursement')}
                message={t('beneficiaries.aidLog.withdrawDisbursementConfirm')}
            />
        </>
    );
};

export default AidLogTab;
