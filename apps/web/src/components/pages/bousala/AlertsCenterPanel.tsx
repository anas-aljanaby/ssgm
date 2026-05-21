import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatTime } from '../../../lib/utils';
import type { BousalaGoal } from '../../../types';
import { X as XIcon, Filter, Calendar, AlertTriangle, ShieldCheck, Check, PlusCircle } from 'lucide-react';
import { playFeedbackSound } from '../../../lib/audioFeedback';

interface SmartAlert {
    id: string;
    goalId: string;
    goalTitle: string;
    severity: 'critical' | 'warning';
    messages: string[];
    date: string;
}

interface AlertsCenterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    goals: BousalaGoal[];
    onCreateTask: (initialData: any) => void;
    setNotificationCount: (count: number) => void;
}

const AlertsCenterPanel: React.FC<AlertsCenterPanelProps> = ({ isOpen, onClose, goals, onCreateTask, setNotificationCount }) => {
    const { t, dir, language } = useLocalization();
    const [alerts, setAlerts] = useState<SmartAlert[]>([]);
    const [reviewedAlerts, setReviewedAlerts] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('bousalaReviewedAlerts');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    });
    const [filters, setFilters] = useState({
        goal: 'all',
        severity: 'all' as 'all' | 'critical' | 'warning',
        dateSort: 'newest' as 'newest' | 'oldest',
    });

    const generateAlerts = useCallback(() => {
        const newAlerts: SmartAlert[] = [];
        goals.forEach(goal => {
            const alertMessages: string[] = [];
            let severity: 'critical' | 'warning' = 'warning';

            if (goal.prediction && goal.prediction.probability < 60) {
                alertMessages.push(t('bousala.alerts.lowProbability', { probability: goal.prediction.probability }));
                if (goal.prediction.probability < 40) severity = 'critical';
            }
            goal.kpis?.forEach(kpi => {
                if (kpi.target > 0 && kpi.value < kpi.target * 0.5) {
                     alertMessages.push(t('bousala.alerts.kpiBelowHalf', { kpiTitle: kpi.title }));
                    severity = 'critical';
                }
                if (kpi.trend === 'down') {
                    alertMessages.push(t('bousala.alerts.kpiDownward', { kpiTitle: kpi.title }));
                }
            });

            if (alertMessages.length > 0) {
                newAlerts.push({
                    id: goal.id,
                    goalId: goal.id,
                    goalTitle: goal.title,
                    severity,
                    messages: [...new Set(alertMessages)],
                    date: new Date().toISOString(),
                });
            }
        });
        setAlerts(newAlerts);
    }, [goals, t]);

    useEffect(() => {
        generateAlerts(); // Initial generation
        const interval = setInterval(generateAlerts, 2 * 60 * 1000); // Auto-refresh every 2 minutes
        return () => clearInterval(interval);
    }, [generateAlerts]);
    
    useEffect(() => {
        const unreviewedCount = alerts.filter(a => !reviewedAlerts.has(a.id)).length;
        setNotificationCount(unreviewedCount);
    }, [alerts, reviewedAlerts, setNotificationCount]);

    useEffect(() => {
        localStorage.setItem('bousalaReviewedAlerts', JSON.stringify(Array.from(reviewedAlerts)));
    }, [reviewedAlerts]);
    
    const handleMarkAsReviewed = (alertId: string) => {
        setReviewedAlerts(prev => new Set(prev).add(alertId));
    };
    
    const handleCreateTask = (alert: SmartAlert) => {
        onCreateTask({
            title: t('bousala.alertsCenter.actions.correctiveTaskFor', { title: alert.goalTitle }),
            goalId: alert.goalId,
            priority: alert.severity === 'critical' ? 'high' : 'medium',
        });
        onClose();
    };

    const filteredAndSortedAlerts = useMemo(() => {
        let result = [...alerts];
        if (filters.goal !== 'all') {
            result = result.filter(a => a.goalId === filters.goal);
        }
        if (filters.severity !== 'all') {
            result = result.filter(a => a.severity === filters.severity);
        }
        result.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return filters.dateSort === 'newest' ? dateB - dateA : dateA - dateB;
        });
        return result;
    }, [alerts, filters]);

    return (
        <ModalPortal
            isOpen={isOpen}
            onClose={onClose}
            dir={dir === 'rtl' ? 'rtl' : 'ltr'}
            containerClassName="relative flex min-h-full w-full items-stretch p-0"
        >
                    <motion.div
                        initial={{ x: dir === 'rtl' ? '-100%' : '100%' }}
                        animate={{ x: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={`fixed top-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} h-full w-full max-w-md bg-card dark:bg-dark-card shadow-2xl flex flex-col`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="p-4 flex justify-between items-center border-b dark:border-slate-700">
                            <h2 className="text-lg font-bold">{t('bousala.alertsCenter.title')}</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon/></button>
                        </header>
                        
                        <div className="p-4 border-b dark:border-slate-700 grid grid-cols-3 gap-2">
                            <select value={filters.goal} onChange={e => setFilters({...filters, goal: e.target.value})} className="p-2 text-xs border rounded-md bg-gray-50 dark:bg-slate-800"><option value="all">{t('bousala.alertsCenter.filters.allGoals')}</option>{goals.map(g => <option key={g.id} value={g.id} dir="auto">{g.title}</option>)}</select>
                            <select value={filters.severity} onChange={e => setFilters({...filters, severity: e.target.value as any})} className="p-2 text-xs border rounded-md bg-gray-50 dark:bg-slate-800"><option value="all">{t('bousala.alertsCenter.filters.allSeverities')}</option><option value="critical">{t('bousala.alertsCenter.severity.critical')}</option><option value="warning">{t('bousala.alertsCenter.severity.warning')}</option></select>
                            <select value={filters.dateSort} onChange={e => setFilters({...filters, dateSort: e.target.value as any})} className="p-2 text-xs border rounded-md bg-gray-50 dark:bg-slate-800"><option value="newest">{t('bousala.alertsCenter.filters.newest')}</option><option value="oldest">{t('bousala.alertsCenter.filters.oldest')}</option></select>
                        </div>

                        <div className="flex-grow overflow-y-auto p-4 space-y-3">
                            {filteredAndSortedAlerts.map(alert => (
                                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${alert.severity === 'critical' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'} ${reviewedAlerts.has(alert.id) ? 'opacity-60' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-sm" dir="auto">{alert.goalTitle}</h4>
                                            <ul className="list-disc list-inside text-xs mt-1 text-gray-700">
                                                {alert.messages.map((msg, i) => <li key={i} dir="auto">{msg}</li>)}
                                            </ul>
                                        </div>
                                        <span className="text-xs text-gray-500">{formatTime(alert.date, language)}</span>
                                    </div>
                                    <div className="flex justify-end items-center gap-2 mt-3">
                                        {reviewedAlerts.has(alert.id) ? (
                                            <span className="text-xs font-bold text-green-600 flex items-center gap-1"><ShieldCheck size={14}/> {t('bousala.alertsCenter.status.reviewed')}</span>
                                        ) : (
                                            <button onClick={() => handleMarkAsReviewed(alert.id)} className="text-xs font-semibold flex items-center gap-1"><Check size={14}/> {t('bousala.alertsCenter.actions.markReviewed')}</button>
                                        )}
                                        <button onClick={() => handleCreateTask(alert)} className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-secondary rounded-md"><PlusCircle size={14}/> {t('bousala.alertsCenter.actions.createTask')}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
        </ModalPortal>
    );
};

export default AlertsCenterPanel;
