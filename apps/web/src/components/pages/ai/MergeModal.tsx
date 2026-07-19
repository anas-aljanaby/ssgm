import React, { useState, useMemo } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { DataQualityRecord } from '../../../data/dataQualityData';
import { XIcon, SparklesIcon } from '../../icons/GenericIcons';

interface MergeModalProps {
    isOpen: boolean;
    onClose: () => void;
    records: [DataQualityRecord, DataQualityRecord];
    onConfirmMerge: (originalId: number, duplicateId: number, mergedRecord: DataQualityRecord) => void;
}

// Simple AI suggestion logic
const getSuggestion = (key: keyof DataQualityRecord, valA: any, valB: any): 'A' | 'B' => {
    if (valA === valB) return 'A';

    switch (key) {
        case 'totalDonated':
        case 'donationCount':
            // Sum financial data
            return 'A'; // The reducer will handle the sum
        case 'lastDonation':
        case 'lastContact':
        case 'id':
            // Prefer the more recent date or smaller ID (older record)
            return new Date(valA) > new Date(valB) ? 'A' : 'B';
        case 'email':
            // Prefer non-empty and longer/more complex email
            if (!valB) return 'A';
            if (!valA) return 'B';
            return valA.length > valB.length ? 'A' : 'B';
        case 'name':
             // Prefer longer name
             return valA.length > valB.length ? 'A' : 'B';
        default:
            // Default to record A if non-empty, otherwise B
            return valA ? 'A' : 'B';
    }
};


const MergeModal: React.FC<MergeModalProps> = ({ isOpen, onClose, records, onConfirmMerge }) => {
    const { t } = useLocalization(['ai_automation', 'common']);
    const [recordA, recordB] = records;

    const allKeys = useMemo(() => {
        const keys = new Set([...Object.keys(recordA), ...Object.keys(recordB)] as (keyof DataQualityRecord)[]);
        // Filter out keys we don't want to merge manually
        return Array.from(keys).filter(k => !['id', 'avatar', 'tasks'].includes(k));
    }, [recordA, recordB]);

    const [selections, setSelections] = useState<Record<string, 'A' | 'B'>>(() => {
        const initialSelections: Record<string, 'A' | 'B'> = {};
        allKeys.forEach(key => {
            initialSelections[key] = getSuggestion(key, recordA[key], recordB[key]);
        });
        return initialSelections;
    });

    const mergedRecord = useMemo(() => {
        const final: Partial<DataQualityRecord> = {};
        allKeys.forEach(key => {
            (final as any)[key] = selections[key] === 'A' ? recordA[key] : recordB[key];
        });
        
        // Special handling for numeric sums
        final.totalDonated = recordA.totalDonated + recordB.totalDonated;
        final.donationCount = recordA.donationCount + recordB.donationCount;
        
        // Keep the ID and avatar of the primary record (the one with higher total donation)
        const primaryRecord = recordA.totalDonated >= recordB.totalDonated ? recordA : recordB;
        final.id = primaryRecord.id;
        final.avatar = primaryRecord.avatar;
        final.tasks = [...recordA.tasks, ...recordB.tasks];

        return final as DataQualityRecord;
    }, [selections, recordA, recordB, allKeys]);
    
    const handleSelect = (key: string, choice: 'A' | 'B') => {
        setSelections(prev => ({ ...prev, [key]: choice }));
    };

    const handleConfirm = () => {
        const primaryRecord = recordA.totalDonated >= recordB.totalDonated ? recordA : recordB;
        const secondaryRecord = recordA.totalDonated >= recordB.totalDonated ? recordB : recordA;
        onConfirmMerge(primaryRecord.id, secondaryRecord.id, mergedRecord);
    };

    if (!isOpen) return null;

    const FieldRow: React.FC<{fieldKey: string}> = ({fieldKey}) => {
        const key = fieldKey as keyof DataQualityRecord;
        const valA = recordA[key];
        const valB = recordB[key];
        const suggestion = getSuggestion(key, valA, valB);
        const selected = selections[key];

        const getCellClass = (choice: 'A' | 'B') => {
            return `p-3 border-t dark:border-slate-700 cursor-pointer transition-colors ${selected === choice ? 'bg-secondary/20' : 'hover:bg-gray-100 dark:hover:bg-slate-700/50'}`;
        }

        return (
            <tr>
                <td className="p-3 border-t dark:border-slate-700 font-semibold text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</td>
                <td className={getCellClass('A')} onClick={() => handleSelect(key, 'A')}>
                    <div className="flex items-center gap-2">
                        {String(valA)}
                        {suggestion === 'A' && <SparklesIcon className="w-4 h-4 text-primary" title={t('ai_automation.data_quality.aiSuggestion')} />}
                    </div>
                </td>
                <td className={getCellClass('B')} onClick={() => handleSelect(key, 'B')}>
                    <div className="flex items-center gap-2">
                        {String(valB)}
                         {suggestion === 'B' && <SparklesIcon className="w-4 h-4 text-primary" title={t('ai_automation.data_quality.aiSuggestion')} />}
                    </div>
                </td>
                <td className="p-3 border-t dark:border-slate-700 bg-gray-100 dark:bg-slate-900/50 font-bold">{String(mergedRecord[key])}</td>
            </tr>
        )
    };


    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">{t('ai_automation.data_quality.mergeRecords')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-start text-xs uppercase text-gray-500 dark:text-gray-400">
                                    <th className="p-2 w-1/5">Field</th>
                                    <th className="p-2 w-1/4">{t('ai_automation.data_quality.recordA')} (ID: {recordA.id})</th>
                                    <th className="p-2 w-1/4">{t('ai_automation.data_quality.recordB')} (ID: {recordB.id})</th>
                                    <th className="p-2 w-1/3 bg-gray-100 dark:bg-slate-900/50 rounded-t-lg">{t('ai_automation.data_quality.finalRecord')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allKeys.map(key => <FieldRow key={key} fieldKey={key} />)}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-2xl flex justify-between items-center">
                    <p className="text-xs text-gray-500 flex items-center gap-1"><SparklesIcon className="w-4 h-4 text-primary" title={t('ai_automation.data_quality.aiSuggestion')} /> = {t('ai_automation.data_quality.aiSuggestion')}</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('donors.modal.cancel')}</button>
                        <button onClick={handleConfirm} className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark">{t('ai_automation.data_quality.confirmMerge')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MergeModal;