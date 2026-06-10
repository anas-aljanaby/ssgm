import React from 'react';

const PartnerCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-md p-4 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-slate-700 mx-auto mt-4" />
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded-md mt-3 w-3/4 mx-auto" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-md mt-2 w-1/2 mx-auto" />
        <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded-full mt-2 w-1/4 mx-auto" />
        <div className="mt-4 pt-4 border-t dark:border-slate-600 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-md" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-md" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-md" />
        </div>
        <div className="mt-4 w-full h-10 bg-gray-200 dark:bg-slate-700 rounded-lg" />
    </div>
);

export default PartnerCardSkeleton;
