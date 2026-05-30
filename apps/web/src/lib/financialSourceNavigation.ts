import type { ApprovalItem, Disbursement } from '../types/financials';
import { openBeneficiaryAidLog } from './moduleNavigation';

export type FinancialSourceRoute = {
    beneficiaryId: string;
    highlightDisbursementId?: string;
};

export function getDisbursementSourceRoute(disbursement: Disbursement): FinancialSourceRoute | null {
    if (!disbursement.beneficiaryId) return null;
    return {
        beneficiaryId: disbursement.beneficiaryId,
        highlightDisbursementId: disbursement.id,
    };
}

export function getApprovalSourceRoute(
    item: ApprovalItem,
    disbursementById?: Map<string, Disbursement>,
): FinancialSourceRoute | null {
    if (item.type !== 'disbursement') return null;

    const beneficiaryId = item.metadata?.beneficiaryId;
    if (beneficiaryId) {
        return {
            beneficiaryId,
            highlightDisbursementId: item.relatedEntityId,
        };
    }

    if (item.relatedEntityId && disbursementById) {
        const linked = disbursementById.get(item.relatedEntityId);
        if (linked) return getDisbursementSourceRoute(linked);
    }

    return null;
}

export function navigateToFinancialSource(route: FinancialSourceRoute) {
    openBeneficiaryAidLog(route.beneficiaryId, route.highlightDisbursementId);
}
