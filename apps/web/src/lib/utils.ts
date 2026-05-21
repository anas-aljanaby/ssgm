
import type { DateFormat, Language, TimeFormat } from '../types';

// --- Caching for Intl Formatters ---
const numberFormatCache = new Map<string, Intl.NumberFormat>();
const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();
const relativeTimeFormatCache = new Map<string, Intl.RelativeTimeFormat>();

// --- Global format settings (synced from DashboardContext) ---
// Using -u-nu-latn extension forces Latin (Western) digits for all locales.
let _dateFormat: DateFormat = 'gregorian';
let _timeFormat: TimeFormat = '12h';

export const setFormatSettings = (dateFormat: DateFormat, timeFormat: TimeFormat) => {
    if (_dateFormat !== dateFormat || _timeFormat !== timeFormat) {
        _dateFormat = dateFormat;
        _timeFormat = timeFormat;
        dateTimeFormatCache.clear();
    }
};

// ar-SA-u-nu-latn: Arabic locale with Latin (0-9) digits forced via Unicode extension.
const getLocale = (language: Language): string => {
    return language === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US';
};

export const formatNumber = (num: number, language: Language, options: Intl.NumberFormatOptions = {}): string => {
    const locale = getLocale(language);
    const cacheKey = `${locale}-${JSON.stringify(options)}`;

    try {
        if (!numberFormatCache.has(cacheKey)) {
            numberFormatCache.set(cacheKey, new Intl.NumberFormat(locale, { ...options }));
        }
        return numberFormatCache.get(cacheKey)!.format(num);
    } catch (error) {
        console.error("Error formatting number:", error);
        return String(num);
    }
};

export const formatCurrency = (amount: number, language: Language, currency: string = 'USD'): string => {
    const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    if (currency === 'USD' && (amount % 1 === 0)) {
        options.minimumFractionDigits = 0;
        options.maximumFractionDigits = 0;
    }
    return formatNumber(amount, language, options);
};

export const formatPercentage = (value: number, language: Language, options: Intl.NumberFormatOptions = {}): string => {
    const finalOptions: Intl.NumberFormatOptions = {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
        ...options,
    };
    return formatNumber(value, language, finalOptions);
};

type DateFormatPreset = 'short' | 'medium' | 'long' | 'full';

// dateFormat param is optional — falls back to the global _dateFormat set by DashboardContext.
export const formatDate = (
    dateString: string,
    language: Language,
    format: DateFormatPreset | Intl.DateTimeFormatOptions = 'medium',
    dateFormat?: DateFormat
): string => {
    if (!dateString) return 'N/A';

    const effectiveDateFormat = dateFormat ?? _dateFormat;
    const locale = getLocale(language);
    const date = new Date(dateString);

    let options: Intl.DateTimeFormatOptions;
    if (typeof format === 'string') {
        const presets: Record<DateFormatPreset, Intl.DateTimeFormatOptions> = {
            short: { year: '2-digit', month: 'numeric', day: 'numeric' },
            medium: { year: 'numeric', month: 'short', day: 'numeric' },
            long: { year: 'numeric', month: 'long', day: 'numeric' },
            full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        };
        options = presets[format] || presets['medium'];
    } else {
        options = format;
    }

    const finalOptions: Intl.DateTimeFormatOptions & Record<string, any> = { ...options };
    if (effectiveDateFormat === 'hijri') {
        finalOptions.calendar = 'islamic-umalqura';
    }

    const cacheKey = `${locale}-${JSON.stringify(finalOptions)}`;

    try {
        if (!dateTimeFormatCache.has(cacheKey)) {
            dateTimeFormatCache.set(cacheKey, new Intl.DateTimeFormat(locale, finalOptions));
        }
        return dateTimeFormatCache.get(cacheKey)!.format(date);
    } catch (error) {
        console.error("Error formatting date:", error);
        return date.toLocaleDateString();
    }
};

// timeFormat param is optional — falls back to the global _timeFormat set by DashboardContext.
export const formatTime = (timeString: string, language: Language, timeFormat?: TimeFormat): string => {
    if (!timeString) return 'N/A';

    const effectiveTimeFormat = timeFormat ?? _timeFormat;
    const locale = getLocale(language);
    let date: Date;

    if (timeString.includes('T') || (timeString.includes('-') && timeString.length > 5)) {
        date = new Date(timeString);
    } else {
        const [hours, minutes] = timeString.split(':').map(Number);
        date = new Date();
        date.setHours(hours, minutes, 0, 0);
    }

    const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: effectiveTimeFormat === '12h',
    };

    const cacheKey = `${locale}-time-${effectiveTimeFormat}`;

    try {
        if (!dateTimeFormatCache.has(cacheKey)) {
            dateTimeFormatCache.set(cacheKey, new Intl.DateTimeFormat(locale, options));
        }
        return dateTimeFormatCache.get(cacheKey)!.format(date);
    } catch (error) {
        console.error("Error formatting time:", error);
        return timeString;
    }
};

const DIVISIONS: { amount: number; name: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, name: 'seconds' },
    { amount: 60, name: 'minutes' },
    { amount: 24, name: 'hours' },
    { amount: 7, name: 'days' },
    { amount: 4.34524, name: 'weeks' },
    { amount: 12, name: 'months' },
    { amount: Number.POSITIVE_INFINITY, name: 'years' },
];

/** True when the value is an accounting date (no event clock), e.g. `2025-05-21` or midnight UTC ISO. */
export const isAccountingDateOnly = (dateString: string): boolean => {
    const trimmed = dateString.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return true;
    if (!trimmed.includes('T') && !trimmed.includes(' ')) return true;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return false;
    return (
        parsed.getUTCHours() === 0 &&
        parsed.getUTCMinutes() === 0 &&
        parsed.getUTCSeconds() === 0 &&
        parsed.getUTCMilliseconds() === 0
    );
};

const getRelativeTimeFormatter = (language: Language) => {
    const locale = getLocale(language);
    const cacheKey = `${locale}-numeric`;
    if (!relativeTimeFormatCache.has(cacheKey)) {
        relativeTimeFormatCache.set(cacheKey, new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }));
    }
    return relativeTimeFormatCache.get(cacheKey)!;
};

/** Relative label for a real timestamp (includes hours/minutes when recent). */
export const formatRelativeTime = (dateString: string, language: Language): string => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const now = new Date();
    let duration = (date.getTime() - now.getTime()) / 1000;

    try {
        const formatter = getRelativeTimeFormatter(language);

        for (let i = 0; i < DIVISIONS.length; i++) {
            const division = DIVISIONS[i];
            if (Math.abs(duration) < division.amount) {
                return formatter.format(Math.round(duration), division.name);
            }
            duration /= division.amount;
        }
        return date.toLocaleDateString();
    } catch (error) {
        console.error('Error formatting relative time:', error);
        return date.toLocaleDateString();
    }
};

/**
 * Relative label for UI events. Accounting dates (donation `date`) use day granularity
 * (today / yesterday), never hours. Full timestamps use `formatRelativeTime`.
 */
/** Convert a date input (`YYYY-MM-DD`) to an ISO timestamp for storage/display. */
export const occurredAtFromDateInput = (dateInput: string): string => {
    const trimmed = dateInput.trim();
    if (!trimmed) return new Date().toISOString();

    const now = new Date();
    const todayKey = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('-');

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        if (trimmed === todayKey) return new Date().toISOString();
        const [year, month, day] = trimmed.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString();
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

export const formatRelativeFromEvent = (dateString: string, language: Language): string => {
    if (!dateString) return 'N/A';
    if (!isAccountingDateOnly(dateString)) {
        return formatRelativeTime(dateString, language);
    }

    const trimmed = dateString.trim().slice(0, 10);
    const [year, month, day] = trimmed.split('-').map(Number);
    if (!year || !month || !day) return 'N/A';

    const eventDay = new Date(year, month - 1, day);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((eventDay.getTime() - todayStart.getTime()) / 86400000);

    try {
        const formatter = getRelativeTimeFormatter(language);
        if (Math.abs(diffDays) <= 7) {
            return formatter.format(diffDays, 'day');
        }
        return formatDate(trimmed, language);
    } catch (error) {
        console.error('Error formatting relative event time:', error);
        return formatDate(trimmed, language);
    }
};

export const getDonorCategoryLabel = (category: string, t: (key: string, fallback?: string) => string): string => {
    if (!category) return '';
    const categoryKey = category.replace(/ /g, '');
    return t(`donorIntelligence.categories.${categoryKey}`, category);
};
