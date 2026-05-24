
import React, { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useLocalization } from '../../../../hooks/useLocalization';
import type { Project } from '../../../../types';
import AiCard from '../../ai/AiCard';
import { formatCurrency, formatDate } from '../../../../lib/utils';
import { useTheme } from '../../../../hooks/useTheme';
import { PlusCircle, X, Check } from 'lucide-react';
import { useProjectExpenses } from '../../../../hooks/useProjects';
import { useToast } from '../../../../hooks/useToast';

interface CostManagementTabProps {
    project: Project;
    isInitiallyActive?: boolean;
    onUpdate?: (updated: Project) => void;
}

interface ExpenseForm {
    date: string;
    description: string;
    category: string;
    amount: string;
}

const EXPENSE_CATEGORIES = ['equipment', 'salaries', 'travel', 'other'];

const emptyExpenseForm = (): ExpenseForm => ({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'other',
    amount: '',
});

const KpiCard: React.FC<{ title: string; value: string; colorClass: string }> = ({ title, value, colorClass }) => (
    <div className="bg-card dark:bg-dark-card/50 p-4 rounded-xl shadow-soft">
        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h4>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
);

const CostManagementTab: React.FC<CostManagementTabProps> = ({ project, isInitiallyActive }) => {
    const { t, language } = useLocalization(['projects']);
    const { theme } = useTheme();
    const toast = useToast();
    const { data: expenses = project.costManagement.expenseLog, createExpense } = useProjectExpenses(project.id);
    const isDark = theme === 'dark';
    const kpiCardRef = useRef<HTMLDivElement>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<ExpenseForm>(emptyExpenseForm());

    useEffect(() => {
        if (isInitiallyActive && kpiCardRef.current) {
            kpiCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            kpiCardRef.current.classList.add('animate-pulse-fast', 'ring-4', 'ring-red-500', 'transition-all', 'duration-500');
            setTimeout(() => {
                kpiCardRef.current?.classList.remove('animate-pulse-fast', 'ring-4', 'ring-red-500');
            }, 4000);
        }
    }, [isInitiallyActive]);

    const handleSave = async () => {
        const amount = parseFloat(form.amount);
        if (!form.description.trim() || isNaN(amount) || amount <= 0) return;
        try {
            await createExpense({
                date: form.date,
                description: form.description.trim(),
                category: form.category,
                amount,
            });
            setModalOpen(false);
            setForm(emptyExpenseForm());
        } catch {
            toast.showError(t('common.error', 'Something went wrong. Please try again.'));
        }
    };

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remainingBudget = project.budget - totalSpent;
    const budgetData = project.costManagement.budgetDetails.map(item => ({
        name: t(`projects.cost.categories.${item.category}`, item.category),
        Planned: item.planned,
        Actual: item.actual,
    }));

    const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-dark-foreground focus:ring-1 focus:ring-primary";
    const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    return (
        <div className="space-y-6">
            <AiCard title={t('projects.cost.dashboard')} ref={kpiCardRef}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title={t('projects.cost.totalBudget')} value={formatCurrency(project.budget, language)} colorClass="text-foreground dark:text-dark-foreground" />
                    <KpiCard title={t('projects.cost.totalSpent')} value={formatCurrency(totalSpent, language)} colorClass="text-orange-500" />
                    <KpiCard title={t('projects.cost.remaining')} value={formatCurrency(remainingBudget, language)} colorClass={remainingBudget > 0 ? "text-green-500" : "text-red-500"} />
                    <KpiCard title={t('projects.cost.earnedValue')} value={formatCurrency(project.costManagement.financialSummary.ev, language)} colorClass="text-purple-500" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div>
                        <h4 className="font-semibold mb-2">{t('projects.cost.plannedVsActual')}</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={budgetData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#444" : "#ddd"} />
                                    <XAxis dataKey="name" tick={{ fill: isDark ? "#fff" : "#333", fontSize: 12 }} />
                                    <YAxis tickFormatter={(val) => formatCurrency(Number(val), language).replace('$', '$/k')} tick={{ fill: isDark ? "#fff" : "#333" }} />
                                    <Tooltip formatter={(value: unknown) => {
                                        const n = Number(value);
                                        return isNaN(n) ? String(value) : formatCurrency(n, language);
                                    }} />
                                    <Legend />
                                    <Bar dataKey="Planned" fill="#8884d8" />
                                    <Bar dataKey="Actual" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">{t('projects.cost.burnRate')}</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={project.costManagement.financialSummary.burnRate}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#444" : "#ddd"} />
                                    <XAxis dataKey="month" tick={{ fill: isDark ? "#fff" : "#333", fontSize: 12 }} />
                                    <YAxis tickFormatter={(val) => formatCurrency(Number(val), language)} tick={{ fill: isDark ? "#fff" : "#333" }} />
                                    <Tooltip formatter={(value: unknown) => {
                                        const n = Number(value);
                                        return isNaN(n) ? String(value) : formatCurrency(n, language);
                                    }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="value" name="Spent" stroke="#ef4444" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </AiCard>

            <AiCard title={t('projects.cost.detailedBudget')}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="p-2">{t('projects.cost.category')}</th>
                                <th className="p-2 text-right">{t('projects.cost.planned')}</th>
                                <th className="p-2 text-right">{t('projects.cost.actual')}</th>
                                <th className="p-2 text-right">{t('projects.cost.variance')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {project.costManagement.budgetDetails.map(item => {
                                const variance = item.planned - item.actual;
                                return (
                                    <tr key={item.category} className="border-t dark:border-slate-700">
                                        <td className="p-2 font-semibold">{t(`projects.cost.categories.${item.category}`, item.category)}</td>
                                        <td className="p-2 text-right">{formatCurrency(item.planned, language)}</td>
                                        <td className="p-2 text-right">{formatCurrency(item.actual, language)}</td>
                                        <td className={`p-2 text-right font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(variance, language)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </AiCard>

            <AiCard title={t('projects.cost.expenseLog')}>
                <div className="flex justify-end mb-4">
                    <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors">
                        <PlusCircle size={15} /> {t('projects.cost.logExpense')}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="p-2">{t('projects.cost.date')}</th>
                                <th className="p-2">{t('projects.cost.description')}</th>
                                <th className="p-2">{t('projects.cost.category')}</th>
                                <th className="p-2">{t('projects.cost.wbs_link')}</th>
                                <th className="p-2 text-right">{t('projects.cost.amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(item => (
                                <tr key={item.id} className="border-t dark:border-slate-700">
                                    <td className="p-2">{formatDate(item.date, language)}</td>
                                    <td className="p-2">{item.description}</td>
                                    <td className="p-2">{t(`projects.cost.categories.${item.category}`, item.category)}</td>
                                    <td className="p-2 text-xs font-mono">{item.wbsId}</td>
                                    <td className="p-2 text-right font-semibold">{formatCurrency(item.amount, language)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </AiCard>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700 p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold">{t('projects.cost.logExpense')}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>{t('projects.cost.date')}</label>
                                    <input type="date" className={inputClass} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                                </div>
                                <div>
                                    <label className={labelClass}>{t('projects.cost.category')}</label>
                                    <select className={inputClass} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{t(`projects.cost.categories.${c}`)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.cost.description')}</label>
                                <input className={inputClass} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.cost.amount')}</label>
                                <input type="number" min={0} className={inputClass} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">{t('common.cancel')}</button>
                            <button onClick={handleSave} disabled={!form.description.trim() || !form.amount} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50">
                                <Check size={14} /> {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CostManagementTab;
