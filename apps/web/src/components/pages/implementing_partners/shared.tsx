import React from 'react';
import { Check, Pencil, X } from 'lucide-react';

export const fieldClass =
    'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900';

/** Tailwind classes for a 0–100 evaluation score, banded by performance tier. */
export const scoreTone = (value: number): { bar: string; text: string; soft: string } => {
    if (value >= 85) return { bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400', soft: 'bg-green-100 dark:bg-green-900/30' };
    if (value >= 70) return { bar: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400', soft: 'bg-blue-100 dark:bg-blue-900/30' };
    if (value >= 55) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', soft: 'bg-amber-100 dark:bg-amber-900/30' };
    return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', soft: 'bg-red-100 dark:bg-red-900/30' };
};

export const EditActions: React.FC<{
    isEditing: boolean;
    isSaving?: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    editLabel: string;
    saveLabel: string;
    cancelLabel: string;
    savingLabel?: string;
}> = ({ isEditing, isSaving = false, onEdit, onSave, onCancel, editLabel, saveLabel, cancelLabel, savingLabel }) => {
    if (!isEditing) {
        return (
            <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-light dark:text-secondary dark:hover:bg-primary/20"
            >
                <Pencil size={14} /> {editLabel}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-slate-700"
            >
                <X size={14} /> {cancelLabel}
            </button>
            <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-white bg-secondary hover:bg-secondary-dark disabled:opacity-50"
            >
                <Check size={14} /> {isSaving ? (savingLabel ?? saveLabel) : saveLabel}
            </button>
        </div>
    );
};
