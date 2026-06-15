import { db } from '../db';
import { audit_log } from '../db/schema';

export type AuditAction = 'create' | 'update' | 'delete';

export async function writeAuditLog(params: {
    orgId: string;
    userId: string;
    action: AuditAction;
    module: string;
    recordType: string;
    recordId: string;
    payload?: Record<string, unknown>;
}) {
    await db.insert(audit_log).values({
        org_id: params.orgId,
        user_id: params.userId,
        action: params.action,
        table_name: params.module,
        record_id: params.recordId,
        payload: {
            recordType: params.recordType,
            ...(params.payload ?? {}),
        },
    });
}
