import React from 'react';
import type { OrphanProfile } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';

const GuardianTab: React.FC<{ profile: OrphanProfile }> = ({ profile }) => {
    const { t } = useLocalization(['beneficiaries']);

    return (
        <div className="space-y-6">
            {/* Guardian info */}
            {profile.guardian && (
                <div>
                    <h3 className="font-bold text-lg mb-3 text-foreground dark:text-dark-foreground">{t('beneficiaries.sections.guardian')}</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.guardianName')}</dt>
                            <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">{profile.guardian.name}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.relation')}</dt>
                            <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">{profile.guardian.relation}</dd>
                        </div>
                        {profile.guardian.phone && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.phone')}</dt>
                                <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">{profile.guardian.phone}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            )}

            {/* Family members */}
            {profile.familyMembers && profile.familyMembers.length > 0 && (
                <div>
                    <h3 className="font-bold text-lg mb-3 text-foreground dark:text-dark-foreground">{t('beneficiaries.sections.familyMembers')}</h3>
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800">
                                <tr>
                                    <th className="px-4 py-2 text-start">{t('beneficiaries.fields.name')}</th>
                                    <th className="px-4 py-2 text-start">{t('beneficiaries.fields.relation')}</th>
                                    <th className="px-4 py-2 text-start">{t('beneficiaries.fields.age')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {profile.familyMembers.map((member, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-2 font-medium text-foreground dark:text-dark-foreground">{member.name}</td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{member.relation}</td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{member.age ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuardianTab;
