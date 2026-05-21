import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DONOR_STATUSES, DONOR_TIERS } from '@gms/shared';
import type { DonorProfileTask, IndividualDonor, Role } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { deleteDonorProfileDocument, uploadDonorProfileDocument, useDonorProfileDocuments, useDonorProfileDonations, useDonorProfileInteractions, useDonorProfileRecord, useDonorProfileSummary, useDonorProfileTasks } from '../../../hooks/useDonorProfileSummary';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate, formatRelativeTime } from '../../../lib/utils';
import Tabs from '../../common/Tabs';
import { ArrowLeft, Check, ExternalLink, FileText, Mail, MapPin, MessageSquare, Pencil, Trash2, Upload, X } from 'lucide-react';
import LogInteractionModal from './LogInteractionModal';
import SendEmailModal from './SendEmailModal';
import DonorGivingTab from './tabs/DonorGivingTab';
import DonorOverviewTab from './tabs/DonorOverviewTab';
import DonorRelationshipActivityTab from './tabs/DonorRelationshipActivityTab';
import { Chip, EmptyPanel, InfoRow, RelationshipHealthChip, Section } from './tabs/profileUi';

interface DonorDetailViewProps {
    donor: IndividualDonor;
    onBack: () => void;
    onDonorUpdated?: (donor: IndividualDonor) => void;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DONOR_TYPES: NonNullable<IndividualDonor['donorType']>[] = ['Individual', 'Company', 'Foundation', 'Major Donor', 'Recurring'];

const MAX_TAG_LEN = 30;
const MAX_TAGS = 20;

interface HeaderFormState {
    fullNameEn: string;
    fullNameAr: string;
    country: string;
    tags: string[];
    pendingTagInput: string;
    status: IndividualDonor['status'];
    tier: IndividualDonor['tier'];
    donorType: NonNullable<IndividualDonor['donorType']>;
    assignedManager: string;
}

const normalizeTag = (raw: string): string | null => {
    const tag = raw.trim();
    if (!tag || tag.length > MAX_TAG_LEN) return null;
    return tag;
};

const addTag = (tags: string[], raw: string): string[] => {
    const tag = normalizeTag(raw);
    if (!tag || tags.includes(tag)) return tags;
    if (tags.length >= MAX_TAGS) return tags;
    return [...tags, tag];
};

const buildHeaderFormState = (donor: IndividualDonor): HeaderFormState => ({
    fullNameEn: donor.fullName.en || '',
    fullNameAr: donor.fullName.ar || '',
    country: donor.country || '',
    tags: [...(donor.tags || [])],
    pendingTagInput: '',
    status: donor.status,
    tier: donor.tier,
    donorType: donor.donorType || 'Individual',
    assignedManager: donor.assignedManager || '',
});

const toTaskIsoDate = (value: string) => {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const StatusBadge: React.FC<{ status: IndividualDonor['status']; label: string }> = ({ status, label }) => {
    const styles: Record<IndividualDonor['status'], string> = {
        Active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        Lapsed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'On Hold': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        Deceased: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        Disqualified: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    };

    return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles[status]}`}>{label}</span>;
};

const TierBadge: React.FC<{ tier: IndividualDonor['tier']; label: string }> = ({ tier, label }) => {
    const styles: Record<string, string> = {
        Bronze: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        Silver: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        Gold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        Platinum: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        MajorDonor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    };

    return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles[tier.replace(/ /g, '')] || styles.Bronze}`}>{label}</span>;
};

const LoadingProfile = () => (
    <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" />
        <div className="h-80 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" />
    </div>
);

const DonorDocumentsTab: React.FC<{ donor: IndividualDonor; onChanged: () => void }> = ({ donor, onChanged }) => {
    const { t, language } = useLocalization(['common', 'individual_donors']);
    const toast = useToast();
    const queryClient = useQueryClient();
    const [label, setLabel] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const isApiBackedDonor = UUID_RE.test(donor.id);
    const documentsQuery = useDonorProfileDocuments(donor.id, donor);
    const documents = documentsQuery.data || [];
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const getDocumentUrl = (url: string) => url.startsWith('http') || url === '#' ? url : `${apiBase}${url}`;

    const handleUpload = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!file || !isApiBackedDonor) return;

        setIsUploading(true);
        try {
            await uploadDonorProfileDocument(donor.id, file, label.trim() || file.name);
            setFile(null);
            setLabel('');
            await queryClient.invalidateQueries({ queryKey: ['donor-profile-documents', donor.id] });
            onChanged();
            toast.showSuccess(t('individual_donors.detailView.documentUploaded', 'Document uploaded.'));
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.documentUploadFailed', 'Unable to upload document.'));
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (documentId: string) => {
        if (!isApiBackedDonor) return;

        try {
            await deleteDonorProfileDocument(donor.id, documentId);
            await queryClient.invalidateQueries({ queryKey: ['donor-profile-documents', donor.id] });
            onChanged();
            toast.showSuccess(t('individual_donors.detailView.documentDeleted', 'Document deleted.'));
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.documentDeleteFailed', 'Unable to delete document.'));
        }
    };

    return (
        <Section title={t('individual_donors.detailView.documents')} icon={<FileText size={18} />}>
            <div className="space-y-4">
                {isApiBackedDonor && (
                    <form onSubmit={handleUpload} className="grid grid-cols-1 gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/30 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <label className="min-w-0">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.detailView.documentLabel', 'Label')}</span>
                            <input value={label} onChange={(event) => setLabel(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" placeholder="Tax receipt" />
                        </label>
                        <label className="min-w-0">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.detailView.documentFile', 'File')}</span>
                            <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
                        </label>
                        <button type="submit" disabled={!file || isUploading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-secondary-dark disabled:cursor-not-allowed disabled:opacity-60 md:self-end">
                            <Upload size={16} /> {isUploading ? t('common.loading') : t('individual_donors.detailView.uploadDocument', 'Upload')}
                        </button>
                    </form>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {documentsQuery.isLoading ? (
                        [0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />)
                    ) : documents.length > 0 ? documents.map((document) => (
                    <div key={document.id} className="flex min-w-0 items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/30">
                        <div className="flex min-w-0 items-start gap-3">
                        <FileText size={18} className="mt-1 flex-shrink-0 text-primary dark:text-secondary" />
                        <div className="min-w-0">
                            <p className="break-words font-bold text-foreground dark:text-dark-foreground">{document.label || document.filename}</p>
                            <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">{document.filename}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {document.uploaded_at ? formatDate(document.uploaded_at, language) : 'N/A'}
                                {document.size_bytes ? ` / ${Math.round(document.size_bytes / 1024)} KB` : ''}
                            </p>
                        </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1">
                            <a href={getDocumentUrl(document.file_url)} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-primary dark:hover:bg-slate-800 dark:hover:text-secondary" aria-label={t('common.open', 'Open')}>
                                <ExternalLink size={16} />
                            </a>
                            {isApiBackedDonor && (
                                <button onClick={() => handleDelete(document.id)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300" aria-label={t('common.delete', 'Delete')}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    )) : <div className="md:col-span-2 xl:col-span-3"><EmptyPanel text={t('individual_donors.detailView.noDocuments')} /></div>}
                </div>
            </div>
        </Section>
    );
};

export const DonorProfileRoute: React.FC<{
    donorId: string;
    onBack: () => void;
    onDonorUpdated?: (donor: IndividualDonor) => void;
}> = ({ donorId, onBack, onDonorUpdated }) => {
    const { t } = useLocalization(['common', 'individual_donors']);
    const donorQuery = useDonorProfileRecord(donorId);

    if (donorQuery.isLoading) return <LoadingProfile />;

    if (donorQuery.isError || !donorQuery.data) {
        return (
            <div className="space-y-4">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('individual_donors.backToList')}
                </button>
                <EmptyPanel text={t('individual_donors.detailView.profileLoadFailed', 'Unable to load this donor profile.')} />
            </div>
        );
    }

    return <DonorDetailView donor={donorQuery.data} onBack={onBack} onDonorUpdated={onDonorUpdated} />;
};

const DonorDetailView: React.FC<DonorDetailViewProps> = ({ donor, onBack, onDonorUpdated }) => {
    const { t, language } = useLocalization(['common', 'individual_donors', 'donors', 'misc']);
    const toast = useToast();
    const queryClient = useQueryClient();
    const [editableDonor, setEditableDonor] = useState(donor);
    const [activeTab, setActiveTab] = useState('overview');
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isHeaderEditing, setIsHeaderEditing] = useState(false);
    const [isSavingHeader, setIsSavingHeader] = useState(false);
    const [isSavingContact, setIsSavingContact] = useState(false);
    const [isSavingPipelineAsk, setIsSavingPipelineAsk] = useState(false);
    const [headerForm, setHeaderForm] = useState<HeaderFormState>(() => buildHeaderFormState(donor));

    const summaryQuery = useDonorProfileSummary(editableDonor.id, editableDonor);
    const donationsQuery = useDonorProfileDonations(editableDonor.id);
    const tasksQuery = useDonorProfileTasks(editableDonor.id, editableDonor);
    const interactionsQuery = useDonorProfileInteractions(editableDonor.id);

    const summary = summaryQuery.data;
    const donorName = summary ? (language === 'ar' && summary.donor.full_name_ar ? summary.donor.full_name_ar : summary.donor.full_name_en) : (editableDonor.fullName[language] || editableDonor.fullName.en);
    const statusKey = (summary?.donor.status || editableDonor.status).replace(/ /g, '');
    const tierKey = (summary?.donor.tier || editableDonor.tier).replace(/ /g, '');
    const isApiBackedDonor = UUID_RE.test(editableDonor.id);
    const visibleTags = useMemo(() => (summary?.donor.tags || editableDonor.tags || []).filter(Boolean).slice(0, 6), [editableDonor.tags, summary?.donor.tags]);

    const invalidateProfile = () => {
        void queryClient.invalidateQueries({ queryKey: ['donor-profile-record', editableDonor.id] });
        void queryClient.invalidateQueries({ queryKey: ['donor-profile-summary', editableDonor.id] });
        void queryClient.invalidateQueries({ queryKey: ['donor-profile-donations', editableDonor.id] });
        void queryClient.invalidateQueries({ queryKey: ['donor-profile-tasks', editableDonor.id] });
        void queryClient.invalidateQueries({ queryKey: ['donor-profile-interactions', editableDonor.id] });
        void queryClient.invalidateQueries({ queryKey: ['donor-profile-documents', editableDonor.id] });
        void queryClient.invalidateQueries({ queryKey: ['donors'] });
    };

    const getCachedProfileTasks = () => (
        queryClient.getQueryData<DonorProfileTask[]>(['donor-profile-tasks', editableDonor.id])
        || tasksQuery.data
        || []
    );

    const syncLocalTasks = (tasks: DonorProfileTask[]) => {
        const openTasks = tasks
            .filter((task) => !task.completed)
            .sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime());
        const relationshipTasks = tasks.map((task) => ({
            id: task.id,
            text: task.text,
            type: task.type,
            assignedTo: (task.assigned_to || editableDonor.assignedManager || 'Staff') as Role,
            dueDate: task.due_date || new Date().toISOString(),
            completed: task.completed,
        }));
        const updatedDonor: IndividualDonor = {
            ...editableDonor,
            relationshipTasks,
        };

        setEditableDonor(updatedDonor);
        onDonorUpdated?.(updatedDonor);
        queryClient.setQueryData(['donor-profile-tasks', editableDonor.id], tasks);
        queryClient.setQueryData(['donor-profile-summary', editableDonor.id], summary ? {
            ...summary,
            relationship: {
                ...summary.relationship,
                openTaskCount: openTasks.length,
            },
        } : summary);
    };

    const startHeaderEdit = () => {
        setHeaderForm(buildHeaderFormState({
            ...editableDonor,
            fullName: {
                en: summary?.donor.full_name_en || editableDonor.fullName.en,
                ar: summary?.donor.full_name_ar || editableDonor.fullName.ar,
            },
            country: summary?.donor.country || editableDonor.country,
            tags: summary?.donor.tags || editableDonor.tags,
            status: summary?.donor.status || editableDonor.status,
            tier: summary?.donor.tier || editableDonor.tier,
            donorType: editableDonor.donorType || 'Individual',
            assignedManager: summary?.donor.assigned_manager || editableDonor.assignedManager,
        }));
        setIsHeaderEditing(true);
    };

    const updateHeaderForm = <K extends keyof HeaderFormState>(key: K, value: HeaderFormState[K]) => {
        setHeaderForm((current) => ({ ...current, [key]: value }));
    };

    const handleHeaderSave = async (event: React.FormEvent) => {
        event.preventDefault();
        const fullNameEn = headerForm.fullNameEn.trim();
        if (!fullNameEn) {
            toast.showError(t('individual_donors.modal.requiredFields'));
            return;
        }

        const tags = addTag(headerForm.tags, headerForm.pendingTagInput);
        const payload = {
            full_name_en: fullNameEn,
            full_name_ar: headerForm.fullNameAr.trim(),
            country: headerForm.country.trim(),
            tags,
            status: headerForm.status,
            tier: headerForm.tier,
            assigned_manager: headerForm.assignedManager.trim(),
            custom_fields: {
                ...(summary?.donor.custom_fields || {}),
                donor_type: headerForm.donorType,
            },
        };

        setIsSavingHeader(true);
        try {
            if (isApiBackedDonor) {
                await api.patch(`/donors/${editableDonor.id}`, payload);
            }

            const updatedDonor: IndividualDonor = {
                ...editableDonor,
                fullName: {
                    en: payload.full_name_en,
                    ar: payload.full_name_ar || payload.full_name_en,
                },
                country: payload.country,
                tags,
                status: payload.status,
                tier: payload.tier,
                donorType: headerForm.donorType,
                assignedManager: payload.assigned_manager,
            };

            setEditableDonor(updatedDonor);
            onDonorUpdated?.(updatedDonor);
            queryClient.setQueryData(['donor-profile-summary', editableDonor.id], summary ? {
                ...summary,
                donor: {
                    ...summary.donor,
                    full_name_en: payload.full_name_en,
                    full_name_ar: payload.full_name_ar || payload.full_name_en,
                    country: payload.country,
                    tags,
                    status: payload.status,
                    tier: payload.tier,
                    assigned_manager: payload.assigned_manager,
                    custom_fields: payload.custom_fields,
                },
                relationship: {
                    ...summary.relationship,
                    owner: payload.assigned_manager,
                },
            } : summary);
            invalidateProfile();
            setIsHeaderEditing(false);
            toast.showSuccess(t('individual_donors.detailView.headerSaved', 'Donor profile updated.'));
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.headerSaveFailed', 'Unable to update donor profile.'));
        } finally {
            setIsSavingHeader(false);
        }
    };

    const handleLogInteraction = async (interaction: { type: string; date: string; subject: string; notes: string }) => {
        if (isApiBackedDonor) {
            try {
                await api.post(`/donors/${editableDonor.id}/interactions`, {
                    interaction_type: interaction.type.toLowerCase(),
                    occurred_at: new Date(interaction.date).toISOString(),
                    subject: interaction.subject || interaction.type,
                    notes: interaction.notes,
                    status: 'logged',
                });
                invalidateProfile();
            } catch (error) {
                toast.showError(error instanceof Error ? error.message : 'Unable to log interaction.');
                return;
            }
        }

        toast.showSuccess('Interaction logged successfully.');
        setIsLogModalOpen(false);
    };

    const handleSendEmail = async (emailData: { to: string; subject: string; body: string }) => {
        if (isApiBackedDonor) {
            try {
                await api.post(`/donors/${editableDonor.id}/interactions`, {
                    interaction_type: 'email',
                    occurred_at: new Date().toISOString(),
                    subject: emailData.subject || 'Email sent',
                    notes: emailData.body,
                    status: 'sent',
                });
                invalidateProfile();
            } catch {
                // Sending email is still a UI-only workflow in this MVP; keep the user moving.
            }
        }

        toast.showSuccess(`Email sent to ${emailData.to}.`);
        setIsEmailModalOpen(false);
    };

    const handleSaveContact = async ({ email, phone }: { email: string; phone: string }) => {
        const nextEmail = email.trim();
        const nextPhone = phone.trim();

        if (!nextEmail) {
            toast.showError(t('individual_donors.modal.requiredFields'));
            return;
        }

        setIsSavingContact(true);
        try {
            if (isApiBackedDonor) {
                await api.patch(`/donors/${editableDonor.id}`, {
                    email: nextEmail,
                    phone: nextPhone,
                });
            }

            const updatedDonor: IndividualDonor = {
                ...editableDonor,
                email: nextEmail,
                phone: nextPhone,
            };

            setEditableDonor(updatedDonor);
            onDonorUpdated?.(updatedDonor);
            queryClient.setQueryData(['donor-profile-summary', editableDonor.id], summary ? {
                ...summary,
                donor: {
                    ...summary.donor,
                    email: nextEmail,
                    phone: nextPhone,
                },
            } : summary);
            invalidateProfile();
            toast.showSuccess(t('individual_donors.detailView.contactSaved', 'Contact information updated.'));
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.contactSaveFailed', 'Unable to update contact information.'));
            throw error;
        } finally {
            setIsSavingContact(false);
        }
    };

    const handleSavePipelineAsk = async ({ pipelineStage, askAmount }: { pipelineStage: string; askAmount: number | null }) => {
        if (!isApiBackedDonor) return;

        setIsSavingPipelineAsk(true);
        try {
            const stageEnteredAt = summary?.relationship.pipelineStage === pipelineStage
                ? summary?.relationship.stageEnteredAt || new Date().toISOString()
                : new Date().toISOString();
            const customFields = {
                ...(summary?.donor.custom_fields || {}),
                pipeline_stage: pipelineStage,
                stage_entered_at: stageEnteredAt,
                ask_amount: askAmount,
                suggested_ask_amount: askAmount,
            };

            await api.patch(`/donors/${editableDonor.id}`, { custom_fields: customFields });
            setEditableDonor((current) => ({
                ...current,
                relationshipStage: pipelineStage as IndividualDonor['relationshipStage'],
                suggestedAskAmount: askAmount ?? undefined,
            }));
            queryClient.setQueryData(['donor-profile-summary', editableDonor.id], summary ? {
                ...summary,
                donor: {
                    ...summary.donor,
                    custom_fields: customFields,
                },
                relationship: {
                    ...summary.relationship,
                    pipelineStage,
                    stageEnteredAt,
                },
                computed: {
                    ...summary.computed,
                    suggestedAskAmount: askAmount,
                },
            } : summary);
            invalidateProfile();
            toast.showSuccess(t('individual_donors.detailView.pipelineAskSaved', 'Pipeline and ask updated.'));
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.pipelineAskSaveFailed', 'Unable to update pipeline and ask.'));
        } finally {
            setIsSavingPipelineAsk(false);
        }
    };

    const handleCreateTask = async (task: { text: string; type: string; assignedTo: string; dueDate: string }) => {
        try {
            const payload = {
                text: task.text,
                type: task.type,
                assigned_to: task.assignedTo,
                due_date: toTaskIsoDate(task.dueDate),
                completed: false,
                custom_fields: {},
            };

            if (isApiBackedDonor) {
                await api.post(`/donors/${editableDonor.id}/tasks`, payload);
                invalidateProfile();
            } else {
                syncLocalTasks([
                    ...getCachedProfileTasks(),
                    {
                        id: `local-task-${Date.now()}`,
                        donor_id: editableDonor.id,
                        text: payload.text,
                        type: payload.type as DonorProfileTask['type'],
                        assigned_to: payload.assigned_to,
                        due_date: payload.due_date,
                        completed: false,
                        custom_fields: {},
                    },
                ]);
            }
            toast.showSuccess(t('individual_donors.detailView.taskCreated', 'Task created.'));
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.taskCreateFailed', 'Unable to create task.'));
        }
    };

    const handleToggleTask = async (taskId: string, completed: boolean) => {
        try {
            if (isApiBackedDonor) {
                await api.patch(`/donors/${editableDonor.id}/tasks/${taskId}`, { completed });
                invalidateProfile();
            } else {
                syncLocalTasks(getCachedProfileTasks().map((task) => task.id === taskId ? { ...task, completed } : task));
            }
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.taskUpdateFailed', 'Unable to update task.'));
        }
    };

    const handleUpdateTask = async (taskId: string, task: { text: string; type: string; assignedTo: string; dueDate: string }) => {
        try {
            const payload = {
                text: task.text,
                type: task.type,
                assigned_to: task.assignedTo,
                due_date: toTaskIsoDate(task.dueDate),
            };

            if (isApiBackedDonor) {
                await api.patch(`/donors/${editableDonor.id}/tasks/${taskId}`, payload);
                invalidateProfile();
            } else {
                syncLocalTasks(getCachedProfileTasks().map((currentTask) => currentTask.id === taskId ? {
                    ...currentTask,
                    text: payload.text,
                    type: payload.type as DonorProfileTask['type'],
                    assigned_to: payload.assigned_to,
                    due_date: payload.due_date,
                } : currentTask));
            }
            toast.showSuccess(t('individual_donors.detailView.taskUpdated', 'Task updated.'));
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.taskUpdateFailed', 'Unable to update task.'));
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            if (isApiBackedDonor) {
                await api.delete(`/donors/${editableDonor.id}/tasks/${taskId}`);
                invalidateProfile();
            } else {
                syncLocalTasks(getCachedProfileTasks().filter((task) => task.id !== taskId));
            }
            toast.showSuccess(t('individual_donors.detailView.taskDeleted', 'Task deleted.'));
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.taskDeleteFailed', 'Unable to delete task.'));
        }
    };

    const handleUpdateInteraction = async (interactionId: string, interaction: { type: string; date: string; subject: string; status: string; notes: string }) => {
        if (!isApiBackedDonor) return;

        try {
            await api.patch(`/donors/${editableDonor.id}/interactions/${interactionId}`, {
                interaction_type: interaction.type,
                occurred_at: new Date(interaction.date).toISOString(),
                subject: interaction.subject,
                status: interaction.status,
                notes: interaction.notes,
            });
            invalidateProfile();
            toast.showSuccess(t('individual_donors.detailView.interactionUpdated', 'Interaction updated.'));
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.interactionUpdateFailed', 'Unable to update interaction.'));
        }
    };

    const handleDeleteInteraction = async (interactionId: string) => {
        if (!isApiBackedDonor) return;

        try {
            await api.delete(`/donors/${editableDonor.id}/interactions/${interactionId}`);
            invalidateProfile();
            toast.showSuccess(t('individual_donors.detailView.interactionDeleted', 'Interaction deleted.'));
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.interactionDeleteFailed', 'Unable to delete interaction.'));
        }
    };

    const tabs = [
        { id: 'overview', label: t('individual_donors.detailView.overview') },
        { id: 'giving', label: t('individual_donors.detailView.giving', 'Giving') },
        { id: 'relationship', label: t('individual_donors.detailView.relationshipActivity', 'Relationship / Activity') },
        { id: 'documents', label: t('individual_donors.detailView.documents') },
    ];

    const renderTabContent = () => {
        if (!summary) return <LoadingProfile />;

        switch (activeTab) {
            case 'overview':
                return (
                    <DonorOverviewTab
                        summary={summary}
                        tasks={tasksQuery.data || []}
                        isLoadingTasks={tasksQuery.isLoading}
                        onLogInteraction={() => setIsLogModalOpen(true)}
                        onSaveContact={handleSaveContact}
                        isSavingContact={isSavingContact}
                    />
                );
            case 'giving':
                return (
                    <DonorGivingTab
                        summary={summary}
                        donations={donationsQuery.data || []}
                        isLoading={donationsQuery.isLoading}
                        onSavePipelineAsk={isApiBackedDonor ? handleSavePipelineAsk : undefined}
                        saveDisabledReason={!isApiBackedDonor ? t('individual_donors.detailView.pipelineSaveUnavailable') : undefined}
                        isSavingPipelineAsk={isSavingPipelineAsk}
                    />
                );
            case 'relationship':
                return (
                    <DonorRelationshipActivityTab
                        tasks={tasksQuery.data || []}
                        interactions={interactionsQuery.data || []}
                        isLoading={tasksQuery.isLoading || interactionsQuery.isLoading}
                        onCreateTask={handleCreateTask}
                        onUpdateTask={handleUpdateTask}
                        onToggleTask={handleToggleTask}
                        onDeleteTask={handleDeleteTask}
                        onUpdateInteraction={isApiBackedDonor ? handleUpdateInteraction : undefined}
                        onDeleteInteraction={isApiBackedDonor ? handleDeleteInteraction : undefined}
                    />
                );
            case 'documents':
                return <DonorDocumentsTab donor={editableDonor} onChanged={invalidateProfile} />;
            default:
                return <div className="p-8 text-center">{t('placeholder.underConstruction')}</div>;
        }
    };

    if (summaryQuery.isLoading && !summary) {
        return <LoadingProfile />;
    }

    const status = summary?.donor.status || editableDonor.status;
    const tier = summary?.donor.tier || editableDonor.tier;
    const donorType = editableDonor.donorType;
    const donorTypeLabel = donorType ? t(`donors.types.${donorType.replace(/ /g, '')}`, donorType) : 'N/A';
    const location = [editableDonor.city, summary?.donor.country || editableDonor.country].filter(Boolean).join(', ');

    return (
        <>
            <div className="animate-fade-in space-y-4 pb-24 md:pb-0">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('individual_donors.backToList')}
                </button>

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-card shadow-soft dark:border-slate-700/60 dark:bg-dark-card">
                    <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                            <img src={summary?.donor.avatar || editableDonor.avatar} alt={donorName} className="h-20 w-20 flex-shrink-0 rounded-2xl border-4 border-primary-light object-cover dark:border-primary/20 sm:h-24 sm:w-24" />
                            <div className="min-w-0 flex-1">
                                {isHeaderEditing ? (
                                    <form id="donor-header-form" onSubmit={handleHeaderSave} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                        <label className="min-w-0">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.modal.fullNameEN')}</span>
                                            <input value={headerForm.fullNameEn} onChange={(event) => updateHeaderForm('fullNameEn', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                                        </label>
                                        <label className="min-w-0">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.modal.fullNameAR')}</span>
                                            <input value={headerForm.fullNameAr} onChange={(event) => updateHeaderForm('fullNameAr', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" dir="auto" />
                                        </label>
                                        <label className="min-w-0">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.columns.country')}</span>
                                            <input value={headerForm.country} onChange={(event) => updateHeaderForm('country', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                                        </label>
                                        <label className="min-w-0">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.columns.owner')}</span>
                                            <input value={headerForm.assignedManager} onChange={(event) => updateHeaderForm('assignedManager', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                                        </label>
                                        <label className="min-w-0">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.columns.status')}</span>
                                            <select value={headerForm.status} onChange={(event) => updateHeaderForm('status', event.target.value as IndividualDonor['status'])} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900">
                                                {DONOR_STATUSES.map((option) => <option key={option} value={option}>{t(`individual_donors.statuses.${option.replace(/ /g, '')}`, option)}</option>)}
                                            </select>
                                        </label>
                                        <label className="min-w-0">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.columns.tier')}</span>
                                            <select value={headerForm.tier} onChange={(event) => updateHeaderForm('tier', event.target.value as IndividualDonor['tier'])} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900">
                                                {DONOR_TIERS.map((option) => <option key={option} value={option}>{t(`individual_donors.tiers.${option.replace(/ /g, '')}`, option)}</option>)}
                                            </select>
                                        </label>
                                        <label className="min-w-0">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.columns.donorType')}</span>
                                            <select value={headerForm.donorType} onChange={(event) => updateHeaderForm('donorType', event.target.value as NonNullable<IndividualDonor['donorType']>)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900">
                                                {DONOR_TYPES.map((option) => <option key={option} value={option}>{t(`donors.types.${option.replace(/ /g, '')}`, option)}</option>)}
                                            </select>
                                        </label>
                                        <div className="min-w-0 lg:col-span-2">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.columns.tags')}</span>
                                            <div className="mt-1 rounded-lg border border-gray-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-900">
                                                {headerForm.tags.length > 0 && (
                                                    <div className="mb-2 flex flex-wrap gap-2">
                                                        {headerForm.tags.map((tag, index) => (
                                                            <span key={`${tag}-${index}`} className="inline-flex max-w-full items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 dark:bg-slate-800 dark:text-gray-200">
                                                                <span className="truncate">{tag}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateHeaderForm('tags', headerForm.tags.filter((_, i) => i !== index))}
                                                                    className="rounded-full opacity-70 hover:opacity-100"
                                                                    aria-label={t('common.remove', 'Remove')}
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <input
                                                    value={headerForm.pendingTagInput}
                                                    onChange={(event) => updateHeaderForm('pendingTagInput', event.target.value)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ',') {
                                                            event.preventDefault();
                                                            const nextTags = addTag(headerForm.tags, headerForm.pendingTagInput);
                                                            if (nextTags.length === headerForm.tags.length && headerForm.pendingTagInput.trim()) {
                                                                const trimmed = headerForm.pendingTagInput.trim();
                                                                if (trimmed.length > MAX_TAG_LEN) {
                                                                    toast.showError(t('individual_donors.detailView.tagTooLong'));
                                                                }
                                                            }
                                                            setHeaderForm((current) => ({
                                                                ...current,
                                                                tags: nextTags,
                                                                pendingTagInput: '',
                                                            }));
                                                            return;
                                                        }
                                                        if (event.key === 'Backspace' && !headerForm.pendingTagInput && headerForm.tags.length > 0) {
                                                            updateHeaderForm('tags', headerForm.tags.slice(0, -1));
                                                        }
                                                    }}
                                                    maxLength={MAX_TAG_LEN}
                                                    disabled={headerForm.tags.length >= MAX_TAGS}
                                                    className="w-full rounded-md border-0 bg-transparent px-1 py-1 text-sm font-semibold outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
                                                    placeholder={headerForm.tags.length >= MAX_TAGS
                                                        ? t('individual_donors.detailView.tagMaxReached')
                                                        : t('individual_donors.detailView.tagAddHint')}
                                                />
                                            </div>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <h1 className="break-words text-2xl font-bold leading-tight text-foreground dark:text-dark-foreground sm:text-3xl">{donorName}</h1>
                                        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                                            <MapPin size={15} /> {location || 'N/A'}
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <TierBadge tier={tier} label={t(`individual_donors.tiers.${tierKey}`, tier)} />
                                            <StatusBadge status={status} label={t(`individual_donors.statuses.${statusKey}`, status)} />
                                            {summary?.relationship.pipelineStage && <Chip tone="blue">{t(`donors.stages.${summary.relationship.pipelineStage}`, summary.relationship.pipelineStage)}</Chip>}
                                            <RelationshipHealthChip health={summary?.relationship.health || null} />
                                            {visibleTags.map((tag) => <Chip key={tag}>{tag}</Chip>)}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:w-80 xl:grid-cols-1">
                            {isHeaderEditing ? (
                                <div className="grid grid-cols-2 gap-2 sm:col-span-2 xl:col-span-1">
                                    <button type="submit" form="donor-header-form" disabled={isSavingHeader} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">
                                        <Check size={16} /> {isSavingHeader ? t('common.loading') : t('common.save')}
                                    </button>
                                    <button type="button" onClick={() => setIsHeaderEditing(false)} disabled={isSavingHeader} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-700">
                                        <X size={16} /> {t('common.cancel')}
                                    </button>
                                </div>
                            ) : (
                                <button onClick={startHeaderEdit} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-700">
                                    <Pencil size={16} /> {t('common.edit', 'Edit')}
                                </button>
                            )}
                            <button onClick={() => setIsEmailModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-secondary-dark">
                                <Mail size={16} /> {t('individual_donors.detailView.sendEmail')}
                            </button>
                            <button onClick={() => setIsLogModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-700">
                                <MessageSquare size={16} /> {t('individual_donors.detailView.logInteraction')}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-gray-200 bg-gray-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/20 xl:grid-cols-5">
                        <InfoRow label={t('individual_donors.columns.totalDonations')} value={summary ? formatCurrency(summary.giving.lifetimeGiving, language) : 'N/A'} muted />
                        <InfoRow label={t('individual_donors.columns.donorType')} value={donorTypeLabel} />
                        <InfoRow label={t('individual_donors.columns.owner')} value={summary?.relationship.owner || 'Unassigned'} />
                        <InfoRow label={t('individual_donors.columns.lastContact')} value={summary?.relationship.lastContact?.occurred_at ? formatRelativeTime(summary.relationship.lastContact.occurred_at, language) : 'N/A'} />
                        <InfoRow label={t('individual_donors.columns.openTasks')} value={summary?.relationship.openTaskCount ?? 0} />
                    </div>
                </section>

                {summaryQuery.isError && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-200">
                        {t('individual_donors.detailView.summaryFallback', 'Profile summary is using local fallback data because the API summary is unavailable.')}
                    </div>
                )}

                <section className="rounded-2xl border border-gray-200 bg-card shadow-sm dark:border-slate-700/60 dark:bg-dark-card">
                    <div className="px-4 pt-2 sm:px-6">
                        <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
                    </div>
                    <div className="rounded-b-2xl bg-gray-50/70 p-4 dark:bg-dark-background/30 sm:p-6">
                        {renderTabContent()}
                    </div>
                </section>
            </div>

            <LogInteractionModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} onLog={handleLogInteraction} />
            <SendEmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} onSend={handleSendEmail} donorEmail={summary?.donor.email || editableDonor.email} />
        </>
    );
};

export default DonorDetailView;
