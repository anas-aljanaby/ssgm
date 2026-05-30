import type { AidStatus } from '../types';
import type { DisbursementStatus } from '../types/financials';

export function mapDisbursementToAidStatus(status: DisbursementStatus): AidStatus {
    if (status === 'completed') return 'Delivered';
    if (status === 'scheduled') return 'Scheduled';
    return 'Pending';
}

export { openFinancialsTab } from './moduleNavigation';
