import type { Project } from '../../../../types';

const ARABIC_DIGIT_MAP: Record<string, string> = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
};

/** Extract the first integer from text that may use Arabic or Western numerals. */
export function parseNumericTarget(text: string): number {
    if (!text.trim()) return 0;
    const westernized = text.replace(/[٠-٩]/g, (char) => ARABIC_DIGIT_MAP[char] ?? char);
    const match = westernized.replace(/,/g, '').match(/\d+/);
    return match ? Number.parseInt(match[0], 10) : 0;
}

/** Prefer a numeric project KPI target, then parse the stakeholders description string. */
export function resolveProjectBeneficiaryTarget(project: Project): number {
    const numericKpi = project.kpis?.find((kpi) => kpi.unit === 'number' && kpi.target?.trim());
    if (numericKpi?.target) {
        const fromKpi = parseNumericTarget(numericKpi.target);
        if (fromKpi > 0) return fromKpi;
    }
    return parseNumericTarget(project.stakeholders.targetBeneficiaries);
}
