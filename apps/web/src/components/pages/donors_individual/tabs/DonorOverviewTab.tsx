import React, { useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle2, ClipboardList, Clock, DollarSign, Gift, MessageSquare, Pencil, Phone, Target, X } from 'lucide-react';
import type { DonorProfileActivity, DonorProfileSummary, DonorProfileTask } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { formatCurrency, formatDate, formatNumber, formatRelativeFromEvent, formatRelativeTime } from '../../../../lib/utils';
import { EmptyPanel, InfoRow, MetricCard, Section } from './profileUi';

interface DonorOverviewTabProps {
    summary: DonorProfileSummary;
    tasks: DonorProfileTask[];
    isLoadingTasks?: boolean;
    onLogInteraction: () => void;
    onSaveContact?: (contact: { email: string; phone: string }) => Promise<void> | void;
    isSavingContact?: boolean;
}

const ActivityIcon: React.FC<{ type: DonorProfileActivity['type'] }> = ({ type }) => {
    if (type === 'donation') return <Gift size={17} />;
    if (type === 'interaction') return <MessageSquare size={17} />;
    return <ClipboardList size={17} />;
};

const RecentActivityList: React.FC<{ activities: DonorProfileActivity[] }> = ({ activities }) => {
    const { t, language } = useLocalization(['common', 'individual_donors']);

    if (activities.length === 0) {
        return <EmptyPanel text={t('individual_donors.detailView.noActivity', 'No recent activity recorded yet.')} />;
    }

    return (
        <div className="space-y-3">
            {activities.map((activity) => (
                <div key={`${activity.type}-${activity.id}`} className="flex min-w-0 items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/30">
                    <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-secondary">
                        <ActivityIcon type={activity.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-bold text-foreground dark:text-dark-foreground">
                            {activity.type === 'donation' && activity.amount !== undefined
                                ? `${formatCurrency(activity.amount, language)} / ${activity.title}`
                                : activity.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {activity.occurred_at ? formatRelativeFromEvent(activity.occurred_at, language) : t('common.unknown', 'Unknown')}
                            {activity.status ? ` / ${activity.status}` : ''}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const DonorOverviewTab: React.FC<DonorOverviewTabProps> = ({
    summary,
    tasks,
    isLoadingTasks,
    onLogInteraction,
    onSaveContact,
    isSavingContact,
}) => {
    const { t, language } = useLocalization(['common', 'individual_donors', 'donors']);
    const stageLabel = summary.relationship.pipelineStage ? t(`donors.stages.${summary.relationship.pipelineStage}`, summary.relationship.pipelineStage) : 'N/A';
    const [isContactEditing, setIsContactEditing] = useState(false);
    const [contactForm, setContactForm] = useState({ email: summary.donor.email || '', phone: summary.donor.phone || '' });
    const { openTasks, completedTasks, overdueTasks } = useMemo(() => {
        const sortedOpenTasks = tasks
            .filter((task) => !task.completed)
            .sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime());
        const today = new Date().toISOString().split('T')[0];

        return {
            openTasks: sortedOpenTasks,
            completedTasks: tasks.filter((task) => task.completed),
            overdueTasks: sortedOpenTasks.filter((task) => task.due_date && task.due_date < today),
        };
    }, [tasks]);

    useEffect(() => {
        if (!isContactEditing) {
            setContactForm({ email: summary.donor.email || '', phone: summary.donor.phone || '' });
        }
    }, [isContactEditing, summary.donor.email, summary.donor.phone]);

    const handleContactSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!onSaveContact || !contactForm.email.trim()) return;

        try {
            await onSaveContact({
                email: contactForm.email.trim(),
                phone: contactForm.phone.trim(),
            });
            setIsContactEditing(false);
        } catch {
            // The parent owns user-facing error messaging; keep the form open for correction.
        }
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard title={t('individual_donors.columns.totalDonations')} value={formatCurrency(summary.giving.lifetimeGiving, language)} icon={<DollarSign size={19} />} accent="text-emerald-600 dark:text-emerald-300" />
                <MetricCard title={t('individual_donors.kpi.totalGifts')} value={formatNumber(summary.giving.totalGifts, language)} icon={<Gift size={19} />} accent="text-blue-600 dark:text-blue-300" />
                <MetricCard title={t('individual_donors.columns.pipelineStage')} value={stageLabel} icon={<Target size={19} />} subtext={summary.relationship.stageEnteredAt ? formatRelativeTime(summary.relationship.stageEnteredAt, language) : undefined} accent="text-amber-600 dark:text-amber-300" />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
                <Section title={t('individual_donors.detailView.taskSummary', 'Task Summary')} icon={<ClipboardList size={18} />}>
                    {isLoadingTasks ? (
                        <div className="h-28 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
                    ) : openTasks.length > 0 ? (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-primary/15 bg-primary-light/60 p-4 dark:bg-primary/10">
                                <p className="text-xs font-semibold uppercase text-primary dark:text-secondary">{t('individual_donors.columns.openTasks')}</p>
                                <p className="mt-2 text-2xl font-bold text-foreground dark:text-dark-foreground">{formatNumber(openTasks.length, language)}</p>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                                    {overdueTasks.length > 0
                                        ? `${formatNumber(overdueTasks.length, language)} ${t('donors.card.overdue')}`
                                        : t('individual_donors.detailView.openTaskSummary', 'Open tasks are managed in the Relationship / Activity tab.')}
                                </p>
                            </div>
                            <div className="space-y-2">
                                {openTasks.slice(0, 3).map((task) => (
                                    <div key={task.id} className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/30">
                                        <p className="break-words text-sm font-bold text-foreground dark:text-dark-foreground">{task.text}</p>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {task.type} / {task.assigned_to || t('common.unassigned', 'Unassigned')}
                                            {task.due_date ? ` / ${formatDate(task.due_date, language)}` : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : completedTasks.length > 0 ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={18} />
                                <div className="min-w-0">
                                    <p className="font-bold">{t('individual_donors.detailView.allTasksDone', 'All tasks are complete')}</p>
                                    <p className="mt-1 text-xs">{formatNumber(completedTasks.length, language)} {t('individual_donors.detailView.completedTasks', 'completed tasks')}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <EmptyPanel text={t('individual_donors.detailView.noTasksYet', 'No tasks yet.')} />
                    )}
                </Section>

                <Section title={t('individual_donors.detailView.contactInfo')} icon={<Phone size={18} />}>
                    {isContactEditing ? (
                        <form onSubmit={handleContactSubmit} className="space-y-3">
                            <label className="block min-w-0">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.modal.email')}</span>
                                <input
                                    type="email"
                                    value={contactForm.email}
                                    onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900"
                                    required
                                />
                            </label>
                            <label className="block min-w-0">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.modal.phone')}</span>
                                <input
                                    type="tel"
                                    value={contactForm.phone}
                                    onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900"
                                />
                            </label>
                            <div className="flex flex-wrap justify-end gap-2">
                                <button type="submit" disabled={isSavingContact || !contactForm.email.trim()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">
                                    <Check size={14} /> {isSavingContact ? t('common.loading') : t('common.save')}
                                </button>
                                <button type="button" onClick={() => setIsContactEditing(false)} disabled={isSavingContact} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold hover:bg-gray-100 disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-700">
                                    <X size={14} /> {t('common.cancel')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                {onSaveContact && (
                                    <button onClick={() => setIsContactEditing(true)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-colors hover:bg-gray-100 hover:text-foreground dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-dark-foreground" aria-label={t('common.edit', 'Edit')}>
                                        <Pencil size={14} />
                                    </button>
                                )}
                            </div>
                            <InfoRow label={t('individual_donors.modal.email')} value={<a href={`mailto:${summary.donor.email}`} className="text-primary hover:underline dark:text-secondary">{summary.donor.email}</a>} />
                            <InfoRow label={t('individual_donors.modal.phone')} value={summary.donor.phone ? <a href={`tel:${summary.donor.phone}`} className="text-primary hover:underline dark:text-secondary">{summary.donor.phone}</a> : 'N/A'} />
                        </div>
                    )}
                </Section>
            </div>

            <Section title={t('individual_donors.recentActivity')} icon={<Clock size={18} />}>
                {summary.recentActivity.length === 0 ? (
                    <EmptyPanel
                        text={t('individual_donors.detailView.noActivity', 'No recent activity recorded yet.')}
                        action={<button onClick={onLogInteraction} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-white hover:bg-secondary-dark">{t('individual_donors.detailView.logInteraction')}</button>}
                    />
                ) : <RecentActivityList activities={summary.recentActivity} />}
            </Section>
        </div>
    );
};

export default DonorOverviewTab;
