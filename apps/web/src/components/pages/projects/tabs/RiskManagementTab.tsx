import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocalization } from '../../../../hooks/useLocalization';
import type { Project, Risk, RiskLevel } from '../../../../types';
import AiCard from '../../ai/AiCard';
import { PlusCircle, Pencil, Trash2, X, Check } from 'lucide-react';
import { isOptimisticProjectRisk, useProjectRisks } from '../../../../hooks/useProjects';
import { useToast } from '../../../../hooks/useToast';
import { OPTIMISTIC_HIGHLIGHT_MS } from '../../../../lib/optimisticSubmit';
import AddProjectRiskModal, { type AddProjectRiskPayload } from '../AddProjectRiskModal';

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
    const { t } = useLocalization(['common', 'projects']);
    const toast = useToast();
    const { data: risks = project.riskManagement.riskRegister, createRisk, updateRisk, deleteRisk } = useProjectRisks(project.id);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
    const [form, setForm] = useState<Omit<Risk, 'id'>>(emptyRiskForm());
    const [highlightedRiskId, setHighlightedRiskId] = useState<string | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        };
    }, []);

    const flashHighlight = useCallback((id: string) => {
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        setHighlightedRiskId(id);
        highlightTimerRef.current = setTimeout(() => setHighlightedRiskId(null), OPTIMISTIC_HIGHLIGHT_MS);
    }, []);

    const openEditModal = (risk: Risk) => {
        setEditingRisk(risk);
        const { id: _id, ...rest } = risk;
        setForm(rest);
        setEditModalOpen(true);
    };

    const closeEditModal = () => setEditModalOpen(false);

    const handleAddRisk = (payload: AddProjectRiskPayload) => {
        createRisk(payload, {
            onSuccess: (created) => {
                flashHighlight(created.id);
                toast.showSuccess(t('projects.risks.createSuccess'));
            },
            onError: () => {
                toast.showError(t('projects.risks.createFailed'));
            },
        });
    };

    const handleSaveEdit = async () => {
        if (!editingRisk || !form.description.trim()) return;
        try {
            await updateRisk({ ...form, id: editingRisk.id, description: form.description.trim() });
            closeEditModal();
        } catch {
            toast.showError(t('common.error', 'Something went wrong. Please try again.'));
        }
    };

    const handleDelete = (id: string) => {
        if (isOptimisticProjectRisk(id)) return;
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
    const inputClass = selectClass;
    const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    return (
        <div className="space-y-6">
            <AiCard title={t('projects.risks.dashboard')}>
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-6 xl:gap-8 items-start">
                    <section className="max-w-[420px] mx-auto xl:mx-0 w-full">
                        <h4 className="font-bold text-center mb-3">{t('projects.risks.matrix')}</h4>
                        <div className="bg-gray-50/70 dark:bg-slate-900/40 border border-gray-200/70 dark:border-slate-700/70 rounded-xl p-3">
                            <div className="flex items-stretch gap-2">
                                <div className="flex flex-col-reverse justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 py-1">
                                    {(['low', 'medium', 'high'] as RiskLevel[]).map(level => (
                                        <div key={level} className="h-[84px] flex items-center">
                                            <span className="inline-block -rotate-90 whitespace-nowrap">{t(`projects.risks.levels.${level}`)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="grid grid-cols-3 grid-rows-3 gap-1 h-[252px] border border-gray-200 dark:border-slate-700 rounded-lg p-1 bg-card dark:bg-dark-card">
                                        {riskMatrix.slice().reverse().map((row, i) =>
                                            row.map((cell, j) => (
                                                <div key={`${2 - i}-${j}`} className={`flex items-center justify-center rounded-md ${matrixColors[2 - i][j]}`}>
                                                    {cell.length > 0 && <span className="font-bold text-base">{cell.length}</span>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 text-center text-xs font-semibold mt-2 text-gray-600 dark:text-gray-300">
                                        {(['low', 'medium', 'high'] as RiskLevel[]).map(level => <span key={level}>{t(`projects.risks.levels.${level}`)}</span>)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 ps-2 pe-1">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('projects.risks.impact')}</span>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('projects.risks.probability')}</span>
                            </div>
                        </div>
                    </section>
                    <section>
                        <h4 className="font-bold text-center xl:text-start mb-3">{t('projects.risks.topRisks')}</h4>
                        <ul className="space-y-2">
                            {topRisks.map(risk => (
                                <li key={risk.id} className="p-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg text-sm">
                                    <p className="font-semibold truncate">{risk.description}</p>
                                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                                        <span>{t('projects.risks.score')}: <span className="font-bold text-foreground dark:text-dark-foreground">{getRiskScore(risk)}</span></span>
                                        <LevelBadge level={risk.impact} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </AiCard>

            <AiCard title={t('projects.risks.register')}>
                <div className="flex justify-end mb-4">
                    <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors">
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
                            {risks.map(risk => {
                                const optimistic = isOptimisticProjectRisk(risk.id);
                                const highlighted = highlightedRiskId === risk.id;
                                return (
                                    <tr
                                        key={risk.id}
                                        className={`border-t dark:border-slate-700 group transition-colors ${
                                            optimistic ? 'opacity-70 animate-pulse bg-blue-50/60 dark:bg-blue-950/30' : ''
                                        } ${highlighted ? 'ring-2 ring-inset ring-emerald-300 dark:ring-emerald-700' : ''}`}
                                    >
                                        <td className="p-2 max-w-xs">
                                            <span className="block">{risk.description}</span>
                                            {optimistic && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{t('projects.risks.saving')}</span>
                                            )}
                                        </td>
                                        <td className="p-2">{t(`projects.risks.categories.${risk.category}`)}</td>
                                        <td className="p-2"><LevelBadge level={risk.impact} /></td>
                                        <td className="p-2"><LevelBadge level={risk.probability} /></td>
                                        <td className="p-2">{t(`projects.risks.responses.${risk.responseStrategy}`)}</td>
                                        <td className="p-2">{risk.owner}</td>
                                        <td className="p-2">{t(`projects.risks.statuses.${risk.status}`)}</td>
                                        <td className="p-2">
                                            <div
                                                className={`flex items-center gap-1 transition-opacity ${
                                                    optimistic ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
                                                }`}
                                            >
                                                <button onClick={() => openEditModal(risk)} className="p-1 text-gray-400 hover:text-primary rounded" title={t('projects.risks.editRisk')}>
                                                    <Pencil size={13} />
                                                </button>
                                                <button onClick={() => handleDelete(risk.id)} className="p-1 text-gray-400 hover:text-red-500 rounded" title={t('projects.risks.deleteRisk')}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </AiCard>

            <AddProjectRiskModal
                isOpen={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onSubmit={handleAddRisk}
            />

            {editModalOpen && editingRisk && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold">{t('projects.risks.editRisk')}</h3>
                            <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
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
                            <button onClick={closeEditModal} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">{t('common.cancel')}</button>
                            <button onClick={handleSaveEdit} disabled={!form.description.trim()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50">
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
