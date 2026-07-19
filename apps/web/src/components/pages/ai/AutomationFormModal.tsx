import React, { useEffect, useState } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import ModalPortal from '../../common/ModalPortal';
import { XIcon } from '../../icons/GenericIcons';
import type { Automation, AutomationAction, AutomationTrigger } from '../../../data/automationsData';

export type AutomationFormValues = Omit<Automation, 'id'>;

interface AutomationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: AutomationFormValues) => void | Promise<void>;
    initial?: Automation | null;
}

const emptyForm: AutomationFormValues = {
    name: { en: '', ar: '' },
    trigger: 'newDonor',
    action: 'sendEmail',
    enabled: true,
};

const AutomationFormModal: React.FC<AutomationFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initial = null,
}) => {
    const { t } = useLocalization(['ai_automation', 'common']);
    const [form, setForm] = useState<AutomationFormValues>(emptyForm);
    const [errors, setErrors] = useState<{ name?: string; trigger?: string; action?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setForm(
            initial
                ? {
                      name: { ...initial.name },
                      trigger: initial.trigger,
                      action: initial.action,
                      enabled: initial.enabled,
                  }
                : emptyForm,
        );
        setErrors({});
        setIsSubmitting(false);
    }, [isOpen, initial]);

    const validate = (): boolean => {
        const next: typeof errors = {};
        if (!form.name.en.trim() && !form.name.ar.trim()) {
            next.name = t('ai_automation.automations.nameRequired');
        }
        if (!form.trigger) next.trigger = t('ai_automation.automations.triggerRequired');
        if (!form.action) next.action = t('ai_automation.automations.actionRequired');
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            await onSubmit({
                name: { en: form.name.en.trim(), ar: form.name.ar.trim() },
                trigger: form.trigger,
                action: form.action,
                enabled: form.enabled,
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const title = initial
        ? t('ai_automation.automations.editAutomation')
        : t('ai_automation.automations.createNew');

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose} labelledBy="automation-form-title">
            <div
                className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 id="automation-form-title" className="text-xl font-bold">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
                        aria-label={t('common.close')}
                    >
                        <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('ai_automation.automations.nameEn')}
                            </label>
                            <input
                                type="text"
                                value={form.name.en}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, name: { ...f.name, en: e.target.value } }))
                                }
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('ai_automation.automations.nameAr')}
                            </label>
                            <input
                                type="text"
                                dir="rtl"
                                value={form.name.ar}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, name: { ...f.name, ar: e.target.value } }))
                                }
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        {errors.name && (
                            <p className="text-sm font-semibold text-red-600" role="alert">
                                {errors.name}
                            </p>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('ai_automation.automations.triggerLabel')}
                            </label>
                            <select
                                value={form.trigger}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        trigger: e.target.value as AutomationTrigger,
                                    }))
                                }
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                            >
                                <option value="newDonor">
                                    {t('ai_automation.automations.triggers.newDonor')}
                                </option>
                                <option value="newDonation">
                                    {t('ai_automation.automations.triggers.newDonation')}
                                </option>
                                <option value="projectStatusUpdate">
                                    {t('ai_automation.automations.triggers.projectStatusUpdate')}
                                </option>
                            </select>
                            {errors.trigger && (
                                <p className="text-sm text-red-600 mt-1" role="alert">
                                    {errors.trigger}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('ai_automation.automations.actionLabel')}
                            </label>
                            <select
                                value={form.action}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        action: e.target.value as AutomationAction,
                                    }))
                                }
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
                            >
                                <option value="sendEmail">
                                    {t('ai_automation.automations.actions.sendEmail')}
                                </option>
                                <option value="createTask">
                                    {t('ai_automation.automations.actions.createTask')}
                                </option>
                                <option value="notifyUser">
                                    {t('ai_automation.automations.actions.notifyUser')}
                                </option>
                            </select>
                            {errors.action && (
                                <p className="text-sm text-red-600 mt-1" role="alert">
                                    {errors.action}
                                </p>
                            )}
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.enabled}
                                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium">
                                {t('ai_automation.automations.enabled')}
                            </span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 p-4 border-t dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg border dark:border-slate-600 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark disabled:opacity-50"
                        >
                            {isSubmitting ? t('common.saving') : t('ai_automation.automations.save')}
                        </button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default AutomationFormModal;
