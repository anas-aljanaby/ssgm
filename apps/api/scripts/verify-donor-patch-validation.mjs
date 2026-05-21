/**
 * Verifies donor PATCH validation helpers (mirrors donorPatchValidation.ts).
 * Run: node apps/api/scripts/verify-donor-patch-validation.mjs
 */
const PIPELINE_STAGES = [
    'prospect', 'researching', 'contacted', 'cultivating',
    'solicited', 'pledged', 'donated', 'dormant',
];
const PIPELINE_STAGE_SET = new Set(PIPELINE_STAGES);
const MAX_DONOR_TAGS = 20;
const MAX_DONOR_TAG_LEN = 30;

function isValidAskAmountValue(value) {
    if (value === null || value === undefined) return true;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0;
}

function isValidStageEnteredAt(value) {
    if (value === null || value === undefined) return true;
    if (typeof value !== 'string' || !value.trim()) return false;
    return !Number.isNaN(new Date(value).getTime());
}

function validateDonorCustomFieldsPatch(incoming) {
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

function normalizeDonorTags(tags) {
    const seen = new Set();
    const normalized = [];
    for (const raw of tags) {
        const tag = raw.trim();
        if (!tag || tag.length > MAX_DONOR_TAG_LEN || seen.has(tag)) continue;
        seen.add(tag);
        normalized.push(tag);
        if (normalized.length >= MAX_DONOR_TAGS) break;
    }
    return normalized;
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

assert(validateDonorCustomFieldsPatch({ pipeline_stage: 'invalid_stage' }) !== null, 'invalid stage');
assert(validateDonorCustomFieldsPatch({ pipeline_stage: 'prospect' }) === null, 'valid stage');
assert(validateDonorCustomFieldsPatch({ ask_amount: -1 }) !== null, 'negative ask');
assert(validateDonorCustomFieldsPatch({ ask_amount: null }) === null, 'null ask');
assert(validateDonorCustomFieldsPatch({ stage_entered_at: 'not-a-date' }) !== null, 'bad stage_entered_at');
assert(validateDonorCustomFieldsPatch({ stage_entered_at: '2026-05-21T10:00:00.000Z' }) === null, 'valid stage_entered_at');
assert(normalizeDonorTags(['  foo ', 'foo', 'bar']).join(',') === 'foo,bar', 'normalize tags');
console.log('PASS: donor PATCH validation');
