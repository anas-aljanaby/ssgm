import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../../hooks/useLocalization';
import { useTheme } from '../../hooks/useTheme';
import { SIDEBAR_MODULES } from '../../constants';
import { LogoutIcon } from '../icons/ModuleIcons';
import { SunIcon, MoonIcon, ChevronDownIcon } from '../icons/GenericIcons';
import { SUPPORTED_LANGUAGES } from '../../lib/i18n';
import { langToFlag } from '../icons/FlagIcons';
import type { Role } from '../../types';
import ModalPortal from '../common/ModalPortal';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
  role: Role;
  setRole: (role: Role) => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose, activeModule, setActiveModule, role, setRole }) => {
  const { t, language, setLanguage, dir } = useLocalization();
  const { theme, toggleTheme } = useTheme();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const visibleModules = useMemo(() => SIDEBAR_MODULES.filter(module => {
    if (module.key === 'bousala') {
      return role === 'Admin' || role === 'Manager';
    }
    return true;
  }), [role]);

  useEffect(() => {
    if (isOpen) {
        const parentMenu = visibleModules.find(m => m.submenu && m.submenu.some((sub: any) => sub.key === activeModule));
        if (parentMenu) {
            setOpenSubmenu(parentMenu.key);
        }
    } else {
        setOpenSubmenu(null);
    }
  }, [activeModule, isOpen, visibleModules]);

  const handleModuleClick = (moduleKey: string) => {
    setActiveModule(moduleKey);
    onClose();
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      dir={dir === 'rtl' ? 'rtl' : 'ltr'}
      overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm modal-overlay animate-fade-in md:hidden transition-opacity duration-400 ease-in-out md:pointer-events-none"
      containerClassName="relative flex min-h-full w-full items-stretch p-0 md:hidden md:pointer-events-none"
    >
      <nav className={`pointer-events-auto relative h-full w-4/5 max-w-xs bg-card/85 dark:bg-dark-card/85 backdrop-blur-xl flex flex-col transition-transform duration-500 ease-bounce-out shadow-2xl ltr:rounded-e-2xl rtl:rounded-s-2xl ${isOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}`}>
        <div 
            className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 ltr:-translate-x-5 rtl:translate-x-5'}`}
            style={{ transitionDelay: isOpen ? '100ms' : '0ms' }}
        >
            <div className={`flex items-center h-20 px-6 border-b dark:border-slate-800 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <div className="flex items-center justify-center min-w-[3rem] h-12 bg-gradient-to-br from-primary to-secondary text-white rounded-full">
                    <span className="text-2xl font-bold">M</span>
                </div>
                <h1 className="text-xl font-bold text-foreground dark:text-dark-foreground mx-3">MSS.2</h1>
            </div>
            <div className="p-4 border-b dark:border-slate-800">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <img src="https://picsum.photos/id/1005/100/100" alt="User" className="w-12 h-12 rounded-full"/>
                    <div>
                        <span className="font-semibold text-base">{t('header.profile.name')}</span>
                        <p className="text-sm text-gray-500">{role}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {visibleModules.map((module, index) => (
                <li
                    key={module.key}
                    style={{ transitionDelay: `${isOpen ? 150 + index * 20 : 0}ms` }}
                    className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 ltr:-translate-x-5 rtl:translate-x-5'}`}
                >
                    {module.submenu ? (
                        <>
                            <button onClick={() => setOpenSubmenu(openSubmenu === module.key ? null : module.key)}
                                className={`flex items-center w-full p-3 rounded-lg text-left ${dir === 'rtl' ? 'flex-row-reverse' : ''} ${module.submenu.some((sub: any) => sub.key === activeModule) ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                <module.icon />
                                <span className="mx-4 font-semibold text-base">{t(`sidebar.${module.key}`)}</span>
                                <ChevronDownIcon className={`w-4 h-4 ms-auto transition-transform ${openSubmenu === module.key ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                            {openSubmenu === module.key && (
                                <motion.ul initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className={`overflow-hidden ${dir === 'rtl' ? 'pr-8' : 'pl-8'} pt-1 space-y-1`}>
                                    {module.submenu.map((subItem: any) => (
                                        <li key={subItem.key}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); handleModuleClick(subItem.key); }}
                                               className={`block p-2 rounded-md text-sm font-medium ${activeModule === subItem.key ? 'bg-primary-light/50 text-primary-dark font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {t(`sidebar.${subItem.key}`)}
                                            </a>
                                        </li>
                                    ))}
                                </motion.ul>
                            )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <a href="#" onClick={(e) => { e.preventDefault(); handleModuleClick(module.key); }}
                           className={`flex items-center p-3 rounded-lg ${activeModule === module.key ? 'bg-primary-light/50 dark:bg-primary/20 text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'} ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
                        >
                            <module.icon />
                            <span className="mx-4 font-semibold text-base">{t(`sidebar.${module.key}`)}</span>
                        </a>
                    )}
                </li>
              ))}
            </ul>
        </div>
        
         <div 
            className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 ltr:-translate-x-5 rtl:translate-x-5'}`}
            style={{ transitionDelay: `${isOpen ? 150 + (SIDEBAR_MODULES.length) * 20 : 0}ms` }}
        >
            <div className="p-4 border-t dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-around">
                    {SUPPORTED_LANGUAGES.map(lang => {
                        const FlagComponent = langToFlag[lang.code];
                        return (
                            <button key={lang.code} onClick={() => setLanguage(lang.code)} className={`p-2 rounded-full transition-colors ${language === lang.code ? 'bg-primary-light dark:bg-primary/20 scale-110' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
                                <FlagComponent />
                            </button>
                        )
                    })}
                    <div className="h-6 w-px bg-gray-200 dark:bg-slate-700"></div>
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                    </button>
                </div>
                <a href="#" onClick={(e) => e.preventDefault()}
                    className={`flex items-center p-3 rounded-lg transition-all duration-200 active:scale-95 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
                >
                    <LogoutIcon />
                    <span className={`mx-4 font-semibold text-base`}>{t('sidebar.logout')}</span>
                </a>
            </div>
        </div>
      </nav>
    </ModalPortal>
  );
};

export default MobileSidebar;