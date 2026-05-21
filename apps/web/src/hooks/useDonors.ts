import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { DonorStageId, IndividualDonor } from '../types';
import { api } from '../lib/api';
import { mapApiDonorToIndividualDonor, type ApiIndividualDonor } from './useDonorProfileSummary';

export const DONORS_QUERY_KEY = ['donors'] as const;

export async function fetchDonorsList(): Promise<IndividualDonor[]> {
    const rows = await api.get<ApiIndividualDonor[]>('/donors');
    return rows.map(mapApiDonorToIndividualDonor);
}

export const useDonors = () => useQuery({
    queryKey: DONORS_QUERY_KEY,
    queryFn: fetchDonorsList,
});

export interface CreateDonorInput {
    fullName: { en: string; ar: string };
    email: string;
    phone: string;
    country: string;
}

export async function createDonorApi(input: CreateDonorInput): Promise<IndividualDonor> {
    const now = new Date().toISOString();
    const row = await api.post<ApiIndividualDonor>('/donors', {
        full_name_en: input.fullName.en,
        full_name_ar: input.fullName.ar || input.fullName.en,
        email: input.email,
        phone: input.phone || '',
        country: input.country || '',
        status: 'Active',
        tier: 'Bronze',
        tags: [],
        assigned_manager: 'Unassigned',
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(input.email)}`,
        donor_since: now,
        custom_fields: {
            pipeline_stage: 'prospect',
            stage_entered_at: now,
            donor_type: 'Individual',
            relationship_health: 'Moderate',
            relationship_likelihood: 'Medium',
        },
    });
    return mapApiDonorToIndividualDonor(row);
}

export async function updateDonorPipelineStage(
    donorId: string,
    pipelineStage: DonorStageId,
    options?: {
        customFields?: Record<string, unknown>;
        currentStage?: string;
    },
): Promise<IndividualDonor> {
    const customFields = options?.customFields || {};
    const stageEnteredAt = options?.currentStage === pipelineStage
        ? (typeof customFields.stage_entered_at === 'string' ? customFields.stage_entered_at : new Date().toISOString())
        : new Date().toISOString();

    const row = await api.patch<ApiIndividualDonor>(`/donors/${donorId}`, {
        custom_fields: {
            ...customFields,
            pipeline_stage: pipelineStage,
            stage_entered_at: stageEnteredAt,
        },
    });
    return mapApiDonorToIndividualDonor(row);
}

const PROFILE_QUERY_PREFIXES = [
    'donor-profile-record',
    'donor-profile-summary',
    'donor-profile-donations',
    'donor-profile-tasks',
    'donor-profile-interactions',
    'donor-profile-documents',
] as const;

export function invalidateDonorsQueries(queryClient: QueryClient, donorId?: string) {
    void queryClient.invalidateQueries({ queryKey: DONORS_QUERY_KEY });
    if (!donorId) return;
    for (const prefix of PROFILE_QUERY_PREFIXES) {
        void queryClient.invalidateQueries({ queryKey: [prefix, donorId] });
    }
}

export function removeDonorProfileQueries(queryClient: QueryClient, donorId: string) {
    for (const prefix of PROFILE_QUERY_PREFIXES) {
        queryClient.removeQueries({ queryKey: [prefix, donorId] });
    }
}

export async function deleteDonorApi(donorId: string): Promise<void> {
    await api.delete<{ ok: true }>(`/donors/${donorId}`);
}

export const useCreateDonor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createDonorApi,
        onSuccess: () => invalidateDonorsQueries(queryClient),
    });
};

export const useUpdateDonorPipelineStage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: {
            donorId: string;
            pipelineStage: DonorStageId;
            customFields?: Record<string, unknown>;
            currentStage?: string;
        }) => updateDonorPipelineStage(vars.donorId, vars.pipelineStage, {
            customFields: vars.customFields,
            currentStage: vars.currentStage,
        }),
        onSuccess: (donor) => invalidateDonorsQueries(queryClient, donor.id),
    });
};

export const useDeleteDonor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteDonorApi,
        onSuccess: (_data, donorId) => {
            removeDonorProfileQueries(queryClient, donorId);
            void queryClient.invalidateQueries({ queryKey: DONORS_QUERY_KEY });
        },
    });
};
