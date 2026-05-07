import React from 'react';
import { useLocalization } from '../../../../hooks/useLocalization';
import type { Project, Beneficiary } from '../../../../types';
import { formatNumber } from '../../../../lib/utils';

interface BeneficiariesTabProps {
    project: Project;
    beneficiaries: Beneficiary[];
}

const BeneficiariesTab: React.FC<BeneficiariesTabProps> = ({ project, beneficiaries }) => {
    const { t, language } = useLocalization();

    const description = project.stakeholders.targetBeneficiaries;
    let target = 0;
    if (description) {
        const match = description.replace(/,/g, '').match(/\d+/);
        if (match) {
            target = parseInt(match[0], 10);
        }
    }

    const projectBeneficiaries = beneficiaries.filter(b => b.projectId === project.id);
    const reached = projectBeneficiaries.length;
    const percentage = target > 0 ? Math.round((reached / target) * 100) : 0;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">{t('beneficiaries.title')}</h2>
            <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex justify-between mb-1 text-sm font-medium">
                            <span>{t('beneficiaries.reached')}</span>
                            <span>{formatNumber(reached, language)} / {formatNumber(target, language)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-slate-700">
                            <div className="bg-primary h-4 rounded-full text-center text-white text-xs leading-4" style={{ width: `${percentage}%` }}>
                                {percentage > 10 ? `${percentage}%` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-6">
                <h3 className="font-bold text-lg mb-2">{t('beneficiaries.linkedBeneficiaries')}</h3>
                <div className="bg-card dark:bg-dark-card rounded-lg border dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="p-3">{t('beneficiaries.modal.personalInfo.fullName')}</th>
                                <th className="p-3">{t('beneficiaries.modal.personalInfo.country')}</th>
                                <th className="p-3">{t('beneficiaries.modal.academic.grade')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projectBeneficiaries.map(b => (
                                <tr key={b.id} className="border-t dark:border-slate-700">
                                    <td className="p-3 font-semibold">{b.name[language]}</td>
                                    <td className="p-3">{b.country}</td>
                                    <td className="p-3">{b.profile.type === 'student' ? b.profile.academicInfo?.level?.[language] : t(`beneficiaries.types.${b.beneficiaryType}`)}</td>
                                </tr>
                            ))}
                             {projectBeneficiaries.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center p-8 text-gray-500">{t('beneficiaries.noLinked')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default BeneficiariesTab;