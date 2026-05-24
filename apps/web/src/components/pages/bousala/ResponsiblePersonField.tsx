import React, { useMemo } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { HrData } from '../../../types';

interface ResponsiblePersonFieldProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    hrData?: HrData;
    id?: string;
    className?: string;
}

const ResponsiblePersonField: React.FC<ResponsiblePersonFieldProps> = ({
    value,
    onChange,
    disabled = false,
    hrData,
    id = 'bousala-responsible-person',
    className = 'w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 disabled:opacity-50',
}) => {
    const { t } = useLocalization(['bousala']);

    const suggestions = useMemo(() => {
        const teams = Object.values(
            t('bousala.ownerTeams', { returnObjects: true }) as Record<string, string>,
        );
        const volunteers = hrData?.volunteers.map(v => v.full_name) ?? [];
        return Array.from(new Set([...teams, ...volunteers].filter(Boolean)));
    }, [hrData?.volunteers, t]);

    const listId = `${id}-suggestions`;

    return (
        <>
            <input
                id={id}
                type="text"
                list={listId}
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                className={className}
                dir="auto"
                placeholder={t('bousala.addGoalModal.responsiblePersonPlaceholder')}
            />
            <datalist id={listId}>
                {suggestions.map(option => (
                    <option key={option} value={option} />
                ))}
            </datalist>
        </>
    );
};

export default ResponsiblePersonField;
