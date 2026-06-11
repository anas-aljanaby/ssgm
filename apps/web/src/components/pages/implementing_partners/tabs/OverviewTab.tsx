import React, { useEffect, useState } from 'react';
import { Briefcase, CheckCircle, FileCheck, Mail, MapPin, Star, Tag, User } from 'lucide-react';
import type { Partner, PartnerSector, PartnerStatus } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { useToast } from '../../../../hooks/useToast';
import { formatCurrency } from '../../../../lib/utils';
import { EditActions, fieldClass } from '../shared';

const STATUS_STYLES: Record<string, string> = {
    'نشط': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    'غير نشط': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'قيد المراجعة': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
};

const SECTORS: PartnerSector[] = ['التعليم', 'الصحة', 'الإغاثة', 'التنمية', 'البيئة'];
const STATUSES: PartnerStatus[] = ['نشط', 'غير نشط', 'قيد المراجعة'];

interface OverviewRowProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
}

const OverviewRow: React.FC<OverviewRowProps> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-primary dark:text-secondary mt-0.5">{icon}</div>
        <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
            <div className="font-semibold text-foreground dark:text-dark-foreground">{value}</div>
        </div>
    </div>
);

interface OverviewTabProps {
    partner: Partner;
    onPartnerUpdate: (updated: Partner) => void;
    isSaving?: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ partner, onPartnerUpdate, isSaving = false }) => {
    const { t, language } = useLocalization(['partners', 'common']);
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        status: partner.status,
        sector: partner.sector,
        country: partner.country,
    });

    useEffect(() => {
        if (!isEditing) {
            setForm({ status: partner.status, sector: partner.sector, country: partner.country });
        }
    }, [partner, isEditing]);

    const primaryContact = partner.contacts?.find((c) => c.isPrimary) ?? partner.contacts?.[0];
    const isEligible = partner.status === 'نشط';

    // PLACEHOLDER: Agreement/compliance derived from status until dedicated backend exists
    const hasAgreement = partner.status !== 'غير نشط';
    const complianceCurrent = partner.status !== 'قيد المراجعة';

    const handleSave = () => {
        if (!form.country.trim()) {
            toast.showError(t('partners.validation.required'));
            return;
        }
        onPartnerUpdate({ ...partner, status: form.status, sector: form.sector, country: form.country.trim() });
        setIsEditing(false);
        toast.showSuccess(t('partners.detail.overviewSaveSuccess'));
    };

    const handleCancel = () => {
        setForm({ status: partner.status, sector: partner.sector, country: partner.country });
        setIsEditing(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{t('partners.detail.overview.summaryTitle')}</h3>
                <EditActions
                    isEditing={isEditing}
                    isSaving={isSaving}
                    onEdit={() => setIsEditing(true)}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    editLabel={t('common.edit')}
                    saveLabel={t('common.save')}
                    cancelLabel={t('common.cancel')}
                    savingLabel={t('common.loading')}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-xl space-y-4">
                    <OverviewRow
                        icon={<CheckCircle size={18} />}
                        label={t('partners.detail.overview.statusEligibility')}
                        value={
                            isEditing ? (
                                <select className={fieldClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PartnerStatus }))}>
                                    {STATUSES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="space-y-1">
                                    <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLES[partner.status] ?? ''}`}>
                                        {partner.status}
                                    </span>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {isEligible ? t('partners.detail.overview.eligible') : t('partners.detail.overview.notEligible')}
                                    </p>
                                </div>
                            )
                        }
                    />
                    <OverviewRow
                        icon={<Tag size={18} />}
                        label={t('partners.detail.overview.sectorCountry')}
                        value={
                            isEditing ? (
                                <div className="space-y-2">
                                    <select className={fieldClass} value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value as PartnerSector }))}>
                                        {SECTORS.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <input className={fieldClass} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
                                </div>
                            ) : (
                                `${partner.sector} · ${partner.country}`
                            )
                        }
                    />
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-xl space-y-4">
                    <OverviewRow
                        icon={<User size={18} />}
                        label={t('partners.detail.overview.primaryContact')}
                        value={
                            primaryContact ? (
                                <div>
                                    <p>{primaryContact.name}</p>
                                    <p className="text-sm text-gray-500 font-normal">{primaryContact.position}</p>
                                    <a href={`mailto:${primaryContact.email}`} className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                                        <Mail size={14} /> {primaryContact.email}
                                    </a>
                                </div>
                            ) : (
                                <span className="text-gray-400 italic">{t('partners.detail.overview.noPrimaryContact')}</span>
                            )
                        }
                    />
                    <OverviewRow
                        icon={<Star size={18} />}
                        label={t('partners.detail.overview.latestPerformance')}
                        value={`${partner.rating.toFixed(1)} / 5.0`}
                    />
                </div>

                <div className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded-xl space-y-4">
                    {/* PLACEHOLDER: Agreement status — no agreements backend yet */}
                    <OverviewRow
                        icon={<FileCheck size={18} />}
                        label={t('partners.detail.overview.agreementStatus')}
                        value={hasAgreement ? t('partners.detail.overview.agreementActive') : t('partners.detail.overview.agreementNone')}
                    />
                    {/* PLACEHOLDER: Compliance status — no compliance backend yet */}
                    <OverviewRow
                        icon={<MapPin size={18} />}
                        label={t('partners.detail.overview.complianceStatus')}
                        value={complianceCurrent ? t('partners.detail.overview.complianceCurrent') : t('partners.detail.overview.compliancePending')}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl text-center">
                    <Briefcase className="mx-auto mb-2 text-blue-600" size={24} />
                    <p className="text-sm text-gray-500">{t('partners.detail.overview.activeProjects')}</p>
                    <p className="text-2xl font-bold">{partner.projectsInProgress}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl text-center">
                    <CheckCircle className="mx-auto mb-2 text-green-600" size={24} />
                    <p className="text-sm text-gray-500">{t('partners.detail.overview.completedProjects')}</p>
                    <p className="text-2xl font-bold">{partner.projectsCompleted}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl text-center">
                    <p className="text-sm text-gray-500">{t('partners.detail.overview.totalBudget')}</p>
                    <p className="text-2xl font-bold">{formatCurrency(partner.budget, language)}</p>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
