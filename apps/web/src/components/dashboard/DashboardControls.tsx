import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { Calendar, Building, BarChart3, RefreshCw, ChevronDown, Check, Search, PlusCircle, Mail, Settings, HelpCircle } from 'lucide-react';
import { WrenchIcon } from '../icons/GenericIcons';
import ExportMenu from './ExportMenu';
import ShareMenu from './ShareMenu';
import Tooltip from '../common/Tooltip';


// Types
type TimePeriod = 'd7' | 'd30' | 'thisMonth' | 'thisQuarter' | 'thisYear';
type Department = 'all' | 'programs' | 'finance' | 'hr' | 'marketing';
type Kpi = 'donorRetention' | 'newDonors' | 'avgGift' | 'campaignROI' | 'projectSuccess' | 'volunteerTurnover';

export interface FilterState {
  timePeriod: TimePeriod;
  department: Department;
  indicators: Kpi[];
  autoRefresh: boolean;
}

interface DashboardControlsProps {
  onFilterChange: (filters: FilterState) => void;
  defaultValues?: Partial<FilterState>;
  onCustomizeClick: () => void;
  setActiveModule: (module: string) => void;
  dashboardRef: React.RefObject<HTMLDivElement>;
}

const STORAGE_KEY = 'dashboard-filters';

// --- SUB-COMPONENTS ---

const QuickActionsMenu: React.FC<{ setActiveModule: (module: string) => void }> = ({ setActiveModule }) => {
    const { t } = useLocalization();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const actions = [
        { id: 'addProject', labelKey: 'quick_actions.addProject', icon: PlusCircle, targetModule: 'projects' },
        { id: 'createReport', labelKey: 'quick_actions.createReport', icon: BarChart3, targetModule: 'reports' },
        { id: 'sendMessage', labelKey: 'quick_actions.sendMessage', icon: Mail, targetModule: 'digital_marketing' },
        { id: 'settings', labelKey: 'quick_actions.settings', icon: Settings, targetModule: 'settings' },
    ];

    const handleActionClick = (targetModule: string) => {
        setActiveModule(targetModule);
        setIsOpen(false);
    };

    return (
        <div ref={menuRef} className="relative inline-block text-left">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-full items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
            >
                {t('quick_actions.title')}
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="origin-top-right absolute end-0 mt-2 w-56 rounded-md shadow-lg bg-card dark:bg-dark-card ring-1 ring-black ring-opacity-5 z-20 animate-scale-in-fast">
                    <div className="py-1" role="menu">
                        {actions.map(({ id, labelKey, icon: Icon, targetModule }) => (
                            <a
                                key={id}
                                href={`#${targetModule}`}
                                onClick={(e) => { e.preventDefault(); handleActionClick(targetModule); }}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-foreground dark:text-dark-foreground hover:bg-gray-100 dark:hover:bg-slate-700"
                                role="menuitem"
                            >
                                <Icon className="w-5 h-5 text-primary dark:text-secondary" />
                                {t(labelKey)}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; id?: string }> = ({ checked, onChange, id }) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`${checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}
    >
        {checked && <Check className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />}
      <span
        aria-hidden="true"
        className={`${checked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
};

// --- MAIN COMPONENT ---
const DashboardControls: React.FC<DashboardControlsProps> = ({ onFilterChange, defaultValues, onCustomizeClick, setActiveModule, dashboardRef }) => {
  const { t, dir } = useLocalization(['common', 'dashboard', 'misc']);

  const defaultInitialState: FilterState = {
    timePeriod: 'd30',
    department: 'all',
    indicators: ['donorRetention', 'newDonors', 'projectSuccess'],
    autoRefresh: true,
  };

  const getInitialState = (): FilterState => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FilterState>;
        const indicators = Array.isArray(parsed.indicators)
          ? parsed.indicators
          : defaultInitialState.indicators;
        return { ...defaultInitialState, ...parsed, indicators };
      }
    } catch (e) {
      console.error("Failed to parse filters from localStorage", e);
    }
    return { ...defaultInitialState, ...defaultValues };
  };

  const [filters, setFilters] = useState<FilterState>(getInitialState);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [indicatorSearch, setIndicatorSearch] = useState('');
  
  const dropdownsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    onFilterChange(filters);
  }, [filters, onFilterChange]);
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownsRef.current && !dropdownsRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timePeriodOptions = useMemo(() => Object.keys(t('dashboard.controls.periods', {returnObjects: true})).map(key => ({ value: key, label: t(`dashboard.controls.periods.${key}`) })), [t]);
  const departmentOptions = useMemo(() => Object.keys(t('dashboard.controls.departments', {returnObjects: true})).map(key => ({ value: key, label: t(`dashboard.controls.departments.${key}`) })), [t]);
  const kpiOptions = useMemo(() => Object.keys(t('dashboard.controls.kpis', {returnObjects: true})).map(key => ({ value: key, label: t(`dashboard.controls.kpis.${key}`) })), [t]);

  const filteredKpiOptions = useMemo(() => kpiOptions.filter(opt => opt.label.toLowerCase().includes(indicatorSearch.toLowerCase())), [kpiOptions, indicatorSearch]);
  const selectedIndicatorCount = filters.indicators.length;
  
  const handleIndicatorToggle = (kpi: Kpi) => {
    setFilters(prev => {
        const newIndicators = new Set(prev.indicators);
        if (newIndicators.has(kpi)) {
            newIndicators.delete(kpi);
        } else {
            newIndicators.add(kpi);
        }
        return {...prev, indicators: Array.from(newIndicators)};
    });
  }

  const renderDropdown = (name: string, icon: React.ReactNode, options: {value: string, label: string}[], currentValue: string, onSelect: (value: any) => void) => (
    <div className="relative">
      <button onClick={() => setOpenDropdown(openDropdown === name ? null : name)} className="w-full flex items-center justify-between p-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800">
        <span className="flex items-center gap-2">
          {icon}
          {options.find(o => o.value === currentValue)?.label}
        </span>
        <ChevronDown size={16} />
      </button>
      {openDropdown === name && (
        <div className="absolute z-10 mt-1 w-full bg-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <ul className="py-1">
            {options.map(opt => (
              <li key={opt.value}>
                <a href="#" onClick={e => { e.preventDefault(); onSelect(opt.value); setOpenDropdown(null); }} className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">{opt.label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
  
  return (
    <div ref={dropdownsRef} className="bg-card dark:bg-dark-card p-2 rounded-xl shadow-soft dashboard-controls">
      <div className="flex flex-col md:flex-row items-center gap-2">
        <div className="flex items-center gap-2">
            {renderDropdown('timePeriod', <Calendar size={16} />, timePeriodOptions, filters.timePeriod, (v) => setFilters(f => ({...f, timePeriod: v})))}
            {renderDropdown('department', <Building size={16} />, departmentOptions, filters.department, (v) => setFilters(f => ({...f, department: v})))}
             <div className="relative w-full md:w-auto flex items-center gap-1">
              <button onClick={() => setOpenDropdown(openDropdown === 'indicators' ? null : 'indicators')} className="w-full flex items-center justify-between p-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800">
                  <span className="flex items-center gap-2">
                      <BarChart3 size={16} />
                      {t('dashboard.controls.indicatorsWithCount', {
                        count: selectedIndicatorCount,
                        defaultValue: `Indicators (${selectedIndicatorCount} selected)`,
                      })}
                  </span>
                  <ChevronDown size={16} />
              </button>
              <Tooltip text={t('help.contextual.indicators')}>
                <HelpCircle size={16} className="text-gray-400 cursor-help" />
              </Tooltip>
              {openDropdown === 'indicators' && (
                  <div className="absolute z-10 mt-1 w-full md:w-72 bg-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="p-2 border-b dark:border-slate-700">
                          <div className="relative">
                              <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${dir === 'rtl' ? 'right-2' : 'left-2'}`} />
                              <input type="text" value={indicatorSearch} onChange={e => setIndicatorSearch(e.target.value)} placeholder={t('dashboard.controls.searchIndicators')} className={`w-full p-1.5 text-sm border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-600 ${dir === 'rtl' ? 'pr-8' : 'pl-8'}`} />
                          </div>
                      </div>
                      <ul className="py-1 max-h-60 overflow-y-auto">
                          {filteredKpiOptions.map(opt => (
                              <li key={opt.value}>
                                  <label className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer">
                                      <input type="checkbox" checked={filters.indicators.includes(opt.value as Kpi)} onChange={() => handleIndicatorToggle(opt.value as Kpi)} className="w-4 h-4 text-primary rounded focus:ring-primary dark:bg-slate-700 dark:border-slate-500"/>
                                      {opt.label}
                                  </label>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>
        </div>

        <div className="flex-grow"></div>

        <div className="flex items-center gap-2">
          <QuickActionsMenu setActiveModule={setActiveModule} />
          <ShareMenu dashboardId="main-dashboard" />
          <ExportMenu dashboardRef={dashboardRef} filename="dashboard-report" participantData={[]} />
          <button onClick={onCustomizeClick} title={t('layoutCustomizer.title')} className="p-2 h-full rounded-lg border dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <WrenchIcon className="w-5 h-5"/>
          </button>
          <div className="flex items-center gap-2 ps-2 border-s dark:border-slate-600">
              <ToggleSwitch id="auto-refresh-toggle" checked={filters.autoRefresh} onChange={(c) => setFilters(f => ({...f, autoRefresh: c}))} />
              <label htmlFor="auto-refresh-toggle" className="text-sm font-medium whitespace-nowrap">{t('dashboard.controls.autoRefresh')}</label>
              <RefreshCw size={16} className={filters.autoRefresh ? 'animate-spin' : ''} style={{ animationDuration: '5s' }}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardControls;