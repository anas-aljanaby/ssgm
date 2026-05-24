import type { AidStatus } from '../types';
import type { DisbursementStatus } from '../types/financials';

export function mapDisbursementToAidStatus(status: DisbursementStatus): AidStatus {
    if (status === 'completed') return 'Delivered';
    if (status === 'scheduled') return 'Scheduled';
    return 'Pending';
}

export function openFinancialsTab(tabId: string) {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tabId);
    window.location.hash = 'financials';
    const search = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}?${search}${window.location.hash}`);
}
