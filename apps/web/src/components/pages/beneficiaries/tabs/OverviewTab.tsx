import React from 'react';
import type { Beneficiary } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';

const InfoItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">{value ?? '—'}</dd>
    </div>
);

const OverviewTab: React.FC<{ beneficiary: Beneficiary }> = ({ beneficiary }) => {
    const { t, language } = useLocalization(['beneficiaries']);
    const p = beneficiary.profile;

    const renderTypeSpecificFields = () => {
        switch (p.type) {
            case 'student':
                return (
                    <>
                        <InfoItem label={t('beneficiaries.fields.dob')} value={p.dob} />
                        <InfoItem label={t('beneficiaries.fields.gender')} value={p.gender} />
                        <InfoItem label={t('beneficiaries.fields.university')} value={p.academicInfo?.university} />
                        <InfoItem label={t('beneficiaries.fields.major')} value={p.academicInfo?.field} />
                        <InfoItem label={t('beneficiaries.fields.gpa')} value={p.academicInfo?.gpa} />
                        <InfoItem label={t('beneficiaries.fields.academicYear')} value={p.academicInfo?.level?.[language]} />
                    </>
                );
            case 'orphan':
                return (
                    <>
                        <InfoItem label={t('beneficiaries.fields.dob')} value={p.dob} />
                        <InfoItem label={t('beneficiaries.fields.gender')} value={p.gender} />
                        <InfoItem label={t('beneficiaries.fields.school')} value={p.academicInfo?.school} />
                        <InfoItem label={t('beneficiaries.fields.grade')} value={p.academicInfo?.grade} />
                        <InfoItem label={t('beneficiaries.fields.attendance')} value={p.academicInfo?.attendance} />
                    </>
                );
            case 'hafiz':
                return (
                    <>
                        <InfoItem label={t('beneficiaries.fields.dob')} value={p.dob} />
                        <InfoItem label={t('beneficiaries.fields.gender')} value={p.gender} />
                        <InfoItem label={t('beneficiaries.fields.circle')} value={p.memorization?.circle} />
                        <InfoItem label={t('beneficiaries.fields.juzCompleted')} value={p.memorization?.juzCompleted ? `${p.memorization.juzCompleted} / 30` : null} />
                    </>
                );
            case 'family':
                return (
                    <>
                        <InfoItem label={t('beneficiaries.fields.headOfHousehold')} value={p.headOfHousehold} />
                        <InfoItem label={t('beneficiaries.fields.memberCount')} value={p.memberCount} />
                        <InfoItem label={t('beneficiaries.fields.monthlyIncome')} value={p.monthlyIncome} />
                        <InfoItem label={t('beneficiaries.fields.housingType')} value={p.housingType} />
                    </>
                );
            case 'institution':
                return (
                    <>
                        <InfoItem label={t('beneficiaries.fields.directorName')} value={p.directorName} />
                        <InfoItem label={t('beneficiaries.fields.capacity')} value={p.capacity} />
                        <InfoItem label={t('beneficiaries.fields.institutionType')} value={p.institutionType} />
                    </>
                );
            case 'community':
                return (
                    <>
                        <InfoItem label={t('beneficiaries.fields.populationEstimate')} value={p.populationEstimate?.toLocaleString()} />
                        <InfoItem label={t('beneficiaries.fields.fieldOfficer')} value={p.fieldOfficer} />
                        <InfoItem label={t('beneficiaries.fields.areaType')} value={p.areaType} />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Contact Info */}
            <div>
                <h3 className="font-bold text-lg mb-3 text-foreground dark:text-dark-foreground">{t('beneficiaries.sections.contactInfo')}</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    <InfoItem label={t('beneficiaries.fields.id')} value={beneficiary.id} />
                    <InfoItem label={t('beneficiaries.fields.country')} value={beneficiary.country} />
                    <InfoItem label={t('beneficiaries.fields.email')} value={p.contact?.email} />
                    <InfoItem label={t('beneficiaries.fields.phone')} value={p.contact?.phone} />
                    <InfoItem label={t('beneficiaries.fields.address')} value={p.contact?.address} />
                </dl>
            </div>

            {/* Type-specific details */}
            <div>
                <h3 className="font-bold text-lg mb-3 text-foreground dark:text-dark-foreground">{t('beneficiaries.sections.details')}</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    {renderTypeSpecificFields()}
                </dl>
            </div>

            {/* Milestones (if any) */}
            {beneficiary.milestones.length > 0 && (
                <div>
                    <h3 className="font-bold text-lg mb-3 text-foreground dark:text-dark-foreground">{t('beneficiaries.sections.milestones')}</h3>
                    <div className="space-y-2">
                        {beneficiary.milestones.map(m => {
                            const statusColor = {
                                achieved: 'bg-green-500',
                                'in-progress': 'bg-yellow-500',
                                pending: 'bg-gray-300 dark:bg-slate-600',
                            }[m.status];

                            return (
                                <div key={m.id} className="flex items-center gap-3 py-2">
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColor}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground dark:text-dark-foreground">
                                            {m.title[language] || m.title.en}
                                        </p>
                                    </div>
                                    {m.date && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                            {new Date(m.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short' })}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverviewTab;
