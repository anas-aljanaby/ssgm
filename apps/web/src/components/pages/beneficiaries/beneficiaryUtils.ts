import type { Beneficiary, Language } from '../../../types';

/**
 * Returns a human-readable subtitle for a beneficiary based on their type.
 */
export const getBeneficiarySubtitle = (
    beneficiary: Beneficiary,
    language: Language,
    t: (key: string, options?: Record<string, unknown>) => string
): string => {
    const p = beneficiary.profile;

    switch (p.type) {
        case 'student': {
            const info = p.academicInfo;
            if (info?.field && info?.university) {
                return t('beneficiaries.subtitle_at', { field: info.field, university: info.university });
            }
            return info?.level?.[language] || beneficiary.country;
        }
        case 'orphan': {
            const grade = p.academicInfo?.grade;
            return grade || beneficiary.country;
        }
        case 'hafiz': {
            return p.memorization?.level?.[language] || beneficiary.country;
        }
        case 'family': {
            if (p.memberCount) {
                return t('beneficiaries.familyMembers', { count: p.memberCount });
            }
            return beneficiary.country;
        }
        case 'institution': {
            return p.institutionType
                ? t(`beneficiaries.institutionTypes.${p.institutionType}`, { defaultValue: p.institutionType })
                : beneficiary.country;
        }
        case 'community': {
            return p.areaType
                ? t(`beneficiaries.areaTypes.${p.areaType}`, { defaultValue: p.areaType })
                : beneficiary.country;
        }
        default:
            return beneficiary.country;
    }
};
