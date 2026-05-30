import React, { useEffect, useMemo, useState } from 'react';
import type { Beneficiary, SponsorshipInfo, SupportType } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { useToast } from '../../../../hooks/useToast';
import { useDonors } from '../../../../hooks/useDonors';
import { formatCurrency, formatDate } from '../../../../lib/utils';
import { HeartHandshake, PlusCircle, Check, X, ExternalLink } from 'lucide-react';
import { openDonorProfile } from '../../../../lib/moduleNavigation';
import DonorSearchSelect from '../../../common/DonorSearchSelect';
import Section from '../shared/Section';
import InfoRow from '../shared/InfoRow';
import EditableField from '../shared/EditableField';

const CURRENCIES = ['USD', 'SAR', 'AED', 'EUR'] as const;

type SponsorshipProfile = Extract<Beneficiary['profile'], { type: 'student' | 'orphan' | 'hafiz' }>;

const isSponsorshipProfile = (profile: Beneficiary['profile']): profile is SponsorshipProfile =>
    profile.type === 'student' || profile.type === 'orphan' || profile.type === 'hafiz';

interface SponsorshipTabProps {
    beneficiary: Beneficiary;
    onUpdate?: (updated: Beneficiary) => void;
}

const formFromBeneficiary = (beneficiary: Beneficiary, sponsorship?: SponsorshipInfo) => ({
    supportType: beneficiary.supportType,
    donorId: sponsorship?.donorId != null ? String(sponsorship.donorId) : '',
    startDate: sponsorship?.startDate ? sponsorship.startDate.slice(0, 10) : '',
    monthlyAmount: sponsorship?.monthlyAmount?.toString() || '',
    currency: sponsorship?.currency || 'USD',
});

const SponsorshipTab: React.FC<SponsorshipTabProps> = ({ beneficiary, onUpdate }) => {
    const { t, language, dir } = useLocalization(['common', 'beneficiaries']);
    const toast = useToast();
    const { data: donors = [], isLoading: donorsLoading } = useDonors();

    const p = beneficiary.profile;
    const sponsorship = isSponsorshipProfile(p) ? p.sponsorship : undefined;

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(() => formFromBeneficiary(beneficiary, sponsorship));

    useEffect(() => {
        if (!isEditing) {
            setForm(formFromBeneficiary(beneficiary, sponsorship));
        }
    }, [beneficiary, sponsorship, isEditing]);

    const linkedDonor = useMemo(() => {
        if (!sponsorship?.donorId) return null;
        return donors.find((d) => String(d.id) === String(sponsorship.donorId)) ?? null;
    }, [donors, sponsorship?.donorId]);

    const donorName = linkedDonor
        ? (linkedDonor.fullName[language] || linkedDonor.fullName.en)
        : sponsorship?.donorId
            ? t('beneficiaries.sponsorship.donorNotFound')
            : null;

    const handleOpenDonorProfile = () => {
        if (!linkedDonor) return;
        openDonorProfile(linkedDonor.id);
    };

    const validateForm = (): boolean => {
        if (form.monthlyAmount) {
            const amount = parseFloat(form.monthlyAmount);
            if (Number.isNaN(amount) || amount < 0) {
                toast.showError(t('beneficiaries.validation.invalidAmount'));
                return false;
            }
        }
        return true;
    };

    const handleSave = () => {
        if (!onUpdate || !isSponsorshipProfile(p) || !validateForm()) return;

        const nextSponsorship: SponsorshipInfo = {
            donorId: form.donorId || undefined,
            startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
            monthlyAmount: form.monthlyAmount ? parseFloat(form.monthlyAmount) : undefined,
            currency: form.currency,
        };

        onUpdate({
            ...beneficiary,
            supportType: form.supportType,
            profile: {
                ...p,
                sponsorship: nextSponsorship,
            },
        });
        setIsEditing(false);
        toast.showSuccess(t('beneficiaries.actions.saved'));
    };

    const handleCancel = () => {
        setForm(formFromBeneficiary(beneficiary, sponsorship));
        setIsEditing(false);
    };

    if (!isSponsorshipProfile(p)) {
        return null;
    }

    if (!sponsorship && !isEditing) {
        return (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/30">
                <HeartHandshake className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                <h3 className="mt-3 text-lg font-semibold text-foreground dark:text-dark-foreground">{t('beneficiaries.sponsorship.empty')}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('beneficiaries.sponsorship.emptyDesc')}</p>
                {onUpdate && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary-dark transition-colors"
                    >
                        <PlusCircle size={16} /> {t('beneficiaries.sponsorship.add')}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <Section
                title={t('beneficiaries.tabs.sponsorship')}
                icon={<HeartHandshake size={18} />}
                accent="bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-300"
                onEdit={onUpdate && !isEditing ? () => setIsEditing(true) : undefined}
                editLabel={t('beneficiaries.actions.editSponsorship')}
            >
                {isEditing ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="block min-w-0">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.supportType')}</span>
                                <select
                                    value={form.supportType}
                                    onChange={(e) => setForm(f => ({ ...f, supportType: e.target.value as SupportType }))}
                                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-dark-foreground"
                                >
                                    <option value="direct-support">{t('beneficiaries.supportTypes.direct-support')}</option>
                                    <option value="sponsorship">{t('beneficiaries.supportTypes.sponsorship')}</option>
                                </select>
                            </label>
                            <DonorSearchSelect
                                label={t('beneficiaries.fields.donor')}
                                donors={donors}
                                selectedId={form.donorId}
                                onSelect={(donorId) => setForm(f => ({ ...f, donorId }))}
                                dir={dir}
                                disabled={donorsLoading}
                                placeholder={t('beneficiaries.sponsorship.donorSearchPlaceholder')}
                                noResultsText={t('beneficiaries.sponsorship.donorSearchNoResults')}
                            />
                            <EditableField label={t('beneficiaries.fields.startDate')} value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} type="date" />
                            <EditableField label={t('beneficiaries.fields.monthlyAmount')} value={form.monthlyAmount} onChange={v => setForm(f => ({ ...f, monthlyAmount: v }))} type="number" />
                            <label className="block min-w-0">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.currency')}</span>
                                <select
                                    value={form.currency}
                                    onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-dark-foreground"
                                >
                                    {CURRENCIES.map((currency) => (
                                        <option key={currency} value={currency}>{currency}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 pt-2">
                            <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-dark transition-colors">
                                <Check size={14} /> {t('common.save')}
                            </button>
                            <button onClick={handleCancel} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors">
                                <X size={14} /> {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoRow label={t('beneficiaries.fields.supportType')} value={t(`beneficiaries.supportTypes.${beneficiary.supportType}`)} />
                        <InfoRow
                            label={t('beneficiaries.fields.donor')}
                            value={
                                donorName ? (
                                    linkedDonor ? (
                                        <button
                                            type="button"
                                            onClick={handleOpenDonorProfile}
                                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                                        >
                                            {donorName}
                                            <ExternalLink size={13} />
                                        </button>
                                    ) : (
                                        donorName
                                    )
                                ) : undefined
                            }
                        />
                        <InfoRow label={t('beneficiaries.fields.startDate')} value={sponsorship?.startDate ? formatDate(sponsorship.startDate, language, 'long') : undefined} />
                        <InfoRow
                            label={t('beneficiaries.fields.monthlyAmount')}
                            value={
                                sponsorship?.monthlyAmount !== undefined
                                    ? `${formatCurrency(sponsorship.monthlyAmount, language)}${sponsorship.currency ? ` (${sponsorship.currency})` : ''}`
                                    : undefined
                            }
                        />
                    </div>
                )}
            </Section>

            {!isEditing && linkedDonor && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('beneficiaries.sponsorship.linkedNote')}</p>
            )}
        </div>
    );
};

export default SponsorshipTab;
