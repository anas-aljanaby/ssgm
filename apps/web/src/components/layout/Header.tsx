import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { Language } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { useTheme } from '../../hooks/useTheme';
import { useOrg } from '../../contexts/OrgContext';
import { usePermissions } from '../../hooks/usePermissions';
import { usePlatformOrgs } from '../../hooks/usePlatform';
import { SUPPORTED_LANGUAGES } from '../../lib/i18n';
import { SunIcon, MoonIcon, GlobeIcon, ChevronDownIcon, HamburgerIcon } from '../icons/GenericIcons';
import { Bell, Lightbulb } from 'lucide-react';
import { langToFlag } from '../icons/FlagIcons';
import GlobalSearch from '../common/GlobalSearch';
import LiveIndicator, { LiveIndicatorStatus } from '../common/LiveIndicator';
import AnnouncementsModal from './AnnouncementsModal';
import { MOCK_ANNOUNCEMENTS } from '../../data/announcementsData';
import Tooltip from '../common/Tooltip';

interface HeaderProps {
  role?: unknown;
  setRole?: unknown;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  enabledLanguages: Language[];
  setActiveModule: (module: string) => void;
}


/**
 * Header - مكون الترويسة العلوي للتطبيق.
 * يعرض عنوان الصفحة، أدوات التحكم العامة مثل البحث، تبديل اللغة والنسق، وملف المستخدم.
 * 
 * @component
 * @param {HeaderProps} props - الخصائص.
 * @returns {JSX.Element} - مكون React
 * 
 * @example
 * <Header 
 *   role="Admin"
 *   setRole={setRole}
 *   isMobileMenuOpen={false}
 *   setIsMobileMenuOpen={setIsOpen}
 *   enabledLanguages={['en', 'ar']}
 * />
 */
const Header: React.FC<HeaderProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen, enabledLanguages, setActiveModule }) => {
  const { t, language, setLanguage } = useLocalization(['common', 'header', 'sidebar', 'misc', 'staff', 'platform']);
  const { theme, toggleTheme } = useTheme();
  const { orgs, activeOrgId, activeOrgName, isImpersonating, isPlatformAdmin, setActiveOrg } = useOrg();
  const { data: platformOrgs = [] } = usePlatformOrgs();
  const { role } = usePermissions();

  const switchableOrgs = useMemo(() => {
    if (!isPlatformAdmin) return orgs;
    const memberIds = new Set(orgs.map((o) => o.id));
    const extras = platformOrgs
      .filter((o) => !memberIds.has(o.id))
      .map((o) => ({ id: o.id, name: o.name }));
    return [...orgs, ...extras].sort((a, b) => a.name.localeCompare(b.name));
  }, [orgs, platformOrgs, isPlatformAdmin]);

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [dataStatus, setDataStatus] = useState<LiveIndicatorStatus>('live');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const langDropdownRef = useRef<HTMLDivElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);

  const availableLanguages = useMemo(() => 
    SUPPORTED_LANGUAGES.filter(lang => enabledLanguages.includes(lang.code)),
    [enabledLanguages]
  );
  
  const quickHelpTitle = t('sidebar.help');

  const newAnnouncementsCount = useMemo(() => MOCK_ANNOUNCEMENTS.filter(a => a.isNew).length, []);

  // Simulate status changes for demo
  useEffect(() => {
      const statuses: LiveIndicatorStatus[] = ['live', 'delayed', 'updating', 'live', 'offline'];
      let i = 0;
      const interval = setInterval(() => {
          i = (i + 1) % statuses.length;
          const currentStatus = statuses[i];
          setDataStatus(currentStatus);

          if (currentStatus === 'updating') {
              setTimeout(() => {
                  setDataStatus('live');
                  setLastUpdate(new Date());
              }, 2000); // simulate update taking 2s
          } else if (currentStatus === 'live') {
               setLastUpdate(new Date());
          }
      }, 5000); // Change status every 5 seconds

      return () => clearInterval(interval);
  }, []);

  /**
   * handleRefresh - دالة لمحاكاة تحديث البيانات يدويًا.
   */
  const handleRefresh = useCallback(() => {
      setDataStatus('updating');
      setTimeout(() => {
          setDataStatus('live');
          setLastUpdate(new Date());
      }, 1500); // simulate refresh
  }, []);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setOrgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModuleKey = window.location.hash.substring(1).split('/')[0] || 'dashboard';
  
  const pageTitle = useMemo(() => {
    // A simple lookup in the translation file is sufficient now
    return t(`sidebar.${activeModuleKey}`, activeModuleKey.replace(/_/g, ' '));
  }, [activeModuleKey, t]);
  
  const CurrentFlag = langToFlag[language];

  return (
    <>
      <header className="flex-shrink-0 h-20 bg-card/80 dark:bg-dark-card/80 backdrop-blur-xl border-b dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40 w-full">
        <div className="flex items-center min-w-0 flex-1 gap-3 lg:gap-6">
          <button
            className="md:hidden p-2 rounded-md text-foreground dark:text-dark-foreground -ms-2 me-2 shrink-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
              <HamburgerIcon isOpen={isMobileMenuOpen} />
          </button>
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <h1 className="text-xl font-bold text-foreground dark:text-dark-foreground whitespace-nowrap">{pageTitle}</h1>
            <LiveIndicator status={dataStatus} lastUpdate={lastUpdate} onRefresh={handleRefresh} />
          </div>
          <div className="min-w-0 flex-1 max-w-xs">
            <GlobalSearch />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 header-controls">
           {/* Help Quick Access */}
          <Tooltip text={quickHelpTitle} align="left">
            <button
              onClick={() => setActiveModule('help')}
              className="relative hidden sm:flex items-center justify-center p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              aria-label={quickHelpTitle}
            >
              <Lightbulb size={20} className="text-amber-500" />
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            </button>
          </Tooltip>

          {/* Language Switcher */}
          <div className="relative" ref={langDropdownRef}>
              <button onClick={() => setLangDropdownOpen(!langDropdownOpen)} className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" aria-expanded={langDropdownOpen} aria-haspopup="true" aria-label="Change language">
                  <GlobeIcon />
                  <CurrentFlag />
              </button>
              {langDropdownOpen && (
                  <div className="absolute end-0 mt-2 w-40 origin-top-right bg-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 focus:outline-none animate-scale-in-fast">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                          {availableLanguages.map(lang => {
                              const FlagComponent = langToFlag[lang.code];
                              return (
                                  <a href="#" key={lang.code} onClick={(e) => { e.preventDefault(); setLanguage(lang.code); setLangDropdownOpen(false); }} className={`flex items-center gap-3 px-4 py-2 text-sm ${language === lang.code ? 'font-bold text-primary' : 'text-foreground dark:text-dark-foreground'} hover:bg-gray-100 dark:hover:bg-slate-700`} role="menuitem">
                                      <FlagComponent />
                                      <span>{lang.name}</span>
                                  </a>
                              );
                          })}
                      </div>
                  </div>
              )}
          </div>
          
          {/* Theme Toggler */}
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>

          {/* Announcements */}
          <div className="relative">
              <button onClick={() => setAnnouncementsOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" aria-label="View announcements">
                  <Bell className="w-6 h-6" />
              </button>
              {newAnnouncementsCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
              )}
          </div>


          {/* Profile / Org Dropdown */}
          <div className="relative" ref={orgDropdownRef}>
              <button onClick={() => setOrgDropdownOpen(!orgDropdownOpen)} className="flex items-center space-x-2" aria-expanded={orgDropdownOpen} aria-haspopup="true">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      {(activeOrgName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col items-start rtl:items-end">
                      <span className="font-semibold text-sm truncate max-w-[120px]">{activeOrgName || t('header.greeting')}</span>
                      <span className="text-xs text-gray-500">{role ? t(`staff.roles.${role}`) : ''}</span>
                  </div>
                  <ChevronDownIcon className={`transition-transform duration-200 ${orgDropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>
              {orgDropdownOpen && (
                   <div className="absolute end-0 mt-2 w-56 origin-top-right bg-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 animate-scale-in-fast">
                      {switchableOrgs.length > 1 && (
                          <div className="py-1 border-b dark:border-slate-700" role="menu">
                              <div className="px-4 pt-2 pb-1 text-xs uppercase text-gray-400">{t('header.switch_org', 'Switch Organization')}</div>
                              {switchableOrgs.map((o) => {
                                  const isActive = activeOrgId === o.id;
                                  const isMember = orgs.some((m) => m.id === o.id);
                                  return (
                                  <a href="#" key={o.id} onClick={(e) => { e.preventDefault(); setActiveOrg(o.id, isMember ? undefined : o.name); setOrgDropdownOpen(false); }} className={`block px-4 py-2 text-sm ${isActive ? 'font-bold text-primary' : 'text-foreground dark:text-dark-foreground'} hover:bg-gray-100 dark:hover:bg-slate-700`} role="menuitem">
                                      {o.name}
                                  </a>
                                  );
                              })}
                          </div>
                      )}
                      {isPlatformAdmin && (
                          <div className="py-1">
                              <a href="#" onClick={(e) => { e.preventDefault(); setActiveModule('platform'); setOrgDropdownOpen(false); }} className="block px-4 py-2 text-sm text-foreground dark:text-dark-foreground hover:bg-gray-100 dark:hover:bg-slate-700" role="menuitem">
                                  {t('platform.title', 'Platform Console')}
                              </a>
                          </div>
                      )}
                  </div>
              )}
          </div>
        </div>
      </header>
      <AnnouncementsModal isOpen={announcementsOpen} onClose={() => setAnnouncementsOpen(false)} />
      {isImpersonating && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-amber-500 text-amber-950 text-sm font-medium">
              <span>{t('platform.impersonation_banner', { org: activeOrgName || '' })}</span>
              <button
                  onClick={() => { setActiveOrg(null); setActiveModule('platform'); }}
                  className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
              >
                  {t('platform.exit')}
              </button>
          </div>
      )}
    </>
  );
};

export default Header;
