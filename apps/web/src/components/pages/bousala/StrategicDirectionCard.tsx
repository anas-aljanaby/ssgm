import React, { useEffect, useState } from 'react';
import { Compass, Pencil, Check, X, Loader } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { BousalaDirection } from '../../../types';

interface StrategicDirectionCardProps {
    direction?: BousalaDirection;
    canEdit?: boolean;
    isSaving?: boolean;
    onSave?: (data: BousalaDirection) => void | Promise<void>;
}

const StrategicDirectionCard: React.FC<StrategicDirectionCardProps> = ({
    direction,
    canEdit = false,
    isSaving = false,
    onSave,
}) => {
    const { t } = useLocalization(['bousala', 'common']);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<BousalaDirection>({
        vision: direction?.vision ?? '',
        mission: direction?.mission ?? '',
        general: direction?.general ?? '',
    });

    useEffect(() => {
        if (!isEditing) {
            setForm({
                vision: direction?.vision ?? '',
                mission: direction?.mission ?? '',
                general: direction?.general ?? '',
            });
        }
    }, [direction, isEditing]);

    if (!direction && !canEdit) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onSave) return;
        try {
            await Promise.resolve(onSave({
                vision: form.vision.trim(),
                mission: form.mission.trim(),
                general: form.general.trim(),
            }));
            setIsEditing(false);
        } catch {
            // Parent handles errors.
        }
    };

    const fields = [
        { key: 'vision' as const, label: t('bousala.direction.vision') },
        { key: 'mission' as const, label: t('bousala.direction.mission') },
        { key: 'general' as const, label: t('bousala.direction.general') },
    ];

    return (
        <div className="bg-card dark:bg-dark-card/50 rounded-2xl shadow-soft border dark:border-slate-700/50 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-lg">{t('bousala.direction.title')}</h2>
                </div>
                {canEdit && !isEditing && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
                        aria-label={t('bousala.direction.editAria')}
                    >
                        <Pencil size={16} />
                    </button>
                )}
            </div>
            {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                    {fields.map(({ key, label }) => (
                        <div key={key}>
                            <label className="block text-xs font-semibold text-gray-500">{label}</label>
                            <textarea
                                value={form[key]}
                                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                                rows={2}
                                disabled={isSaving}
                                className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 text-sm disabled:opacity-50"
                                dir="auto"
                            />
                        </div>
                    ))}
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="submit" disabled={isSaving} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50">
                            {isSaving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                            {isSaving ? t('common.saving') : t('common.save')}
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} disabled={isSaving} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-50">
                            <X size={14} /> {t('common.cancel')}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {fields.map(({ key, label }) => (
                        <div key={key} className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500">{label}</p>
                            <p className="text-foreground dark:text-dark-foreground leading-relaxed" dir="auto">
                                {form[key] || '—'}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StrategicDirectionCard;
