import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
    DonorProfileDocument,
    DonorProfileInteraction,
    DonorProfileSummary,
    DonorProfileTask,
    IndividualDonor,
    ProfileDonation,
} from '../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => UUID_RE.test(value);

export interface ApiIndividualDonor {
    id: string;
    full_name_en: string;
    full_name_ar?: string | null;
    email: string;
    phone?: string | null;
    total_donations?: string | number | null;
    last_donation_date?: string | null;
    status: IndividualDonor['status'];
    tier: IndividualDonor['tier'];
    country?: string | null;
    tags?: unknown;
    assigned_manager?: string | null;
    avatar?: string | null;
    donor_since?: string | null;
    donor_category?: string | null;
    donations_count?: number | null;
    avg_gift?: string | number | null;
    avg_days_between_donations?: string | number | null;
    primary_program_interest?: string | null;
    custom_fields?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

const asNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const asOptionalNumber = (value: unknown): number | undefined => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const asString = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value : undefined;

const normalizeDonorCategory = (value: string | null | undefined): IndividualDonor['donorCategory'] | undefined => {
    if (!value) return undefined;
    const aliases: Record<string, IndividualDonor['donorCategory']> = {
        Hero: 'Hero Donor',
        Recurring: 'Recurring Donor',
        Seasonal: 'Seasonal Donor',
        Event: 'Event Donor',
        Dormant: 'Dormant Donor',
        General: 'General Donor',
        New: 'New Donor',
    };
    return aliases[value] || (value as IndividualDonor['donorCategory']);
};

export const mapApiDonorToIndividualDonor = (row: ApiIndividualDonor): IndividualDonor => {
    const customFields = isRecord(row.custom_fields) ? row.custom_fields : {};
    const fullNameEn = row.full_name_en || 'Unnamed donor';
    const tags = Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === 'string') : [];
    const donorType = asString(customFields.donor_type) as IndividualDonor['donorType'] | undefined;
    const donorCategory = normalizeDonorCategory(row.donor_category);
    const inferredDonorType: IndividualDonor['donorType'] = row.tier === 'Major Donor'
        ? 'Major Donor'
        : donorCategory === 'Recurring Donor'
            ? 'Recurring'
            : 'Individual';
    const pipelineStage = asString(customFields.pipeline_stage) as IndividualDonor['relationshipStage'] | undefined;
    const askAmount = asOptionalNumber(customFields.ask_amount) ?? asOptionalNumber(customFields.suggested_ask_amount);

    return {
        id: row.id,
        fullName: {
            en: fullNameEn,
            ar: row.full_name_ar || fullNameEn,
        },
        email: row.email,
        phone: row.phone || '',
        totalDonations: asNumber(row.total_donations),
        lastDonationDate: row.last_donation_date || '',
        status: row.status,
        tier: row.tier,
        country: row.country || '',
        tags,
        assignedManager: row.assigned_manager || '',
        avatar: row.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(row.email)}`,
        donorSince: row.donor_since || '',
        donorCategory,
        donationsCount: row.donations_count || 0,
        avgGift: asOptionalNumber(row.avg_gift),
        averageDaysBetweenDonations: asOptionalNumber(row.avg_days_between_donations),
        primaryProgramInterest: row.primary_program_interest || undefined,
        donorType: donorType || inferredDonorType,
        relationshipStage: pipelineStage,
        relationshipHealth: asString(customFields.relationship_health) as IndividualDonor['relationshipHealth'] | undefined,
        relationshipLikelihood: asString(customFields.relationship_likelihood) as IndividualDonor['relationshipLikelihood'] | undefined,
        stageEnteredAt: asString(customFields.stage_entered_at),
        potentialGift: asOptionalNumber(customFields.potential_gift),
        suggestedAskAmount: askAmount,
        currentProposal: asString(customFields.current_proposal),
        askDate: asString(customFields.ask_date),
        pledgeAmount: asOptionalNumber(customFields.pledge_amount),
        pledgeStatus: asString(customFields.pledge_status) as IndividualDonor['pledgeStatus'] | undefined,
        expectedCloseDate: asString(customFields.expected_close_date),
        lostReason: asString(customFields.lost_reason),
        relationshipNotes: asString(customFields.relationship_notes),
    };
};

async function fetchProfileSummary(donorId: string): Promise<DonorProfileSummary> {
    return api.get<DonorProfileSummary>(`/donors/${donorId}/profile-summary`);
}

async function fetchProfileRecord(donorId: string): Promise<IndividualDonor> {
    return mapApiDonorToIndividualDonor(await api.get<ApiIndividualDonor>(`/donors/${donorId}`));
}

async function fetchProfileDonations(donorId: string): Promise<ProfileDonation[]> {
    return api.get<ProfileDonation[]>(`/donors/${donorId}/donations`);
}

async function fetchProfileTasks(donorId: string): Promise<DonorProfileTask[]> {
    return api.get<DonorProfileTask[]>(`/donors/${donorId}/tasks`);
}

async function fetchProfileInteractions(donorId: string): Promise<DonorProfileInteraction[]> {
    return api.get<DonorProfileInteraction[]>(`/donors/${donorId}/interactions`);
}

async function fetchProfileDocuments(donorId: string): Promise<DonorProfileDocument[]> {
    return api.get<DonorProfileDocument[]>(`/donors/${donorId}/documents`);
}

export async function uploadDonorProfileDocument(donorId: string, file: File, label: string): Promise<DonorProfileDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', label);
    return api.upload<DonorProfileDocument>(`/donors/${donorId}/documents`, formData);
}

export async function deleteDonorProfileDocument(donorId: string, documentId: string): Promise<{ ok: true }> {
    return api.delete<{ ok: true }>(`/donors/${donorId}/documents/${documentId}`);
}

export const useDonorProfileRecord = (donorId: string) => useQuery({
    queryKey: ['donor-profile-record', donorId],
    queryFn: () => fetchProfileRecord(donorId),
    enabled: isUuid(donorId),
});

export const useDonorProfileSummary = (donorId: string) => useQuery({
    queryKey: ['donor-profile-summary', donorId],
    queryFn: () => fetchProfileSummary(donorId),
    enabled: isUuid(donorId),
});

export const useDonorProfileDonations = (donorId: string) => useQuery({
    queryKey: ['donor-profile-donations', donorId],
    queryFn: () => fetchProfileDonations(donorId),
    enabled: isUuid(donorId),
});

export const useDonorProfileTasks = (donorId: string) => useQuery({
    queryKey: ['donor-profile-tasks', donorId],
    queryFn: () => fetchProfileTasks(donorId),
    enabled: isUuid(donorId),
});

export const useDonorProfileInteractions = (donorId: string) => useQuery({
    queryKey: ['donor-profile-interactions', donorId],
    queryFn: () => fetchProfileInteractions(donorId),
    enabled: isUuid(donorId),
});

export const useDonorProfileDocuments = (donorId: string) => useQuery({
    queryKey: ['donor-profile-documents', donorId],
    queryFn: () => fetchProfileDocuments(donorId),
    enabled: isUuid(donorId),
});
