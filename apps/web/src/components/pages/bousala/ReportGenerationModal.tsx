import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X as XIcon, FileText, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import Spinner from '../../common/Spinner';
import { useTheme } from '../../../hooks/useTheme';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';

interface ReportGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    bousalaData: any;
    aiInsights: any;
}

const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({ isOpen, onClose, bousalaData, aiInsights }) => {
    const { t } = useLocalization();
    const { theme } = useTheme();
    const toast = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const reportContentRef = useRef<HTMLDivElement>(null);
    const isDark = theme === 'dark';
    const textColor = isDark ? '#A0AEC0' : '#4A5568';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const COLORS = ['hsl(210, 40%, 50%)', 'hsl(145, 63%, 49%)', '#FFBB28', '#FF8042'];

    const chartData = useMemo(() => {
        const countsData = [
            { name: t('bousala.goals'), count: bousalaData.goals.length },
            { name: t('bousala.projects'), count: bousalaData.projects.length },
            { name: t('bousala.tasks'), count: bousalaData.tasks.length },
        ];

        const completedTasks = bousalaData.tasks.filter((t: any) => t.status === 'completed').length;
        const inProgressTasks = bousalaData.tasks.filter((t: any) => t.status === 'in-progress').length;
        const taskStatusData = [
            { name: t('bousala.task_status.completed'), value: completedTasks },
            { name: t('bousala.task_status.in-progress'), value: inProgressTasks },
        ];

        const goalProgressData = bousalaData.goals.map((g: any) => ({
            name: g.title.substring(0, 20) + '...',
            progress: g.progress
        }));

        return { countsData, taskStatusData, goalProgressData };
    }, [bousalaData, t]);


    const handleExportPDF = async () => {
        if (!reportContentRef.current) return;
        setIsExporting(true);
        toast.showInfo(t('bousala.reports.exporting'));
        try {
            const canvas = await html2canvas(reportContentRef.current, { scale: 2, backgroundColor: isDark ? '#1a202c' : '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(t('bousala.reports.dashboardReportFileName'));
            toast.showSuccess(t('bousala.reports.exportSuccess'));
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.showError(t('bousala.reports.exportError'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportXLSX = () => {
        setIsExporting(true);
        try {
            const wb = XLSX.utils.book_new();

            const goalsData = bousalaData.goals.map((g: any) => ({
                [t('bousala.reports.goal')]: g.title,
                [t('bousala.reports.description')]: g.description,
                [t('bousala.reports.progress')]: g.progress,
            }));
            const wsGoals = XLSX.utils.json_to_sheet(goalsData);
            XLSX.utils.book_append_sheet(wb, wsGoals, t('bousala.reports.sheetGoals'));

            const projectsData = bousalaData.projects.map((p: any) => ({
                [t('bousala.reports.project')]: p.title,
                [t('bousala.reports.progress')]: p.progress,
                [t('bousala.reports.linkedGoal')]: p.linkedGoal,
            }));
            const wsProjects = XLSX.utils.json_to_sheet(projectsData);
            XLSX.utils.book_append_sheet(wb, wsProjects, t('bousala.reports.sheetProjects'));

            const tasksData = bousalaData.tasks.map((task: any) => ({
                [t('bousala.reports.task')]: task.title,
                [t('bousala.reports.status')]: task.status,
                [t('bousala.reports.assignee')]: task.assignee,
                [t('bousala.reports.linkedProject')]: task.linkedProject,
            }));
            const wsTasks = XLSX.utils.json_to_sheet(tasksData);
            XLSX.utils.book_append_sheet(wb, wsTasks, t('bousala.reports.sheetTasks'));

            XLSX.writeFile(wb, t('bousala.reports.fullReportFileName'));
            toast.showSuccess(t('bousala.reports.exportSuccess'));
        } catch (error) {
            console.error("XLSX Export Error:", error);
            toast.showError(t('bousala.reports.exportError'));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">{t('bousala.analytics.title')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon /></button>
                </div>
                
                <div ref={reportContentRef} className="p-6 overflow-y-auto bg-white dark:bg-dark-card">
                    <div className="space-y-8">
                        <h4 className="font-bold text-lg text-center">{t('bousala.visualAnalytics')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h5 className="font-semibold text-center mb-2">{t('bousala.reports.itemsDistribution')}</h5>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={chartData.countsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                        <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 12 }} />
                                        <YAxis tick={{ fill: textColor }} />
                                        <RechartsTooltip />
                                        <Bar dataKey="count" name={t('bousala.reports.count')}>
                                             {chartData.countsData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <h5 className="font-semibold text-center mb-2">{t('bousala.reports.taskStatus')}</h5>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={chartData.taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                             {chartData.taskStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#22C55E', '#F59E0B'][index % 2]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div>
                            <h5 className="font-semibold text-center mb-2">{t('bousala.reports.goalProgress')}</h5>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={chartData.goalProgressData} layout="vertical" margin={{ right: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                    <XAxis type="number" domain={[0, 100]} tick={{ fill: textColor }} />
                                    <YAxis type="category" dataKey="name" width={150} tick={{ fill: textColor, fontSize: 10 }} />
                                    <RechartsTooltip formatter={(value) => `${value}%`} />
                                    <Bar dataKey="progress" name={t('bousala.reports.progress')} fill="hsl(210, 40%, 50%)" background={{ fill: isDark ? '#334155' : '#e5e7eb' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={handleExportXLSX} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:bg-gray-400">
                        {isExporting ? <Spinner size="w-4 h-4" /> : <FileText size={16} />}
                        {t('bousala.reports.exportXLSX')}
                    </button>
                    <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:bg-gray-400">
                        {isExporting ? <Spinner size="w-4 h-4" /> : <Download size={16} />}
                        {t('bousala.reports.exportPDF')}
                    </button>
                </div>
            </div>
        </ModalPortal>
    );
};

export default ReportGenerationModal;