import React from 'react';
import type { Beneficiary, ProgramProject } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import BeneficiaryStatusBadge from './BeneficiaryStatusBadge';
import { getBeneficiarySubtitle } from './beneficiaryUtils';

interface BeneficiaryTableProps {
    beneficiaries: Beneficiary[];
    projects: ProgramProject[];
    onSelect: (beneficiary: Beneficiary) => void;
}

const typeColor: Record<string, string> = {
    student: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    orphan: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
    hafiz: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    family: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    institution: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    community: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
};

const BeneficiaryTable: React.FC<BeneficiaryTableProps> = ({ beneficiaries, projects, onSelect }) => {
    const { t, language } = useLocalization(['beneficiaries']);

    const getLastAidDate = (b: Beneficiary): string | null => {
        if (!b.aidLog.length) return null;
        const delivered = b.aidLog
            .filter(a => a.status === 'Delivered')
            .sort((a, c) => new Date(c.date).getTime() - new Date(a.date).getTime());
        return delivered[0]?.date || null;
    };

    return (
        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft overflow-hidden border dark:border-slate-700/50">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-dark-card/80 text-xs uppercase text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-4 py-3 text-start font-semibold">{t('beneficiaries.table.name')}</th>
                            <th className="px-4 py-3 text-start font-semibold">{t('beneficiaries.table.type')}</th>
                            <th className="px-4 py-3 text-start font-semibold">{t('beneficiaries.table.status')}</th>
                            <th className="px-4 py-3 text-start font-semibold">{t('beneficiaries.table.country')}</th>
                            <th className="px-4 py-3 text-start font-semibold">{t('beneficiaries.table.project')}</th>
                            <th className="px-4 py-3 text-start font-semibold">{t('beneficiaries.table.lastAid')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                        {beneficiaries.map(b => {
                            const name = b.name[language] || b.name.en || b.name.ar;
                            const subtitle = getBeneficiarySubtitle(b, language, t);
                            const project = projects.find(p => p.id === b.projectId);
                            const lastAid = getLastAidDate(b);

                            return (
                                <tr
                                    key={b.id}
                                    onClick={() => onSelect(b)}
                                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={b.photo}
                                                alt={name}
                                                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                                loading="lazy"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-foreground dark:text-dark-foreground truncate">{name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor[b.beneficiaryType] || 'bg-gray-100 dark:bg-slate-700'}`}>
                                            {t(`beneficiaries.types.${b.beneficiaryType}`)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <BeneficiaryStatusBadge status={b.status} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{b.country}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 truncate max-w-[180px]">
                                        {project ? project.name[language] : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        {lastAid
                                            ? new Date(lastAid).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                            : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BeneficiaryTable;
