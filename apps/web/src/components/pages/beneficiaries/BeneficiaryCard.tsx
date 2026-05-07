import React from 'react';
import type { Beneficiary, ProgramProject } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import BeneficiaryStatusBadge from './BeneficiaryStatusBadge';
import { getBeneficiarySubtitle } from './beneficiaryUtils';

interface BeneficiaryCardProps {
    beneficiary: Beneficiary;
    project?: ProgramProject;
    onClick: () => void;
}

const BeneficiaryCard: React.FC<BeneficiaryCardProps> = ({ beneficiary, project, onClick }) => {
    const { t, language } = useLocalization(['beneficiaries']);

    const name = beneficiary.name[language] || beneficiary.name.en || beneficiary.name.ar;
    const subtitle = getBeneficiarySubtitle(beneficiary, language, t);

    const typeColor: Record<string, string> = {
        student: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        orphan: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
        hafiz: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
        family: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        institution: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
        community: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    };

    return (
        <div
            onClick={onClick}
            className="bg-card dark:bg-dark-card rounded-xl shadow-soft border dark:border-slate-700/50 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
        >
            <div className="flex items-start gap-3">
                <img
                    src={beneficiary.photo}
                    alt={name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-white dark:border-slate-700 shadow-sm"
                    loading="lazy"
                />
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground dark:text-dark-foreground truncate">{name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
                </div>
                <BeneficiaryStatusBadge status={beneficiary.status} />
            </div>

            <div className="mt-3 pt-3 border-t dark:border-slate-700/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className={`font-semibold px-2 py-0.5 rounded-full ${typeColor[beneficiary.beneficiaryType] || 'bg-gray-100 dark:bg-slate-700'}`}>
                    {t(`beneficiaries.types.${beneficiary.beneficiaryType}`)}
                </span>
                <span>{beneficiary.country}</span>
            </div>

            {project && (
                <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 truncate">
                    {project.name[language]}
                </div>
            )}
        </div>
    );
};

export default BeneficiaryCard;
