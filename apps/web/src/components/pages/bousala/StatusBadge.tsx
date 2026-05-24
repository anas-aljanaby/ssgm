import React from 'react';

function statusTone(status: string): string {
    if (status.includes('مكتمل') || status.includes('ضمن المسار')) {
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
    if (status.includes('خطر') || status.includes('متأخر')) {
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
    if (status.includes('متابعة') || status.includes('تنفيذ')) {
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

const StatusBadge: React.FC<{ status?: string; className?: string }> = ({ status, className = '' }) => {
    if (!status) return null;
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusTone(status)} ${className}`}
            dir="auto"
        >
            {status}
        </span>
    );
};

export default StatusBadge;
