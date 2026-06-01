
import React from 'react';
import { motion } from 'framer-motion';
import { useLocalization } from '../../../hooks/useLocalization';
import type { Stakeholder, StakeholderType } from '../../../types';
import { isOptimisticStakeholder } from '../../../lib/stakeholderOptimistic';
import { Heart, UserCheck, Handshake, Users, Building2, Package, Globe, Newspaper, Award, Shield, Info, CheckCircle, DollarSign, BrainCircuit } from 'lucide-react';

interface StakeholderCardProps {
    stakeholder: Stakeholder;
    highlighted?: boolean;
    onClick: () => void;
}

// MiniGauge component for displaying scores
const MiniGauge: React.FC<{ value: number; label: string }> = ({ value, label }) => {
    const size = 56;
    const stroke = 5;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    const ringColor = value >= 80 ? 'stroke-green-500' : value >= 60 ? 'stroke-amber-500' : 'stroke-red-500';
    const textColor = value >= 80
        ? 'text-green-600 dark:text-green-400'
        : value >= 60
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <circle
                        className="text-gray-200 dark:text-slate-700"
                        strokeWidth={stroke}
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    <circle
                        className={`transition-all duration-700 ${ringColor}`}
                        strokeWidth={stroke}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textColor}`}>{value}</span>
            </div>
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 text-center leading-tight w-full truncate">{label}</span>
        </div>
    );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string; colorClass?: string }> = ({ icon, label, value, colorClass = 'text-gray-600 dark:text-gray-300' }) => (
    <div className={`flex items-center gap-2 text-sm ${colorClass}`}>
        <div className="p-1.5 bg-gray-100 dark:bg-slate-700 rounded-md">{icon}</div>
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-semibold">{value}</p>
        </div>
    </div>
);


const StakeholderCard: React.FC<StakeholderCardProps> = ({ stakeholder, highlighted = false, onClick }) => {
    const { t, language } = useLocalization(['common', 'stakeholders']);
    const optimistic = isOptimisticStakeholder(stakeholder.id);
    
    // FIX: Added missing stakeholder types to satisfy the Record<StakeholderType, ...> constraint.
    const stakeholderTypes: Record<StakeholderType, { icon: React.ElementType }> = {
        donor: { icon: Heart },
        beneficiary: { icon: UserCheck },
        partner: { icon: Handshake },
        volunteer: { icon: Users },
        government: { icon: Building2 },
        supplier: { icon: Package },
        community: { icon: Globe },
        media: { icon: Newspaper },
        investor: { icon: DollarSign },
        expert: { icon: BrainCircuit },
        mentor: { icon: UserCheck },
        board_member: { icon: Shield },
    };

    const riskProfileConfig: Record<Stakeholder['riskProfile'], { icon: React.ElementType; color: string; labelKey: string }> = {
        supporter: { icon: CheckCircle, color: 'text-green-500', labelKey: 'stakeholder_management.riskProfile.supporter' },
        neutral: { icon: Info, color: 'text-gray-500', labelKey: 'stakeholder_management.riskProfile.neutral' },
        blocker: { icon: Shield, color: 'text-red-500', labelKey: 'stakeholder_management.riskProfile.blocker' },
    };

    const TypeIcon = stakeholderTypes[stakeholder.type]?.icon || Users;
    const RiskProfileIcon = riskProfileConfig[stakeholder.riskProfile].icon;
    const riskProfileColor = riskProfileConfig[stakeholder.riskProfile].color;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={() => !optimistic && onClick()}
            className={`bg-card dark:bg-dark-card rounded-2xl shadow-soft transition-all duration-300 flex flex-col border dark:border-slate-700/50 ${
                optimistic
                    ? 'opacity-70 animate-pulse cursor-default'
                    : 'cursor-pointer hover:shadow-lg hover:-translate-y-1'
            } ${highlighted ? 'ring-2 ring-emerald-300 dark:ring-emerald-700' : ''}`}
        >
            <div className="p-4 border-b dark:border-slate-700/50">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex-shrink-0 p-2 rounded-lg bg-primary-light dark:bg-primary/20`}>
                            <TypeIcon className="w-6 h-6 text-primary dark:text-secondary" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-lg text-foreground dark:text-dark-foreground truncate">{stakeholder.name[language] || stakeholder.name.ar || stakeholder.name.en}</h3>
                            <p className="text-xs text-gray-500">{t(`stakeholder_management.types.${stakeholder.type}`)}</p>
                        </div>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${stakeholder.status === 'active' ? 'bg-green-100 text-green-800' : stakeholder.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>{t(`stakeholder_management.statuses.${stakeholder.status}`)}</span>
                </div>
            </div>
            
            <div className="p-4 flex-grow">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    <MiniGauge value={stakeholder.healthScore} label={t('stakeholder_management.card.health')} />
                    <MiniGauge value={stakeholder.engagementScore} label={t('stakeholder_management.card.engagement')} />
                    <MiniGauge value={stakeholder.power} label={t('stakeholder_management.card.power')} />
                    <MiniGauge value={stakeholder.interest} label={t('stakeholder_management.card.interest')} />
                </div>

                <div className="space-y-3 pt-4 border-t dark:border-slate-700/50">
                    <InfoItem icon={<Award size={16} />} label={t('stakeholder_management.table.level')} value={t(`stakeholder_management.relationshipLevels.${stakeholder.relationshipLevel}`)} />
                    <InfoItem icon={<Shield size={16} />} label={t('stakeholder_management.table.risks')} value={t(`stakeholder_management.risks.${stakeholder.riskLevel}`)} colorClass={stakeholder.riskLevel === 'high' ? 'text-red-600' : stakeholder.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'} />
                    <InfoItem icon={<RiskProfileIcon size={16} className={riskProfileColor} />} label={t('stakeholder_management.riskProfileLabel')} value={t(riskProfileConfig[stakeholder.riskProfile].labelKey)} colorClass={riskProfileColor} />
                </div>
                 {stakeholder.needs.length > 0 && (
                    <div className="mt-4 pt-3 border-t dark:border-slate-700/50">
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">{t('stakeholder_management.card.needs')}</h4>
                        <div className="flex flex-wrap gap-1">
                            {stakeholder.needs.map(need => <span key={need} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded-full">{need}</span>)}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-dark-card/50 rounded-b-2xl border-t dark:border-slate-700/50">
                <button onClick={onClick} className="w-full py-2 text-sm font-semibold text-primary dark:text-secondary-light bg-primary-light dark:bg-secondary/20 rounded-lg hover:bg-primary/20 dark:hover:bg-secondary/30 transition-colors">
                    {t('stakeholder_management.card.viewDetails')}
                </button>
            </div>
        </motion.div>
    );
};

export default StakeholderCard;