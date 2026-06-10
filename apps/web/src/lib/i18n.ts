import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import type { Language, LanguageOption, Direction } from '../types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
];

export const ALL_NAMESPACES = [
  'common',
  'sidebar',
  'header',
  'dashboard',
  'donors',
  'individual_donors',
  'institutional_donors',
  'beneficiaries',
  'projects',
  'bousala',
  'leadership',
  'stakeholders',
  'financials',
  'settings',
  'staff',
  'partners',
  'platform',
  'misc',
] as const;

export type AppNamespace = (typeof ALL_NAMESPACES)[number];

export const ALWAYS_LOADED_NAMESPACES: AppNamespace[] = ['common', 'sidebar', 'header', 'misc', 'staff', 'platform'];
export const DEFAULT_NAMESPACES: AppNamespace[] = ALWAYS_LOADED_NAMESPACES;

export const NAMESPACE_BY_ROOT_KEY: Record<string, AppNamespace> = {
  common: 'common',
  sidebar: 'sidebar',
  header: 'header',
  dashboard: 'dashboard',
  kpiCard: 'dashboard',
  donors: 'donors',
  donorManagement: 'donors',
  donorIntelligence: 'donors',
  individual_donors: 'individual_donors',
  institutional_donors: 'institutional_donors',
  beneficiaries: 'beneficiaries',
  projects: 'projects',
  reporting: 'projects',
  bousala: 'bousala',
  leadership: 'leadership',
  qualificationJourney: 'leadership',
  stakeholder_management: 'stakeholders',
  incubation_stakeholders: 'stakeholders',
  incubation_investors: 'stakeholders',
  incubationSuccessMetrics: 'stakeholders',
  settings: 'settings',
  staff: 'staff',
  roles: 'staff',
  partners: 'partners',
  platform: 'platform',
  financials: 'financials',
  financialSettings: 'settings',
  layoutCustomizer: 'settings',
  translations: 'settings',
  exportMenu: 'settings',
  shareMenu: 'settings',
  help: 'misc',
  quick_actions: 'misc',
  toasts: 'misc',
  onboarding: 'misc',
  sdg_analytics: 'misc',
  matrix: 'misc',
  placeholder: 'misc',
  emptyState: 'misc',
};

const STORAGE_KEY = 'dashboardState';
const DEFAULT_LANGUAGE: Language = 'ar';

const normalizeLanguage = (value: string | null | undefined): Language =>
  value === 'ar' ? 'ar' : 'en';

export const getDirectionForLanguage = (language: Language): Direction =>
  SUPPORTED_LANGUAGES.find((option) => option.code === language)?.dir ?? 'ltr';

export const applyLanguageToDocument = (language: Language) => {
  document.documentElement.lang = language;
  document.documentElement.dir = getDirectionForLanguage(language);
};

const getStoredLanguage = (): Language => {
  try {
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (!storedState) {
      return DEFAULT_LANGUAGE;
    }

    const parsed = JSON.parse(storedState) as { language?: string };
    return normalizeLanguage(parsed.language);
  } catch (error) {
    console.error('Failed to restore saved language:', error);
    return DEFAULT_LANGUAGE;
  }
};

export const resolveNamespaceForKey = (key: string): AppNamespace | undefined => {
  // Sidebar labels always live in the sidebar namespace (e.g. sidebar.staff).
  if (key.startsWith('sidebar.')) return 'sidebar';
  const [rootKey] = key.split('.');
  return NAMESPACE_BY_ROOT_KEY[rootKey];
};

const initialLanguage = getStoredLanguage();

void i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map(({ code }) => code),
    ns: ALWAYS_LOADED_NAMESPACES,
    defaultNS: 'common',
    fallbackNS: 'common',
    backend: {
      loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/{{ns}}.json`,
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  });

applyLanguageToDocument(initialLanguage);
i18n.on('languageChanged', (language) => {
  applyLanguageToDocument(normalizeLanguage(language));
});

export default i18n;
