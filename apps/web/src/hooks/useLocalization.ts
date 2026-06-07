import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../contexts/DashboardContext';
import type { Language } from '../types';
import i18n, {
  DEFAULT_NAMESPACES,
  type AppNamespace,
  applyLanguageToDocument,
  getDirectionForLanguage,
  resolveNamespaceForKey,
} from '../lib/i18n';
import {
  humanizeTranslationKey,
  isTranslationKey,
  pickLocalizedText,
  type LocalizedText,
} from '../lib/utils';

/**
 * useLocalization - Hook for translation, current language, and bilingual field display.
 */
export const useLocalization = (namespaces: AppNamespace[] = DEFAULT_NAMESPACES) => {
  const { t: baseT, i18n: instance } = useTranslation(namespaces);
  useDashboard();

  const language = (instance.resolvedLanguage === 'ar' ? 'ar' : 'en') as Language;
  const dir = getDirectionForLanguage(language);

  const t = useCallback(
    (key: string, optionsOrDefault?: any) => {
      const normalizedOptions =
        typeof optionsOrDefault === 'string'
          ? { defaultValue: optionsOrDefault }
          : optionsOrDefault ?? {};
      const inferredNamespace = normalizedOptions.ns ? undefined : resolveNamespaceForKey(key);

      const result =
        inferredNamespace != null
          ? instance.t(key, { ns: inferredNamespace, ...normalizedOptions })
          : baseT(key, normalizedOptions);

      if (typeof result === 'string' && result === key && isTranslationKey(key)) {
        return normalizedOptions.defaultValue ?? humanizeTranslationKey(key);
      }

      return result;
    },
    [baseT, instance],
  );

  const pickLocalized = useCallback(
    (value: LocalizedText | string | null | undefined) => pickLocalizedText(value, language),
    [language],
  );

  /** Resolves stored i18n keys (e.g. from API) or returns plain text as-is. */
  const translateMaybeKey = useCallback(
    (value: string | null | undefined) => {
      const trimmed = value?.trim() ?? '';
      if (!trimmed) return '';
      if (!isTranslationKey(trimmed)) return trimmed;
      return t(trimmed, humanizeTranslationKey(trimmed));
    },
    [t],
  );

  /** Sidebar module labels always resolve from the sidebar namespace. */
  const sidebarLabel = useCallback(
    (moduleKey: string, defaultValue?: string) =>
      t(`sidebar.${moduleKey}`, {
        ns: 'sidebar',
        defaultValue: defaultValue ?? moduleKey.replace(/_/g, ' '),
      }),
    [t],
  );

  const setLanguage = useCallback(
    (nextLanguage: Language) => {
      if (instance.resolvedLanguage === nextLanguage) {
        applyLanguageToDocument(nextLanguage);
        return;
      }

      void i18n.changeLanguage(nextLanguage);
    },
    [instance.resolvedLanguage],
  );

  return {
    t,
    sidebarLabel,
    language,
    setLanguage,
    dir,
    pickLocalized,
    translateMaybeKey,
  };
};
