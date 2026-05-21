import { PIPELINE_STAGES } from '@gms/shared';

const PIPELINE_STAGE_SET = new Set<string>(PIPELINE_STAGES);

export const MAX_DONOR_TAGS = 20;
export const MAX_DONOR_TAG_LEN = 30;

function isValidAskAmountValue(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0;
}

function isValidStageEnteredAt(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value !== 'string' || !value.trim()) return false;
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
}

/** Validates incoming custom_fields keys on donor create/update. */
export function validateDonorCustomFieldsPatch(incoming: Record<string, unknown>): string | null {
    if ('pipeline_stage' in incoming) {
        const stage = incoming.pipeline_stage;
        if (typeof stage !== 'string' || !PIPELINE_STAGE_SET.has(stage)) {
            return `Invalid pipeline_stage: ${String(stage)}`;
        }
    }
    if ('ask_amount' in incoming && !isValidAskAmountValue(incoming.ask_amount)) {
        return 'Invalid ask_amount: must be a finite number >= 0 or null';
    }
    if ('suggested_ask_amount' in incoming && !isValidAskAmountValue(incoming.suggested_ask_amount)) {
        return 'Invalid suggested_ask_amount: must be a finite number >= 0 or null';
    }
    if ('stage_entered_at' in incoming && !isValidStageEnteredAt(incoming.stage_entered_at)) {
        return 'Invalid stage_entered_at: must be a valid ISO date string or null';
    }
    return null;
}

export function validateDonorTags(tags: unknown): string | null {
    if (!Array.isArray(tags)) return 'Invalid tags: must be an array of strings';
    if (tags.length > MAX_DONOR_TAGS) return `Invalid tags: maximum ${MAX_DONOR_TAGS} tags allowed`;
    for (const tag of tags) {
        if (typeof tag !== 'string' || !tag.trim() || tag.trim().length > MAX_DONOR_TAG_LEN) {
            return `Invalid tags: each tag must be a non-empty string of at most ${MAX_DONOR_TAG_LEN} characters`;
        }
    }
    return null;
}

/** Trim, dedupe (case-preserving), and cap tag count for persistence. */
export function normalizeDonorTags(tags: string[]): string[] {
    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const raw of tags) {
        const tag = raw.trim();
        if (!tag || tag.length > MAX_DONOR_TAG_LEN || seen.has(tag)) continue;
        seen.add(tag);
        normalized.push(tag);
        if (normalized.length >= MAX_DONOR_TAGS) break;
    }
    return normalized;
}
