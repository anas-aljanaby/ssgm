import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../../hooks/useLocalization';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useOrg } from '../../contexts/OrgContext';
import { SIDEBAR_MODULES, PLATFORM_MODULE } from '../../constants';
import { LogoutIcon } from '../icons/ModuleIcons';
import { ChevronDownIcon } from '../icons/GenericIcons';
import type { RbacModule } from '@gms/shared';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  role?: unknown;
}

const UNGATED_MODULES = new Set(['help']);

const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule }) => {
  const { t, dir } = useLocalization(['common', 'sidebar', 'staff', 'platform']);
  const { signOut } = useAuth();
  const { can, isPlatformAdmin } = usePermissions();
  const { isImpersonating } = useOrg();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem('sidebarExpanded') !== 'false';
  });

  const visibleModules = useMemo(() => {
    const filtered = SIDEBAR_MODULES.filter(module => {
      if (UNGATED_MODULES.has(module.key)) return true;
      return can(module.key as RbacModule, 'read');
    });
    if (!isPlatformAdmin || isImpersonating) return filtered;

    const settingsIndex = filtered.findIndex((module) => module.key === 'settings');
    if (settingsIndex === -1) {
      return [...filtered, PLATFORM_MODULE];
    }

    // Platform console is an infrequent admin utility, so keep it near settings.
    return [
      ...filtered.slice(0, settingsIndex),
      PLATFORM_MODULE,
      ...filtered.slice(settingsIndex),
    ];
  }, [can, isPlatformAdmin, isImpersonating]);

  useEffect(() => {
    const parentMenu = visibleModules.find(m => m.submenu && m.submenu.some((sub: any) => sub.key === activeModule));
    if (parentMenu) {
        setOpenSubmenu(parentMenu.key);
    }
  }, [activeModule, visibleModules]);

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', String(isExpanded));
  }, [isExpanded]);

  const NavItem: React.FC<{ moduleKey: string, icon: React.FC, onClick: () => void, isActive: boolean }> = ({ moduleKey, icon: Icon, onClick, isActive }) => {
    const activeClass = isActive ? 'bg-primary-light/50 dark:bg-primary/20 text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50';
    return (
      <li>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); onClick(); }}
          className={`flex items-center p-3 rounded-lg transition-colors duration-200 overflow-hidden ${activeClass} rtl:flex-row-reverse`}
        >
          <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
            <Icon />
          </div>
          <span className={`mx-4 font-medium whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>{t(`sidebar.${moduleKey}`)}</span>
        </a>
      </li>
    );
  };

  return (
    <nav className={`relative hidden md:flex flex-col h-full bg-card dark:bg-dark-card border-e dark:border-slate-800 transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'} sidebar-nav`}>
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="absolute top-6 -end-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-card text-gray-500 shadow-md transition-colors hover:bg-gray-100 hover:text-primary dark:border-slate-700 dark:bg-dark-card dark:text-gray-300 dark:hover:bg-slate-700"
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={isExpanded}
      >
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? (dir === 'rtl' ? '-rotate-90' : 'rotate-90') : (dir === 'rtl' ? 'rotate-90' : '-rotate-90')}`} />
      </button>
      <div className={`flex items-center h-20 ${isExpanded ? 'px-6' : 'px-4'} transition-all duration-300 border-b dark:border-slate-800 overflow-hidden rtl:flex-row-reverse`}>
        <div className="flex items-center justify-center min-w-[3rem] h-12 bg-gradient-to-br from-primary to-secondary text-white rounded-full flex-shrink-0">
            <span className="text-2xl font-bold">M</span>
        </div>
        <h1 className={`text-xl font-bold text-foreground dark:text-dark-foreground mx-3 whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>MSS.2</h1>
      </div>
      
      <div className={`flex-1 overflow-y-auto ${isExpanded ? 'p-4' : 'p-2'} transition-all duration-300`}>
        <ul className="space-y-1">
          {visibleModules.map((module) => {
            if (module.submenu) {
              const isSubmenuOpen = openSubmenu === module.key;
              const isActive = module.submenu.some((sub: any) => sub.key === activeModule);
              const Icon = module.icon;
              return (
                <li key={module.key}>
                  <button
                    onClick={() => {
                      if (!isExpanded) {
                        setIsExpanded(true);
                        setOpenSubmenu(module.key);
                        return;
                      }
                      setOpenSubmenu(isSubmenuOpen ? null : module.key);
                    }}
                    className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 text-left rtl:flex-row-reverse ${isActive ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'} hover:bg-gray-100 dark:hover:bg-gray-700/50`}
                  >
                    <div className="flex items-center justify-center w-6 h-6 flex-shrink-0"><Icon /></div>
                    <span className={`mx-4 font-medium whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>{t(`sidebar.${module.key}`)}</span>
                    <ChevronDownIcon className={`w-4 h-4 ms-auto flex-shrink-0 transition-all ${isExpanded ? 'opacity-100' : 'opacity-0'} ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isExpanded && isSubmenuOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ps-8 rtl:ps-0 rtl:pe-8 pt-1 space-y-1"
                      >
                        {module.submenu.map((subItem: any) => (
                          <li key={subItem.key}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setActiveModule(subItem.key); }}
                                className={`block p-2 rounded-md text-sm font-medium ${activeModule === subItem.key ? 'bg-primary-light/50 text-primary-dark dark:bg-primary/20 dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                            >
                              {t(`sidebar.${subItem.key}`)}
                            </a>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            } else {
              return <NavItem key={module.key} moduleKey={module.key} icon={module.icon} isActive={activeModule === module.key} onClick={() => setActiveModule(module.key)} />;
            }
          })}
        </ul>
      </div>

      <div className={`${isExpanded ? 'p-4' : 'p-2'} transition-all duration-300 border-t dark:border-slate-800`}>
        <ul className="space-y-2">
            <NavItem
              moduleKey="logout"
              icon={LogoutIcon}
              isActive={false}
              onClick={() => { void signOut(); }}
            />
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
