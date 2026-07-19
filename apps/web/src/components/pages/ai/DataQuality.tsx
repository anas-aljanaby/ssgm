import React, { useState, useReducer, useMemo, useEffect } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { initialDataQualityData, initialIssues, findDuplicates, findFormattingErrors } from '../../../data/dataQualityData';
import type { DataQualityRecord, AuditLogEntry } from '../../../data/dataQualityData';
import CircularProgressGauge from '../leadership/CircularProgressGauge';
import Tabs from '../../common/Tabs';
import AiCard from './AiCard';
import MergeModal from './MergeModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import Spinner from '../../common/Spinner';
import { DuplicatesIcon } from '../../icons/AiIcons';
import { formatNumber, formatCurrency } from '../../../lib/utils';

type State = {
    records: DataQualityRecord[];
    issues: {
        duplicates: { pair: [DataQualityRecord, DataQualityRecord], score: number }[];
        formatting: { record: DataQualityRecord, field: string, issue: string }[];
    };
    auditLog: AuditLogEntry[];
};

type Action =
    | { type: 'SET_ISSUES'; payload: State['issues'] }
    | { type: 'RESOLVE_DUPLICATE'; payload: { originalId: number; duplicateId: number; mergedRecord: DataQualityRecord } }
    | { type: 'IGNORE_DUPLICATE'; payload: { record1Id: number; record2Id: number } };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_ISSUES':
            return { ...state, issues: action.payload };
        case 'RESOLVE_DUPLICATE': {
            const { originalId, duplicateId, mergedRecord } = action.payload;
            const newRecords = state.records
                .filter(r => r.id !== duplicateId)
                .map(r => r.id === originalId ? mergedRecord : r);
            const newDuplicates = state.issues.duplicates.filter(d => !((d.pair[0].id === originalId && d.pair[1].id === duplicateId) || (d.pair[0].id === duplicateId && d.pair[1].id === originalId)));
            const newLogEntry: AuditLogEntry = {
                id: state.auditLog.length + 1,
                action: 'Merged Duplicates',
                user: 'System User',
                timestamp: new Date().toISOString(),
                details: `Merged record #${duplicateId} into #${originalId}. New name: ${mergedRecord.name}.`
            };
            return {
                ...state,
                records: newRecords,
                issues: { ...state.issues, duplicates: newDuplicates },
                auditLog: [newLogEntry, ...state.auditLog],
            };
        }
        case 'IGNORE_DUPLICATE': {
             const { record1Id, record2Id } = action.payload;
             const newDuplicates = state.issues.duplicates.filter(
                d => !( (d.pair[0].id === record1Id && d.pair[1].id === record2Id) || (d.pair[0].id === record2Id && d.pair[1].id === record1Id) )
             );
              const newLogEntry: AuditLogEntry = {
                id: state.auditLog.length + 1,
                action: 'Ignored Duplicate',
                user: 'System User',
                timestamp: new Date().toISOString(),
                details: `Marked records #${record1Id} and #${record2Id} as not duplicates.`
            };
            return {
                ...state,
                issues: { ...state.issues, duplicates: newDuplicates },
                auditLog: [newLogEntry, ...state.auditLog],
            };
        }
        default:
            return state;
    }
};

const DataQuality = () => {
    const { t, language } = useLocalization(['ai_automation', 'common']);
    const toast = useToast();
    const [state, dispatch] = useReducer(reducer, {
        records: initialDataQualityData,
        issues: initialIssues,
        auditLog: [],
    });

    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'complete'>('complete');
    const [scanProgress, setScanProgress] = useState(100);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [mergingPair, setMergingPair] = useState<{ pair: [DataQualityRecord, DataQualityRecord], score: number } | null>(null);
    const [confirmingIgnore, setConfirmingIgnore] = useState<{ pair: [DataQualityRecord, DataQualityRecord] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);


    const dataHealthScore = useMemo(() => {
        const totalRecords = state.records.length;
        if (totalRecords === 0) return 100;
        const duplicateCount = state.issues.duplicates.length;
        const formattingCount = state.issues.formatting.length;
        const errorRatio = (duplicateCount * 2 + formattingCount) / totalRecords;
        return Math.max(0, 100 - errorRatio * 100);
    }, [state.records, state.issues]);

    const handleStartScan = () => {
        setScanStatus('scanning');
        setIsLoading(true);
        setScanProgress(0);
        const interval = setInterval(() => {
            setScanProgress(prev => {
                const next = prev + Math.floor(Math.random() * 10) + 5;
                if (next >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setScanStatus('complete');
                        setIsLoading(false);
                        const duplicates = findDuplicates(state.records);
                        const formatting = findFormattingErrors(state.records);
                        dispatch({ type: 'SET_ISSUES', payload: { duplicates, formatting } });
                    }, 500);
                    return 100;
                }
                return next;
            });
        }, 200);
    };

    const handleConfirmMerge = (originalId: number, duplicateId: number, mergedRecord: DataQualityRecord) => {
        dispatch({ type: 'RESOLVE_DUPLICATE', payload: { originalId, duplicateId, mergedRecord } });
        setMergingPair(null);
        toast.showSuccess(t('toasts.mergeSuccess'), { title: t('toasts.successTitle') });
    };
    
    const handleConfirmIgnore = () => {
        if (!confirmingIgnore) return;
        dispatch({type: 'IGNORE_DUPLICATE', payload: {record1Id: confirmingIgnore.pair[0].id, record2Id: confirmingIgnore.pair[1].id}});
        setConfirmingIgnore(null);
        toast.showInfo(t('toasts.ignoreSuccess'), { title: t('toasts.infoTitle') });
    }

    const DashboardView = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AiCard title={t('ai_automation.data_quality.dataHealth')} className="lg:col-span-1 flex flex-col items-center justify-center">
                    <CircularProgressGauge value={dataHealthScore} size={180} title="" />
                </AiCard>
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <SummaryCard title={t('ai_automation.data_quality.potentialDuplicates')} count={state.issues.duplicates.length} onClick={() => setActiveTab('duplicates')} />
                    <SummaryCard title={t('ai_automation.data_quality.formattingIssues')} count={state.issues.formatting.length} onClick={() => setActiveTab('formatting')} />
                    <SummaryCard title={t('ai_automation.data_quality.recordsScanned')} count={state.records.length} />
                    <SummaryCard title={t('ai_automation.data_quality.issuesFound')} count={state.issues.duplicates.length + state.issues.formatting.length} />
                </div>
            </div>
            <AiCard title={t('ai_automation.data_quality.startScan')}>
                {scanStatus === 'scanning' ? (
                    <div className="flex flex-col items-center gap-4">
                        <Spinner size="w-10 h-10" text={t('common.analyzing')} />
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-slate-700">
                            <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        {scanStatus === 'complete' && <p className="mb-4 text-green-600 font-semibold">{t('ai_automation.data_quality.scanCompleted', {count: String(state.issues.duplicates.length + state.issues.formatting.length)})}</p>}
                        <button onClick={handleStartScan} className="px-6 py-3 bg-secondary text-white font-semibold rounded-lg shadow-md hover:bg-secondary-dark transition-colors disabled:bg-gray-400">
                            {t('ai_automation.data_quality.startScan')}
                        </button>
                    </div>
                )}
            </AiCard>
        </div>
    );
    
    const DuplicatesView = () => (
        <AiCard title={`${t('ai_automation.data_quality.duplicates')} (${state.issues.duplicates.length})`}>
            <div className="space-y-6">
                {state.issues.duplicates.map((dup, index) => (
                    <div key={index} className="p-4 border dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-800/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RecordCard record={dup.pair[0]} />
                            <RecordCard record={dup.pair[1]} />
                        </div>
                        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-dark-card p-3 rounded-lg">
                            <div className="font-bold">{t('ai_automation.data_quality.similarity')}: <span className="text-primary dark:text-secondary text-lg">{dup.score}%</span></div>
                            <div className="flex gap-3 mt-2 sm:mt-0">
                                <button onClick={() => setConfirmingIgnore(dup)} className="px-4 py-2 text-sm font-semibold border dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">{t('ai_automation.data_quality.ignore')}</button>
                                <button onClick={() => setMergingPair(dup)} className="px-4 py-2 text-sm font-semibold text-white bg-secondary hover:bg-secondary-dark rounded-lg">{t('ai_automation.data_quality.merge')}</button>
                            </div>
                        </div>
                    </div>
                ))}
                {state.issues.duplicates.length === 0 && <p className="text-center text-gray-500 py-8">No duplicates found.</p>}
            </div>
        </AiCard>
    );

    const AuditLogView = () => (
         <AiCard title={t('ai_automation.data_quality.auditLog')}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-left text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="p-2">{t('ai_automation.data_quality.action')}</th>
                            <th className="p-2">{t('ai_automation.data_quality.user')}</th>
                            <th className="p-2">{t('ai_automation.data_quality.timestamp')}</th>
                            <th className="p-2">{t('ai_automation.data_quality.details')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.auditLog.map(log => (
                            <tr key={log.id} className="border-t dark:border-slate-700">
                                <td className="p-2 font-semibold">{log.action}</td>
                                <td className="p-2">{log.user}</td>
                                <td className="p-2">{new Date(log.timestamp).toLocaleString(language)}</td>
                                <td className="p-2">{log.details}</td>
                            </tr>
                        ))}
                         {state.auditLog.length === 0 && (
                            <tr><td colSpan={4} className="text-center p-8 text-gray-500">No actions logged yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
         </AiCard>
    );
    

    const tabs = [
        { id: 'dashboard', label: t('ai_automation.data_quality.dashboard') },
        { id: 'duplicates', label: `${t('ai_automation.data_quality.duplicates')} (${state.issues.duplicates.length})` },
        { id: 'formatting', label: `${t('ai_automation.data_quality.formatting')} (${state.issues.formatting.length})` },
        { id: 'auditLog', label: t('ai_automation.data_quality.auditLog') },
    ];
    
    return (
        <div className="space-y-6">
            {mergingPair && (
                <MergeModal
                    isOpen={!!mergingPair}
                    onClose={() => setMergingPair(null)}
                    records={mergingPair.pair}
                    onConfirmMerge={handleConfirmMerge}
                />
            )}
            {confirmingIgnore && (
                <ConfirmationModal
                    isOpen={!!confirmingIgnore}
                    onClose={() => setConfirmingIgnore(null)}
                    onConfirm={handleConfirmIgnore}
                    title={t('ai_automation.data_quality.confirmIgnoreTitle')}
                    message={t('ai_automation.data_quality.confirmIgnoreMessage')}
                />
            )}
            <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
            <div className="mt-6">
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'duplicates' && <DuplicatesView />}
                {activeTab === 'auditLog' && <AuditLogView />}
                {activeTab === 'formatting' && <AiCard title={t('ai_automation.data_quality.formatting')}><p className="text-center p-8">{t('placeholder.underConstruction')}</p></AiCard>}
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const SummaryCard: React.FC<{ title: string; count: number; onClick?: () => void }> = ({ title, count, onClick }) => {
    const { language, t } = useLocalization(['ai_automation', 'common']);
    const isClickable = !!onClick;
    return (
        <div className={`bg-card dark:bg-dark-card p-4 rounded-xl shadow-soft transition-all duration-300 ${isClickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:shadow-md' : ''}`} onClick={onClick}>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h4>
            <div className="flex justify-between items-end">
                <p className="text-4xl font-bold text-foreground dark:text-dark-foreground">{formatNumber(count, language)}</p>
                {isClickable && <span className="text-sm font-bold text-primary dark:text-secondary">{t('ai_automation.data_quality.review')} &rarr;</span>}
            </div>
        </div>
    );
}

const RecordCard: React.FC<{record: DataQualityRecord}> = ({record}) => {
    const { language } = useLocalization(['ai_automation', 'common']);
    return (
        <div className="p-4 bg-white dark:bg-dark-card rounded-md shadow">
            <h4 className="font-bold border-b dark:border-slate-600 pb-2 mb-2">Record ID: {record.id}</h4>
            <ul className="space-y-1 text-sm">
                <li><strong>Name:</strong> {record.name}</li>
                <li><strong>Email:</strong> {record.email}</li>
                <li><strong>Country:</strong> {record.country}</li>
                <li><strong>Total Donated:</strong> {formatCurrency(record.totalDonated, language)}</li>
            </ul>
        </div>
    )
}

export default DataQuality;