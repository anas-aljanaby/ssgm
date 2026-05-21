import React, { useState } from 'react';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import { X as XIcon } from 'lucide-react';

interface AddKpiModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (kpiData: { title: string; value: number; target: number; unit: string; goalId: string; }) => void;
    goalId: string;
}

const AddKpiModal: React.FC<AddKpiModalProps> = ({ isOpen, onClose, onAdd, goalId }) => {
    const { t } = useLocalization();
    const [title, setTitle] = useState('');
    const [value, setValue] = useState(0);
    const [target, setTarget] = useState(0);
    const [unit, setUnit] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !unit.trim()) {
            alert(t('bousala.addKpiModal.requiredFields'));
            return;
        }
        onAdd({ title, value, target, unit, goalId });
        // Reset form
        setTitle('');
        setValue(0);
        setTarget(0);
        setUnit('');
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose} dir="rtl">
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">{t('bousala.addKpiModal.title')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium">{t('bousala.addKpiModal.kpiTitle')}</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium">{t('bousala.addKpiModal.currentValue')}</label>
                                <input type="number" value={value} onChange={e => setValue(Number(e.target.value))} required className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">{t('bousala.addKpiModal.targetValue')}</label>
                                <input type="number" value={target} onChange={e => setTarget(Number(e.target.value))} required className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">{t('bousala.addKpiModal.unit')}</label>
                            <input type="text" value={unit} onChange={e => setUnit(e.target.value)} required placeholder={t('bousala.addKpiModal.unitPlaceholder')} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800" />
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">{t('bousala.addKpiModal.save')}</button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default AddKpiModal;