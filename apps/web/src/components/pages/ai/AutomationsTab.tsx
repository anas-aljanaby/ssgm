import React, { useState } from 'react';
import AiCard from './AiCard';
import AutomationFormModal, { type AutomationFormValues } from './AutomationFormModal';
import ConfirmationModal from '../../common/ConfirmationModal';
import { WorkflowOptIcon } from '../../icons/AiIcons';
import { PlusCircleIcon } from '../../icons/GenericIcons';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { MOCK_AUTOMATIONS, type Automation } from '../../../data/automationsData';

interface AutomationsTabProps {
    automations?: Automation[];
}

const AutomationsTab: React.FC<AutomationsTabProps> = ({ automations: initial = MOCK_AUTOMATIONS }) => {
    const { t, pickLocalized } = useLocalization(['ai_automation', 'common']);
    const toast = useToast();
    const [automations, setAutomations] = useState<Automation[]>(initial);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Automation | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (item: Automation) => {
        setEditing(item);
        setModalOpen(true);
    };

    const handleSubmit = async (values: AutomationFormValues) => {
        await new Promise((r) => setTimeout(r, 300));
        if (editing) {
            setAutomations((prev) =>
                prev.map((a) => (a.id === editing.id ? { ...a, ...values } : a)),
            );
            toast.showSuccess(t('ai_automation.automations.updated'));
        } else {
            setAutomations((prev) => [
                { id: `auto-${Date.now()}`, ...values },
                ...prev,
            ]);
            toast.showSuccess(t('ai_automation.automations.created'));
        }
    };

    const toggleEnabled = (id: string) => {
        setAutomations((prev) =>
            prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
        );
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        await new Promise((r) => setTimeout(r, 200));
        setAutomations((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        setIsDeleting(false);
        setDeleteTarget(null);
        toast.showSuccess(t('ai_automation.automations.deleted'));
    };

    return (
        <div className="space-y-6">
            <AiCard
                title={t('ai_automation.automations.myAutomations')}
                icon={<WorkflowOptIcon className="w-6 h-6" />}
            >
                <div className="flex justify-end mb-4">
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-semibold rounded-lg hover:bg-secondary-dark"
                    >
                        <PlusCircleIcon className="w-5 h-5" />
                        {t('ai_automation.automations.createNew')}
                    </button>
                </div>

                {automations.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                        {t('ai_automation.automations.empty')}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {automations.map((wf) => (
                            <div
                                key={wf.id}
                                className="p-4 border dark:border-slate-700 rounded-lg flex items-center justify-between gap-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold truncate">{pickLocalized(wf.name)}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {t(`ai_automation.automations.triggers.${wf.trigger}`)}
                                        {' → '}
                                        {t(`ai_automation.automations.actions.${wf.action}`)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={wf.enabled}
                                            onChange={() => toggleEnabled(wf.id)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                            aria-label={t('ai_automation.automations.enabled')}
                                        />
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {wf.enabled
                                                ? t('ai_automation.automations.enabled')
                                                : t('ai_automation.automations.disabled')}
                                        </span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => openEdit(wf)}
                                        className="text-sm text-primary hover:underline font-semibold"
                                    >
                                        {t('ai_automation.automations.edit')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(wf)}
                                        className="text-sm text-red-600 hover:underline font-semibold"
                                    >
                                        {t('common.delete')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </AiCard>

            <AutomationFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                initial={editing}
            />

            <ConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => !isDeleting && setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title={t('ai_automation.automations.deleteTitle')}
                message={t('ai_automation.automations.deleteMessage')}
                isConfirming={isDeleting}
            />
        </div>
    );
};

export default AutomationsTab;
