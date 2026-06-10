import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, DollarSign, Star } from 'lucide-react';
import type { Partner } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatCurrency } from '../../../lib/utils';

interface PartnerCardProps {
    partner: Partner;
    onClick: () => void;
}

const STATUS_STYLES: Record<string, string> = {
    'نشط': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    'غير نشط': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'قيد المراجعة': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
};

const SECTOR_STYLES: Record<string, string> = {
    'التعليم': 'bg-blue-100 text-blue-800',
    'الصحة': 'bg-red-100 text-red-800',
    'الإغاثة': 'bg-orange-100 text-orange-800',
    'التنمية': 'bg-purple-100 text-purple-800',
    'البيئة': 'bg-teal-100 text-teal-800',
};

const StatRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
        <span className="flex items-center gap-2">{icon} {label}</span>
        <span className="font-semibold text-gray-800 dark:text-gray-100">{value}</span>
    </div>
);

const PartnerCard: React.FC<PartnerCardProps> = ({ partner, onClick }) => {
    const { t, language } = useLocalization(['partners']);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-dark-card rounded-xl shadow-md p-4 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all"
        >
            <div className="relative text-center">
                <div className={`absolute top-0 right-0 text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLES[partner.status] ?? ''}`}>
                    {partner.status}
                </div>
                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 text-2xl mx-auto mt-4">
                    {partner.logo}
                </div>
                <h3 className="font-bold text-lg mt-3 text-foreground dark:text-dark-foreground">{partner.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{partner.country}</p>
                <div className="mt-2 flex justify-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${SECTOR_STYLES[partner.sector] ?? 'bg-gray-100 text-gray-800'}`}>
                        {partner.sector}
                    </span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t dark:border-slate-600 space-y-2 text-sm text-right">
                <StatRow
                    icon={<ClipboardList size={16} />}
                    label={t('partners.card.projects')}
                    value={`${partner.projectsCompleted} ${t('partners.card.completed')}`}
                />
                <StatRow
                    icon={<Clock size={16} />}
                    label={t('partners.card.inProgress')}
                    value={partner.projectsInProgress}
                />
                <StatRow
                    icon={<Star size={16} />}
                    label={t('partners.card.rating')}
                    value={`${partner.rating.toFixed(1)} / 5.0`}
                />
                <StatRow
                    icon={<DollarSign size={16} />}
                    label={t('partners.card.budget')}
                    value={formatCurrency(partner.budget, language)}
                />
            </div>

            <button
                type="button"
                onClick={onClick}
                className="mt-4 w-full py-2 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
                {t('partners.card.viewProfile')}
            </button>
        </motion.div>
    );
};

export default PartnerCard;
