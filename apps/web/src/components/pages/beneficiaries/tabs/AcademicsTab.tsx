import React from 'react';
import type { StudentProfile } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';

const AcademicsTab: React.FC<{ profile: StudentProfile }> = ({ profile }) => {
    const { t, language } = useLocalization(['beneficiaries']);
    const info = profile.academicInfo;

    if (!info) {
        return <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('beneficiaries.noData')}</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-lg mb-3 text-foreground dark:text-dark-foreground">{t('beneficiaries.tabs.academics')}</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.university')}</dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">{info.university || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.major')}</dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">{info.field || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.academicYear')}</dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">{info.level?.[language] || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.gpa')}</dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">
                            {info.gpa !== undefined ? (
                                <span className="flex items-center gap-2">
                                    {info.gpa.toFixed(2)}
                                    <span className="text-xs text-gray-400">/ 4.0</span>
                                </span>
                            ) : '—'}
                        </dd>
                    </div>
                </dl>
            </div>

            {/* GPA visual bar */}
            {info.gpa !== undefined && (
                <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('beneficiaries.fields.gpaProgress')}</h4>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                        <div
                            className="bg-primary h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(info.gpa / 4.0) * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicsTab;
