import React, { useState } from 'react';
import { useLocalization } from '../../../../hooks/useLocalization';
import type { Project, Risk, RiskLevel } from '../../../../types';
import AiCard from '../../ai/AiCard';
import { PlusCircle, Pencil, Trash2, X, Check } from 'lucide-react';
import { useProjectRisks } from '../../../../hooks/useProjects';
import { useToast } from '../../../../hooks/useToast';

interface RiskManagementTabProps {
    project: Project;
    onUpdate?: (updated: Project) => void;
}

const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high'];
const RISK_CATEGORIES: Risk['category'][] = ['financial', 'security', 'operational', 'political', 'reputational'];
const RISK_RESPONSES: Risk['responseStrategy'][] = ['avoid', 'mitigate', 'transfer', 'accept'];
const RISK_STATUSES: Risk['status'][] = ['open', 'in-progress', 'closed'];

const emptyRiskForm = (): Omit<Risk, 'id'> => ({
    description: '',
    category: 'operational',
    probability: 'medium',
    impact: 'medium',
    responseStrategy: 'mitigate',
    contingencyPlan: '',
    owner: '',
    status: 'open',
});

const levelMap: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };
const scoreMap: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };

const RiskManagementTab: React.FC<RiskManagementTabProps> = ({ project }) => {
    const { t } = useLocalization(['projects']);
    const toast = useToast();
    const { data: risks = project.riskManagement.riskRegister, createRisk, updateRisk, deleteRisk } = useProjectRisks(project.id);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
    const [form, setForm] = useState<Omit<Risk, 'id'>>(emptyRiskForm());

    const openAddModal = () => {
        setEditingRisk(null);
        setForm(emptyRiskForm());
        setModalOpen(true);
    };

    const openEditModal = (risk: Risk) => {
        setEditingRisk(risk);
        const { id: _id, ...rest } = risk;
        setForm(rest);
        setModalOpen(true);
    };

    const closeModal = () => setModalOpen(false);

    const handleSave = async () => {
        if (!form.description.trim()) return;
        try {
            if (editingRisk) {
                await updateRisk({ ...form, id: editingRisk.id });
            } else {
                await createRisk(form);
            }
            closeModal();
        } catch {
            toast.showError(t('common.error', 'Something went wrong. Please try again.'));
        }
    };

    const handleDelete = (id: string) => {
        void deleteRisk(id).catch(() => {
            toast.showError(t('common.error', 'Something went wrong. Please try again.'));
        });
    };

    const riskMatrix: Risk[][][] = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => []));
    risks.forEach(risk => {
        riskMatrix[levelMap[risk.impact]][levelMap[risk.probability]].push(risk);
    });

    const getRiskScore = (risk: Risk) => scoreMap[risk.probability] * scoreMap[risk.impact];
    const topRisks = [...risks].sort((a, b) => getRiskScore(b) - getRiskScore(a)).slice(0, 5);

    const matrixColors = [
        ['bg-green-100 dark:bg-green-900/40', 'bg-yellow-100 dark:bg-yellow-900/40', 'bg-orange-100 dark:bg-orange-900/40'],
        ['bg-yellow-100 dark:bg-yellow-900/40', 'bg-orange-100 dark:bg-orange-900/40', 'bg-red-100 dark:bg-red-900/40'],
        ['bg-orange-100 dark:bg-orange-900/40', 'bg-red-100 dark:bg-red-900/40', 'bg-red-200 dark:bg-red-900/60'],
    ];

    const LevelBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
        const styles = { low: 'bg-green-100 text-green-800', medium: 'bg-yellow-100 text-yellow-800', high: 'bg-red-100 text-red-800' };
        return <span className={`px-2 py-0.5 text-xs font-semibold rounded ${styles[level]}`}>{t(`projects.risks.levels.${level}`)}</span>;
    };

    const selectClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-dark-foreground focus:ring-1 focus:ring-primary";
    const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-dark-foreground focus:ring-1 focus:ring-primary";
    const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    return (
        <div className="space-y-6">
            <AiCard title={t('projects.risks.dashboard')}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-center mb-2">{t('projects.risks.matrix')}</h4>
                        <div className="flex">
                            <div className="flex flex-col-reverse justify-around text-xs font-bold -mr-2">
                                {(['low', 'medium', 'high'] as RiskLevel[]).map(level => <div key={level} className="transform -rotate-90">{t(`projects.risks.levels.${level}`)}</div>)}
                                <div className="transform -rotate-90 font-bold text-sm">{t('projects.risks.impact')}</div>
                            </div>
                            <div className="flex-grow">
                                <div className="grid grid-cols-3 grid-rows-3 gap-1 aspect-square border-2 dark:border-slate-600 p-1 rounded-md">
                                    {riskMatrix.slice().reverse().map((row, i) =>
                                        row.map((cell, j) => (
                                            <div key={`${2 - i}-${j}`} className={`flex items-center justify-center p-1 rounded-sm ${matrixColors[2 - i][j]}`}>
                                                {cell.length > 0 && <span className="font-bold text-lg">{cell.length}</span>}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="grid grid-cols-3 text-center text-xs font-bold mt-1">
                                    {(['low', 'medium', 'high'] as RiskLevel[]).map(level => <span key={level}>{t(`projects.risks.levels.${level}`)}</span>)}
                                </div>
                                <div className="text-center font-bold text-sm mt-1">{t('projects.risks.probability')}</div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-center mb-2">{t('projects.risks.topRisks')}</h4>
                        <ul className="space-y-2">
                            {topRisks.map(risk => (
                                <li key={risk.id} className="p-2 bg-gray-50 dark:bg-slate-800/50 rounded-md text-sm">
                                    <p className="font-semibold truncate">{risk.description}</p>
                                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                        <span>{t('projects.risks.score')}: <span className="font-bold text-foreground dark:text-dark-foreground">{getRiskScore(risk)}</span></span>
                                        <LevelBadge level={risk.impact} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </AiCard>

            <AiCard title={t('projects.risks.register')}>
                <div className="flex justify-end mb-4">
                    <button onClick={openAddModal} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors">
                        <PlusCircle size={15} /> {t('projects.risks.addRisk')}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-start text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="p-2 text-start">{t('projects.risks.description')}</th>
                                <th className="p-2 text-start">{t('projects.risks.category')}</th>
                                <th className="p-2 text-start">{t('projects.risks.impact')}</th>
                                <th className="p-2 text-start">{t('projects.risks.probability')}</th>
                                <th className="p-2 text-start">{t('projects.risks.response')}</th>
                                <th className="p-2 text-start">{t('projects.risks.owner')}</th>
                                <th className="p-2 text-start">{t('projects.risks.status')}</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {risks.map(risk => (
                                <tr key={risk.id} className="border-t dark:border-slate-700 group">
                                    <td className="p-2 max-w-xs">{risk.description}</td>
                                    <td className="p-2">{t(`projects.risks.categories.${risk.category}`)}</td>
                                    <td className="p-2"><LevelBadge level={risk.impact} /></td>
                                    <td className="p-2"><LevelBadge level={risk.probability} /></td>
                                    <td className="p-2">{t(`projects.risks.responses.${risk.responseStrategy}`)}</td>
                                    <td className="p-2">{risk.owner}</td>
                                    <td className="p-2">{t(`projects.risks.statuses.${risk.status}`)}</td>
                                    <td className="p-2">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(risk)} className="p-1 text-gray-400 hover:text-primary rounded" title={t('projects.risks.editRisk')}>
                                                <Pencil size={13} />
                                            </button>
                                            <button onClick={() => handleDelete(risk.id)} className="p-1 text-gray-400 hover:text-red-500 rounded" title={t('projects.risks.deleteRisk')}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </AiCard>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold">{editingRisk ? t('projects.risks.editRisk') : t('projects.risks.addRisk')}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className={labelClass}>{t('projects.risks.description')}</label>
                                <textarea rows={2} className={inputClass} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>{t('projects.risks.category')}</label>
                                    <select className={selectClass} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Risk['category'] }))}>
                                        {RISK_CATEGORIES.map(c => <option key={c} value={c}>{t(`projects.risks.categories.${c}`)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>{t('projects.risks.probability')}</label>
                                    <select className={selectClass} value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value as RiskLevel }))}>
                                        {RISK_LEVELS.map(l => <option key={l} value={l}>{t(`projects.risks.levels.${l}`)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>{t('projects.risks.impact')}</label>
                                    <select className={selectClass} value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value as RiskLevel }))}>
                                        {RISK_LEVELS.map(l => <option key={l} value={l}>{t(`projects.risks.levels.${l}`)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>{t('projects.risks.response')}</label>
                                    <select className={selectClass} value={form.responseStrategy} onChange={e => setForm(f => ({ ...f, responseStrategy: e.target.value as Risk['responseStrategy'] }))}>
                                        {RISK_RESPONSES.map(r => <option key={r} value={r}>{t(`projects.risks.responses.${r}`)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>{t('projects.risks.owner')}</label>
                                    <input className={inputClass} value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
                                </div>
                                <div>
                                    <label className={labelClass}>{t('projects.risks.status')}</label>
                                    <select className={selectClass} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Risk['status'] }))}>
                                        {RISK_STATUSES.map(s => <option key={s} value={s}>{t(`projects.risks.statuses.${s}`)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.risks.contingencyPlan')}</label>
                                <textarea rows={2} className={inputClass} value={form.contingencyPlan} onChange={e => setForm(f => ({ ...f, contingencyPlan: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">{t('common.cancel')}</button>
                            <button onClick={handleSave} disabled={!form.description.trim()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50">
                                <Check size={14} /> {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskManagementTab;
