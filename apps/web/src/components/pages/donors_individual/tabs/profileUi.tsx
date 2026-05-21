import React from 'react';
import type { DonorPipelineLikelihood, RelationshipHealth } from '../../../../types';

export const EmptyPanel: React.FC<{ text: string; action?: React.ReactNode }> = ({ text, action }) => (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/30">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{text}</p>
        {action && <div className="mt-4">{action}</div>}
    </div>
);

export const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = '' }) => (
    <section className={`min-w-0 rounded-xl border border-gray-200/80 bg-card p-5 shadow-sm dark:border-slate-700/70 dark:bg-dark-card ${className}`}>
        <div className="mb-4 flex min-w-0 items-center gap-3">
            {icon && <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary dark:bg-primary/20 dark:text-secondary">{icon}</div>}
            <h3 className="truncate text-base font-bold text-foreground dark:text-dark-foreground">{title}</h3>
        </div>
        {children}
    </section>
);

export const InfoRow: React.FC<{ label: string; value: React.ReactNode; muted?: boolean }> = ({ label, value, muted }) => (
    <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
        <div className={`mt-1 break-words text-sm font-bold leading-6 ${muted ? 'text-gray-500 dark:text-gray-400' : 'text-foreground dark:text-dark-foreground'}`}>{value || 'N/A'}</div>
    </div>
);

export const MetricCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; subtext?: React.ReactNode; accent?: string }> = ({ title, value, icon, subtext, accent = 'text-primary dark:text-secondary' }) => (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-card p-4 shadow-sm dark:border-slate-700/70 dark:bg-dark-card">
        <div className="flex min-w-0 items-start gap-3">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800 ${accent}`}>{icon}</div>
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{title}</p>
                <div className="mt-1 break-words text-xl font-bold leading-tight text-foreground dark:text-dark-foreground">{value}</div>
                {subtext && <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">{subtext}</p>}
            </div>
        </div>
    </div>
);

export const Chip: React.FC<{ children: React.ReactNode; tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'red' }> = ({ children, tone = 'neutral' }) => {
    const tones = {
        neutral: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-200',
        blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-200',
        green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-200',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-200',
        red: 'bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-200',
    };

    return <span className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
};

export const RelationshipHealthChip: React.FC<{ health?: RelationshipHealth | null; label?: string }> = ({ health, label }) => {
    if (!health) return <Chip>{label || 'Not enough data'}</Chip>;
    const tone = health === 'Good' ? 'green' : health === 'At Risk' ? 'red' : 'amber';
    return <Chip tone={tone}>{label || health}</Chip>;
};

export const RelationshipLikelihoodChip: React.FC<{ likelihood?: DonorPipelineLikelihood | null; label?: string }> = ({ likelihood, label }) => {
    if (!likelihood) return <Chip>{label || 'Not enough data'}</Chip>;
    const tone = likelihood === 'High' ? 'green' : likelihood === 'Low' ? 'red' : 'amber';
    return <Chip tone={tone}>{label || likelihood}</Chip>;
};
