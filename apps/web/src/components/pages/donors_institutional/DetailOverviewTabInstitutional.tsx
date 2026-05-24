import React, { useEffect, useState } from 'react';
import type { InstitutionalDonor, GrantmakerRelationshipStatus, PriorityLevel } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { simulateLocalPersist } from '../../../lib/optimisticSubmit';
import { formatCurrency, formatDate, formatNumber, formatRelativeTime } from '../../../lib/utils';
import { Building2, CalendarClock, CircleDollarSign, Flag, Globe2, Handshake, MapPin, Pencil, Sparkles, UserRound, WalletCards, X, Check } from 'lucide-react';
import CountryCombobox from '../../common/CountryCombobox';
import { formatInstitutionalLocation } from './countryDisplay';

const RELATIONSHIP_STATUSES: GrantmakerRelationshipStatus[] = ['Cold', 'Prospect', 'Cultivating', 'Active', 'Stewardship'];
const PRIORITY_LEVELS: PriorityLevel[] = ['High', 'Medium', 'Low'];

const parseList = (value: string) => value.split(',').map((s) => s.trim()).filter(Boolean);

interface DetailOverviewTabInstitutionalProps {
    donor: InstitutionalDonor;
    onDonorUpdated?: (donor: InstitutionalDonor) => void;
    existingCountries?: string[];
}

interface RelationshipFormState {
    relationshipStatus: GrantmakerRelationshipStatus;
    priority: PriorityLevel;
    assignedManager: string;
    primaryContactName: string;
    primaryContactEmail: string;
}

interface FocusFormState {
    focusAreas: string;
    geographicFocus: string;
}

interface ProfileFormState {
    country: string;
    city: string;
    registrationNumber: string;
    establishmentDate: string;
    phone: string;
    website: string;
    address: string;
}

const buildRelationshipForm = (donor: InstitutionalDonor): RelationshipFormState => ({
    relationshipStatus: donor.relationshipStatus,
    priority: donor.priority,
    assignedManager: donor.assignedManager || '',
    primaryContactName: donor.primaryContact.name,
    primaryContactEmail: donor.primaryContact.email,
});

const buildFocusForm = (donor: InstitutionalDonor): FocusFormState => ({
    focusAreas: donor.focusAreas.join(', '),
    geographicFocus: (donor.geographicFocus || []).join(', '),
});

const buildProfileForm = (donor: InstitutionalDonor): ProfileFormState => ({
    country: donor.country || '',
    city: donor.city || '',
    registrationNumber: donor.registrationNumber || '',
    establishmentDate: donor.establishmentDate ? donor.establishmentDate.slice(0, 10) : '',
    phone: donor.phone || '',
    website: donor.website || '',
    address: donor.address || '',
});

const Panel: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    headerActions?: React.ReactNode;
}> = ({ title, icon, children, className = '', headerActions }) => (
    <section className={`min-w-0 rounded-xl border border-gray-200/80 bg-card p-5 shadow-sm dark:border-slate-700/70 dark:bg-dark-card ${className}`}>
        <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary dark:bg-primary/20 dark:text-secondary">{icon}</div>
                <h3 className="truncate text-base font-bold text-foreground dark:text-dark-foreground">{title}</h3>
            </div>
            {headerActions}
        </div>
        {children}
    </section>
);

const MetricCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; subtext?: React.ReactNode; accent?: string }> = ({ title, value, icon, subtext, accent = 'text-primary dark:text-secondary' }) => (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-card p-4 shadow-sm dark:border-slate-700/70 dark:bg-dark-card">
        <div className="flex min-w-0 items-start gap-3">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800 ${accent}`}>{icon}</div>
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
                <div className="mt-1 break-words text-xl font-bold leading-tight text-foreground dark:text-dark-foreground">{value}</div>
                {subtext && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtext}</p>}
            </div>
        </div>
    </div>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode; emptyText?: string }> = ({ label, value, emptyText }) => (
    <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
        <div className="mt-1 break-words text-sm font-bold leading-6 text-foreground dark:text-dark-foreground">{value || emptyText}</div>
    </div>
);

const Chip: React.FC<{ children: React.ReactNode; tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'purple' }> = ({ children, tone = 'neutral' }) => {
    const tones = {
        neutral: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-200',
        blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-200',
        green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-200',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-200',
        red: 'bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-200',
        purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/25 dark:text-purple-200',
    };

    return <span className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
};

const ChipList: React.FC<{ items: string[]; emptyText: string; tone?: React.ComponentProps<typeof Chip>['tone'] }> = ({ items, emptyText, tone = 'neutral' }) => {
    if (items.length === 0) return <span className="text-sm text-gray-500 dark:text-gray-400">{emptyText}</span>;

    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => <Chip key={item} tone={tone}>{item}</Chip>)}
        </div>
    );
};

const StatusBadge: React.FC<{ status: GrantmakerRelationshipStatus }> = ({ status }) => {
    const { t } = useLocalization(['institutional_donors']);
    const tones: Record<GrantmakerRelationshipStatus, React.ComponentProps<typeof Chip>['tone']> = {
        Cold: 'neutral',
        Prospect: 'blue',
        Cultivating: 'amber',
        Active: 'green',
        Stewardship: 'purple',
    };

    return <Chip tone={tones[status]}>{t(`institutional_donors.statuses.${status}`)}</Chip>;
};

const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
    const { t } = useLocalization(['institutional_donors']);
    const tones: Record<PriorityLevel, React.ComponentProps<typeof Chip>['tone']> = {
        High: 'red',
        Medium: 'amber',
        Low: 'green',
    };

    return <Chip tone={tones[priority]}>{t(`institutional_donors.priorities.${priority}`)}</Chip>;
};

const EditActions: React.FC<{
    isEditing: boolean;
    isSaving: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    editLabel: string;
    saveLabel: string;
    cancelLabel: string;
    savingLabel: string;
}> = ({ isEditing, isSaving, onEdit, onSave, onCancel, editLabel, saveLabel, cancelLabel, savingLabel }) => {
    if (!isEditing) {
        return (
            <button type="button" onClick={onEdit} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-light dark:text-secondary dark:hover:bg-primary/20" aria-label={editLabel}>
                <Pencil size={14} /> {editLabel}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <button type="button" onClick={onCancel} disabled={isSaving} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-slate-700">
                <X size={14} /> {cancelLabel}
            </button>
            <button type="button" onClick={onSave} disabled={isSaving} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-white bg-secondary hover:bg-secondary-dark disabled:opacity-50">
                <Check size={14} /> {isSaving ? savingLabel : saveLabel}
            </button>
        </div>
    );
};

const fieldClass = 'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900';

const DetailOverviewTabInstitutional: React.FC<DetailOverviewTabInstitutionalProps> = ({ donor, onDonorUpdated, existingCountries = [] }) => {
    const { t, language } = useLocalization(['common', 'institutional_donors']);
    const toast = useToast();

    const [editingRelationship, setEditingRelationship] = useState(false);
    const [editingFocus, setEditingFocus] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);
    const [isSavingRelationship, setIsSavingRelationship] = useState(false);
    const [isSavingFocus, setIsSavingFocus] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [relationshipForm, setRelationshipForm] = useState<RelationshipFormState>(() => buildRelationshipForm(donor));
    const [focusForm, setFocusForm] = useState<FocusFormState>(() => buildFocusForm(donor));
    const [profileForm, setProfileForm] = useState<ProfileFormState>(() => buildProfileForm(donor));

    useEffect(() => {
        if (!editingRelationship) setRelationshipForm(buildRelationshipForm(donor));
    }, [donor, editingRelationship]);

    useEffect(() => {
        if (!editingFocus) setFocusForm(buildFocusForm(donor));
    }, [donor, editingFocus]);

    useEffect(() => {
        if (!editingProfile) setProfileForm(buildProfileForm(donor));
    }, [donor, editingProfile]);

    const organizationName = donor.organizationName[language] || donor.organizationName.en;
    const location = formatInstitutionalLocation(donor.city, donor.country, t);
    const notAvailable = t('common.notAvailable');
    const nextDeadlineDate = donor.nextDeadline ? new Date(donor.nextDeadline) : null;
    const nextDeadlineState = nextDeadlineDate
        ? nextDeadlineDate.getTime() < Date.now()
            ? t('institutional_donors.detail.deadlinePassed')
            : formatRelativeTime(donor.nextDeadline, language)
        : t('institutional_donors.detail.noDeadline');
    const donationsThisYear = donor.totalGrantsAwarded / 4;
    const completionRate = Math.min(98, Math.max(65, Math.round(82 + donor.activeGrants / 20)));

    const persistDonor = async (patch: Partial<InstitutionalDonor>) => {
        const updated: InstitutionalDonor = { ...donor, ...patch };
        const saved = await simulateLocalPersist(() => updated);
        onDonorUpdated?.(saved);
        return saved;
    };

    const handleSaveRelationship = async () => {
        if (relationshipForm.primaryContactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(relationshipForm.primaryContactEmail.trim())) {
            toast.showError(t('institutional_donors.detail.validation.email'));
            return;
        }

        setIsSavingRelationship(true);
        try {
            await persistDonor({
                relationshipStatus: relationshipForm.relationshipStatus,
                priority: relationshipForm.priority,
                assignedManager: relationshipForm.assignedManager.trim() || 'Unassigned',
                primaryContact: {
                    name: relationshipForm.primaryContactName.trim(),
                    email: relationshipForm.primaryContactEmail.trim(),
                },
            });
            setEditingRelationship(false);
            toast.showSuccess(t('institutional_donors.detail.profileSaved'));
        } catch {
            toast.showError(t('institutional_donors.errors.generic'));
        } finally {
            setIsSavingRelationship(false);
        }
    };

    const handleSaveFocus = async () => {
        setIsSavingFocus(true);
        try {
            await persistDonor({
                focusAreas: parseList(focusForm.focusAreas),
                geographicFocus: parseList(focusForm.geographicFocus),
            });
            setEditingFocus(false);
            toast.showSuccess(t('institutional_donors.detail.profileSaved'));
        } catch {
            toast.showError(t('institutional_donors.errors.generic'));
        } finally {
            setIsSavingFocus(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            await persistDonor({
                country: profileForm.country.trim(),
                city: profileForm.city.trim(),
                registrationNumber: profileForm.registrationNumber.trim(),
                establishmentDate: profileForm.establishmentDate || undefined,
                phone: profileForm.phone.trim(),
                website: profileForm.website.trim(),
                address: profileForm.address.trim(),
            });
            setEditingProfile(false);
            toast.showSuccess(t('institutional_donors.detail.profileSaved'));
        } catch {
            toast.showError(t('institutional_donors.errors.generic'));
        } finally {
            setIsSavingProfile(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard title={t('institutional_donors.detail.totalAwarded')} value={formatCurrency(donor.totalGrantsAwarded, language, 'USD')} icon={<CircleDollarSign size={19} />} accent="text-emerald-600 dark:text-emerald-300" />
                <MetricCard title={t('institutional_donors.detail.activeGrants')} value={formatNumber(donor.activeGrants, language)} icon={<WalletCards size={19} />} accent="text-blue-600 dark:text-blue-300" />
                <MetricCard title={t('institutional_donors.detail.nextDeadline')} value={donor.nextDeadline ? formatDate(donor.nextDeadline, language) : notAvailable} icon={<CalendarClock size={19} />} subtext={nextDeadlineState} accent="text-amber-600 dark:text-amber-300" />
                <MetricCard title={t('institutional_donors.detail.priority')} value={<PriorityBadge priority={donor.priority} />} icon={<Flag size={19} />} accent="text-red-600 dark:text-red-300" />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <Panel
                    title={t('institutional_donors.detail.relationshipBrief')}
                    icon={<Handshake size={18} />}
                    headerActions={
                        onDonorUpdated ? (
                            <EditActions
                                isEditing={editingRelationship}
                                isSaving={isSavingRelationship}
                                onEdit={() => setEditingRelationship(true)}
                                onSave={() => void handleSaveRelationship()}
                                onCancel={() => {
                                    setRelationshipForm(buildRelationshipForm(donor));
                                    setEditingRelationship(false);
                                }}
                                editLabel={t('institutional_donors.detail.edit')}
                                saveLabel={t('common.save')}
                                cancelLabel={t('common.cancel')}
                                savingLabel={t('common.saving')}
                            />
                        ) : undefined
                    }
                >
                    {editingRelationship ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label className="block text-xs font-semibold text-gray-500">
                                {t('institutional_donors.detail.status')}
                                <select value={relationshipForm.relationshipStatus} onChange={(e) => setRelationshipForm((f) => ({ ...f, relationshipStatus: e.target.value as GrantmakerRelationshipStatus }))} className={fieldClass}>
                                    {RELATIONSHIP_STATUSES.map((s) => <option key={s} value={s}>{t(`institutional_donors.statuses.${s}`)}</option>)}
                                </select>
                            </label>
                            <label className="block text-xs font-semibold text-gray-500">
                                {t('institutional_donors.detail.priority')}
                                <select value={relationshipForm.priority} onChange={(e) => setRelationshipForm((f) => ({ ...f, priority: e.target.value as PriorityLevel }))} className={fieldClass}>
                                    {PRIORITY_LEVELS.map((p) => <option key={p} value={p}>{t(`institutional_donors.priorities.${p}`)}</option>)}
                                </select>
                            </label>
                            <label className="block text-xs font-semibold text-gray-500 sm:col-span-2">
                                {t('institutional_donors.detail.assignedManager')}
                                <input type="text" value={relationshipForm.assignedManager} onChange={(e) => setRelationshipForm((f) => ({ ...f, assignedManager: e.target.value }))} className={fieldClass} />
                            </label>
                            <label className="block text-xs font-semibold text-gray-500">
                                {t('institutional_donors.detail.primaryContact')}
                                <input type="text" value={relationshipForm.primaryContactName} onChange={(e) => setRelationshipForm((f) => ({ ...f, primaryContactName: e.target.value }))} className={fieldClass} />
                            </label>
                            <label className="block text-xs font-semibold text-gray-500">
                                {t('institutional_donors.detail.email')}
                                <input type="email" value={relationshipForm.primaryContactEmail} onChange={(e) => setRelationshipForm((f) => ({ ...f, primaryContactEmail: e.target.value }))} className={fieldClass} />
                            </label>
                            <InfoRow label={t('institutional_donors.detail.lastContact')} value={donor.lastContactDate ? formatRelativeTime(donor.lastContactDate, language) : notAvailable} />
                            <InfoRow label={t('institutional_donors.detail.type')} value={t(`institutional_donors.types.${donor.type}`)} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <InfoRow label={t('institutional_donors.detail.status')} value={<StatusBadge status={donor.relationshipStatus} />} />
                            <InfoRow label={t('institutional_donors.detail.assignedManager')} value={donor.assignedManager} />
                            <InfoRow label={t('institutional_donors.detail.primaryContact')} value={donor.primaryContact.name} />
                            <InfoRow label={t('institutional_donors.detail.email')} value={<a href={`mailto:${donor.primaryContact.email}`} className="text-primary hover:underline dark:text-secondary">{donor.primaryContact.email}</a>} />
                            <InfoRow label={t('institutional_donors.detail.lastContact')} value={donor.lastContactDate ? formatRelativeTime(donor.lastContactDate, language) : notAvailable} />
                            <InfoRow label={t('institutional_donors.detail.type')} value={t(`institutional_donors.types.${donor.type}`)} />
                        </div>
                    )}
                </Panel>

                <Panel title={t('institutional_donors.detail.nextMove')} icon={<Sparkles size={18} />}>
                    <div className="rounded-lg bg-primary-light/60 p-4 dark:bg-primary/10">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary dark:text-secondary">{organizationName}</p>
                        <p className="mt-2 break-words text-base font-bold leading-6 text-foreground dark:text-dark-foreground">
                            {donor.nextDeadline
                                ? t('institutional_donors.detail.prepareDeadline', { date: formatDate(donor.nextDeadline, language) })
                                : t('institutional_donors.detail.scheduleStewardship')}
                        </p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <InfoRow label={t('institutional_donors.detail.donationsThisYear')} value={formatCurrency(donationsThisYear, language, 'USD')} />
                        <InfoRow label={t('institutional_donors.analyticsDashboard.projectCompletion')} value={`${formatNumber(completionRate, language)}%`} />
                    </div>
                </Panel>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <Panel
                    title={t('institutional_donors.detail.focusFit')}
                    icon={<Globe2 size={18} />}
                    className="xl:col-span-1"
                    headerActions={
                        onDonorUpdated ? (
                            <EditActions
                                isEditing={editingFocus}
                                isSaving={isSavingFocus}
                                onEdit={() => setEditingFocus(true)}
                                onSave={() => void handleSaveFocus()}
                                onCancel={() => {
                                    setFocusForm(buildFocusForm(donor));
                                    setEditingFocus(false);
                                }}
                                editLabel={t('institutional_donors.detail.edit')}
                                saveLabel={t('common.save')}
                                cancelLabel={t('common.cancel')}
                                savingLabel={t('common.saving')}
                            />
                        ) : undefined
                    }
                >
                    {editingFocus ? (
                        <div className="space-y-4">
                            <label className="block text-xs font-semibold text-gray-500">
                                {t('institutional_donors.columns.focus')}
                                <input type="text" value={focusForm.focusAreas} onChange={(e) => setFocusForm((f) => ({ ...f, focusAreas: e.target.value }))} placeholder={t('institutional_donors.modal.focusAreasHint')} className={fieldClass} />
                            </label>
                            <label className="block text-xs font-semibold text-gray-500">
                                {t('institutional_donors.detail.geographicFocus')}
                                <input type="text" value={focusForm.geographicFocus} onChange={(e) => setFocusForm((f) => ({ ...f, geographicFocus: e.target.value }))} placeholder={t('institutional_donors.modal.geographicFocusHint')} className={fieldClass} />
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{t('institutional_donors.columns.focus')}</p>
                                <ChipList items={donor.focusAreas} emptyText={notAvailable} tone="blue" />
                            </div>
                            <div>
                                <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{t('institutional_donors.detail.geographicFocus')}</p>
                                <ChipList items={donor.geographicFocus || []} emptyText={notAvailable} tone="green" />
                            </div>
                        </div>
                    )}
                </Panel>

                <Panel
                    title={t('institutional_donors.detail.organizationProfile')}
                    icon={<Building2 size={18} />}
                    className="xl:col-span-2"
                    headerActions={
                        onDonorUpdated ? (
                            <EditActions
                                isEditing={editingProfile}
                                isSaving={isSavingProfile}
                                onEdit={() => setEditingProfile(true)}
                                onSave={() => void handleSaveProfile()}
                                onCancel={() => {
                                    setProfileForm(buildProfileForm(donor));
                                    setEditingProfile(false);
                                }}
                                editLabel={t('institutional_donors.detail.edit')}
                                saveLabel={t('common.save')}
                                cancelLabel={t('common.cancel')}
                                savingLabel={t('common.saving')}
                            />
                        ) : undefined
                    }
                >
                    {editingProfile ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <label className="block text-xs font-semibold text-gray-500">
                                {t('institutional_donors.detail.country')}
                                <CountryCombobox
                                    value={profileForm.country}
                                    onChange={(value) => setProfileForm((f) => ({ ...f, country: value }))}
                                    existingCountries={existingCountries}
                                    placeholder={t('common.countryField.placeholder')}
                                    noResultsText={t('common.countryField.noResults')}
                                    className="mt-1"
                                />
                            </label>
                            <label className="block text-xs font-semibold text-gray-500">
                                {t('institutional_donors.modal.city')}
                                <input type="text" value={profileForm.city} onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))} className={fieldClass} />
                            </label>
                            <label className="block text-xs font-semibold text-gray-500">
                                {t('institutional_donors.detail.registrationNumber')}
                                <input type="text" value={profileForm.registrationNumber} onChange={(e) => setProfileForm((f) => ({ ...f, registrationNumber: e.target.value }))} className={fieldClass} />
                            </label>
                            <label className="block text-xs font-semibold text-gray-500">
                                {t('institutional_donors.detail.establishmentDate')}
                                <input type="date" value={profileForm.establishmentDate} onChange={(e) => setProfileForm((f) => ({ ...f, establishmentDate: e.target.value }))} className={fieldClass} />
                            </label>
                            <label className="block text-xs font-semibold text-gray-500">
                                {t('institutional_donors.detail.phone')}
                                <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} className={fieldClass} />
                            </label>
                            <label className="block text-xs font-semibold text-gray-500">
                                {t('institutional_donors.detail.website')}
                                <input type="url" value={profileForm.website} onChange={(e) => setProfileForm((f) => ({ ...f, website: e.target.value }))} className={fieldClass} />
                            </label>
                            <label className="block text-xs font-semibold text-gray-500 sm:col-span-2 lg:col-span-3">
                                {t('institutional_donors.detail.address')}
                                <input type="text" value={profileForm.address} onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))} className={fieldClass} />
                            </label>
                            <InfoRow label={t('institutional_donors.detail.createdDate')} value={formatDate(donor.createdDate, language)} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <InfoRow label={t('institutional_donors.detail.country')} value={<span className="inline-flex items-center gap-1"><MapPin size={14} /> {location || notAvailable}</span>} />
                            <InfoRow label={t('institutional_donors.modal.city')} value={donor.city || notAvailable} />
                            <InfoRow label={t('institutional_donors.detail.registrationNumber')} value={donor.registrationNumber || notAvailable} />
                            <InfoRow label={t('institutional_donors.detail.establishmentDate')} value={donor.establishmentDate ? formatDate(donor.establishmentDate, language) : notAvailable} />
                            <InfoRow label={t('institutional_donors.detail.phone')} value={donor.phone || notAvailable} />
                            <InfoRow label={t('institutional_donors.detail.website')} value={donor.website ? <a href={donor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline dark:text-secondary">{donor.website}</a> : notAvailable} />
                            <InfoRow label={t('institutional_donors.detail.address')} value={donor.address || notAvailable} />
                            <InfoRow label={t('institutional_donors.detail.createdDate')} value={formatDate(donor.createdDate, language)} />
                        </div>
                    )}
                </Panel>
            </div>

            <Panel title={t('institutional_donors.analyticsDashboard.title')} icon={<UserRound size={18} />}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoRow label={t('institutional_donors.analyticsDashboard.donationGrowth')} value="+15.2%" />
                    <InfoRow label={t('institutional_donors.analyticsDashboard.projectCompletion')} value={`${formatNumber(completionRate, language)}%`} />
                    <InfoRow label={t('institutional_donors.analyticsDashboard.communicationFrequency')} value={t('institutional_donors.detail.every45Days')} />
                    <InfoRow label={t('institutional_donors.analyticsDashboard.satisfactionScore')} value="4.8 / 5" />
                </div>
            </Panel>
        </div>
    );
};

export default DetailOverviewTabInstitutional;
