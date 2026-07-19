import React from 'react';
import { motion } from 'framer-motion';
import { useLocalization } from '../../hooks/useLocalization';
import Tooltip from '../common/Tooltip';
import { PlusCircleIcon } from '../icons/GenericIcons';
import { BarChart3 as BarChartIcon } from 'lucide-react';
import { MailIcon } from '../icons/ActionIcons';
import { SettingsIcon } from '../icons/ModuleIcons';

interface QuickActionsHubProps {
    setActiveModule: (module: string) => void;
}

const QuickActionsHub: React.FC<QuickActionsHubProps> = ({ setActiveModule }) => {
    const { t } = useLocalization();

    const actions = [
        { id: 'addProject', labelKey: 'quick_actions.addProject', icon: PlusCircleIcon, targetModule: 'projects' },
        { id: 'createReport', labelKey: 'quick_actions.createReport', icon: BarChartIcon, targetModule: 'reports' },
        { id: 'sendMessage', labelKey: 'quick_actions.sendMessage', icon: MailIcon, targetModule: 'digital_marketing' },
        { id: 'settings', labelKey: 'quick_actions.settings', icon: SettingsIcon, targetModule: 'settings' },
    ];

    return (
        <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft">
            <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground mb-4">{t('quick_actions.title')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {actions.map((action, index) => (
                    <Tooltip key={action.id} text={t(action.labelKey)}>
                        <motion.button
                            onClick={() => setActiveModule(action.targetModule)}
                            className="group flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 h-24 sm:h-28"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                            <action.icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary dark:text-secondary transition-transform duration-200 group-hover:scale-110" />
                            <span className="mt-2 text-xs sm:text-sm font-semibold text-center text-foreground dark:text-dark-foreground">{t(action.labelKey)}</span>
                        </motion.button>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
};

export default QuickActionsHub;