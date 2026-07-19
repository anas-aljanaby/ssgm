
import React from 'react';

interface AiCardProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

const AiCard = React.forwardRef<HTMLDivElement, AiCardProps>(({ title, icon, children, className = '' }, ref) => {
    return (
        <div ref={ref} className={`bg-card dark:bg-dark-card rounded-2xl shadow-soft border border-gray-200 dark:border-slate-700/50 ${className}`}>
            <div className="flex items-center gap-3 p-4 border-b dark:border-slate-700">
                {icon}
                <h3 className="font-bold text-lg text-foreground dark:text-dark-foreground">{title}</h3>
            </div>
            <div className="p-4 sm:p-6">
                {children}
            </div>
        </div>
    );
});

export default AiCard;
