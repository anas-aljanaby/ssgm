import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { Role, Language } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import { useTheme } from '../../hooks/useTheme';
import { SUPPORTED_LANGUAGES } from '../../lib/i18n';
import { USER_ROLES } from '../../constants';
import { SunIcon, MoonIcon, GlobeIcon, ChevronDownIcon, HamburgerIcon } from '../icons/GenericIcons';
import { Bell, Lightbulb } from 'lucide-react';
import { langToFlag } from '../icons/FlagIcons';
import GlobalSearch from '../common/GlobalSearch';
import LiveIndicator, { LiveIndicatorStatus } from '../common/LiveIndicator';
import AnnouncementsModal from './AnnouncementsModal';
import { MOCK_ANNOUNCEMENTS } from '../../data/announcementsData';
import Tooltip from '../common/Tooltip';

interface HeaderProps {
  role: Role;
  setRole: (role: Role) => void;
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
const Header: React.FC<HeaderProps> = ({ role, setRole, isMobileMenuOpen, setIsMobileMenuOpen, enabledLanguages, setActiveModule }) => {
  const { t, language, setLanguage } = useLocalization(['common', 'header', 'sidebar', 'misc']);
  const { theme, toggleTheme } = useTheme();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [dataStatus, setDataStatus] = useState<LiveIndicatorStatus>('live');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

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
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
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


          {/* Profile Dropdown */}
          <div className="relative" ref={roleDropdownRef}>
              <button onClick={() => setRoleDropdownOpen(!roleDropdownOpen)} className="flex items-center space-x-2" aria-expanded={roleDropdownOpen} aria-haspopup="true">
                  <img src="https://picsum.photos/id/1005/100/100" alt="User" className="w-10 h-10 rounded-full" loading="lazy"/>
                  <div className="hidden sm:flex flex-col items-start rtl:items-end">
                      <span className="font-semibold text-sm">{t('header.greeting')}!</span>
                      <span className="text-xs text-gray-500">{role}</span>
                  </div>
                  <ChevronDownIcon className={`transition-transform duration-200 ${roleDropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>
              {roleDropdownOpen && (
                   <div className="absolute end-0 mt-2 w-48 origin-top-right bg-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 animate-scale-in-fast">
                      <div className="px-4 py-3 border-b dark:border-slate-700">
                          <p className="text-sm font-semibold">{t('header.profile.name')}</p>
                          <p className="text-xs text-gray-500 truncate">{t('header.profile.email')}</p>
                      </div>
                      <div className="py-1" role="menu" aria-orientation="vertical">
                          <div className="px-4 pt-2 pb-1 text-xs uppercase text-gray-400">{t('header.role')}</div>
                           {USER_ROLES.map(r => (
                              <a href="#" key={r} onClick={(e) => { e.preventDefault(); setRole(r); setRoleDropdownOpen(false); }} className={`block px-4 py-2 text-sm ${role === r ? 'font-bold text-primary' : 'text-foreground dark:text-dark-foreground'} hover:bg-gray-100 dark:hover:bg-slate-700`} role="menuitem">
                                  {r}
                              </a>
                          ))}
                      </div>
                  </div>
              )}
          </div>
        </div>
      </header>
      <AnnouncementsModal isOpen={announcementsOpen} onClose={() => setAnnouncementsOpen(false)} />
    </>
  );
};

export default Header;
