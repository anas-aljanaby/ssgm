import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type {
    Beneficiary,
    BeneficiaryProfile,
    BeneficiaryStatus,
    BeneficiaryType,
    SupportType,
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { buildOptimisticBeneficiary } from '../lib/beneficiaryOptimistic';

export const BENEFICIARIES_QUERY_KEY = ['beneficiaries'] as const;

export { isOptimisticBeneficiary } from '../lib/beneficiaryOptimistic';

export interface ApiBeneficiary {
    id: string;
    name_en: string;
    name_ar?: string | null;
    beneficiary_type: string;
    photo?: string | null;
    status: string;
    support_type: string;
    country?: string | null;
    project_id?: string | null;
    profile?: unknown;
    aid_log?: unknown;
    assessments?: unknown;
    milestones?: unknown;
    documents?: unknown;
    custom_fields?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const asProfile = (value: unknown, fallbackType: BeneficiaryType): BeneficiaryProfile => {
    if (isRecord(value) && typeof value.type === 'string') {
        return value as BeneficiaryProfile;
    }
    return { type: fallbackType } as BeneficiaryProfile;
};

export const mapApiBeneficiaryToBeneficiary = (row: ApiBeneficiary): Beneficiary => {
    const beneficiaryType = row.beneficiary_type as BeneficiaryType;
    return {
        id: row.id,
        name: {
            en: row.name_en,
            ar: row.name_ar || row.name_en,
        },
        beneficiaryType,
        photo: row.photo || '',
        status: row.status as BeneficiaryStatus,
        supportType: row.support_type as SupportType,
        country: row.country || '',
        projectId: row.project_id ?? undefined,
        profile: asProfile(row.profile, beneficiaryType),
        aidLog: asArray(row.aid_log),
        assessments: asArray(row.assessments),
        milestones: asArray(row.milestones),
        documents: asArray(row.documents),
    };
};

export function mapBeneficiaryToCreatePayload(input: Partial<Beneficiary>) {
    const nameEn = input.name?.en?.trim() || input.name?.ar?.trim() || '';
    const nameAr = input.name?.ar?.trim() || input.name?.en?.trim() || '';
    const beneficiaryType = input.beneficiaryType || 'student';

    return {
        name_en: nameEn,
        name_ar: nameAr,
        beneficiary_type: beneficiaryType,
        support_type: input.supportType || 'direct-support',
        country: input.country || '',
        photo: input.photo,
        status: input.status || 'active',
        profile: input.profile || { type: beneficiaryType },
        project_id: input.projectId ?? null,
    };
}

export function mapBeneficiaryToUpdatePayload(beneficiary: Beneficiary) {
    return {
        name_en: beneficiary.name.en,
        name_ar: beneficiary.name.ar,
        beneficiary_type: beneficiary.beneficiaryType,
        photo: beneficiary.photo,
        status: beneficiary.status,
        support_type: beneficiary.supportType,
        country: beneficiary.country,
        project_id: beneficiary.projectId ?? null,
        profile: beneficiary.profile,
        aid_log: beneficiary.aidLog,
        assessments: beneficiary.assessments,
        milestones: beneficiary.milestones,
        documents: beneficiary.documents,
    };
}

export async function fetchBeneficiariesList(): Promise<Beneficiary[]> {
    const rows = await api.get<ApiBeneficiary[]>('/beneficiaries');
    return rows.map(mapApiBeneficiaryToBeneficiary);
}

export const projectBeneficiariesQueryKey = (projectId: string) =>
    ['project', projectId, 'beneficiaries'] as const;

export async function fetchProjectBeneficiaries(projectId: string): Promise<Beneficiary[]> {
    const rows = await api.get<ApiBeneficiary[]>(`/projects/${projectId}/beneficiaries`);
    return rows.map(mapApiBeneficiaryToBeneficiary);
}

export const useProjectBeneficiaries = (projectId: string | null) => {
    const { user, loading: authLoading } = useAuth();

    return useQuery({
        queryKey: projectId ? projectBeneficiariesQueryKey(projectId) : ['project', 'none', 'beneficiaries'],
        queryFn: () => fetchProjectBeneficiaries(projectId as string),
        enabled: !authLoading && !!user && !!projectId,
    });
};

export async function fetchBeneficiaryById(id: string): Promise<Beneficiary> {
    const row = await api.get<ApiBeneficiary>(`/beneficiaries/${id}`);
    return mapApiBeneficiaryToBeneficiary(row);
}

export const useBeneficiaries = () => {
    const { user, loading: authLoading } = useAuth();

    return useQuery({
        queryKey: BENEFICIARIES_QUERY_KEY,
        queryFn: fetchBeneficiariesList,
        enabled: !authLoading && !!user,
    });
};

export function invalidateBeneficiariesQueries(queryClient: QueryClient) {
    void queryClient.invalidateQueries({ queryKey: BENEFICIARIES_QUERY_KEY });
}

export function invalidateProjectBeneficiariesQueries(queryClient: QueryClient, projectId: string) {
    void queryClient.invalidateQueries({ queryKey: projectBeneficiariesQueryKey(projectId) });
}

export async function createBeneficiaryApi(input: Partial<Beneficiary>): Promise<Beneficiary> {
    const row = await api.post<ApiBeneficiary>('/beneficiaries', mapBeneficiaryToCreatePayload(input));
    return mapApiBeneficiaryToBeneficiary(row);
}

export async function updateBeneficiaryApi(beneficiary: Beneficiary): Promise<Beneficiary> {
    const row = await api.patch<ApiBeneficiary>(
        `/beneficiaries/${beneficiary.id}`,
        mapBeneficiaryToUpdatePayload(beneficiary),
    );
    return mapApiBeneficiaryToBeneficiary(row);
}

export async function deleteBeneficiaryApi(beneficiaryId: string): Promise<void> {
    await api.delete<{ ok: true }>(`/beneficiaries/${beneficiaryId}`);
}

export const useCreateBeneficiary = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBeneficiaryApi,
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: BENEFICIARIES_QUERY_KEY });
            const previous = queryClient.getQueryData<Beneficiary[]>(BENEFICIARIES_QUERY_KEY);
            const optimistic = buildOptimisticBeneficiary(input);
            queryClient.setQueryData<Beneficiary[]>(BENEFICIARIES_QUERY_KEY, (old) => [
                optimistic,
                ...(old ?? []),
            ]);
            return { previous, optimisticId: optimistic.id };
        },
        onSuccess: (created, _input, context) => {
            queryClient.setQueryData<Beneficiary[]>(BENEFICIARIES_QUERY_KEY, (old) => {
                if (!old) return [created];
                const optimisticId = context?.optimisticId;
                const withoutOptimistic = optimisticId
                    ? old.filter((row) => row.id !== optimisticId)
                    : old.filter((row) => row.id !== created.id);
                return [created, ...withoutOptimistic];
            });
            if (created.projectId) {
                invalidateProjectBeneficiariesQueries(queryClient, created.projectId);
            }
        },
        onError: (_error, _input, context) => {
            if (context?.previous) {
                queryClient.setQueryData(BENEFICIARIES_QUERY_KEY, context.previous);
            }
        },
        onSettled: (_data, error) => {
            if (error) {
                invalidateBeneficiariesQueries(queryClient);
            }
        },
    });
};

export const useUpdateBeneficiary = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateBeneficiaryApi,
        onMutate: async (beneficiary) => {
            await queryClient.cancelQueries({ queryKey: BENEFICIARIES_QUERY_KEY });
            const previous = queryClient.getQueryData<Beneficiary[]>(BENEFICIARIES_QUERY_KEY);
            queryClient.setQueryData<Beneficiary[]>(BENEFICIARIES_QUERY_KEY, (old) =>
                (old ?? []).map((row) => (row.id === beneficiary.id ? beneficiary : row)),
            );
            return { previous };
        },
        onSuccess: (updated, _input, context) => {
            queryClient.setQueryData<Beneficiary[]>(BENEFICIARIES_QUERY_KEY, (old) =>
                (old ?? []).map((row) => (row.id === updated.id ? updated : row)),
            );
            const previous = context?.previous?.find((row) => row.id === updated.id);
            const projectIds = new Set(
                [updated.projectId, previous?.projectId].filter((id): id is string => !!id),
            );
            projectIds.forEach((projectId) => invalidateProjectBeneficiariesQueries(queryClient, projectId));
        },
        onError: (_error, _input, context) => {
            if (context?.previous) {
                queryClient.setQueryData(BENEFICIARIES_QUERY_KEY, context.previous);
            }
        },
        onSettled: (_data, error) => {
            if (error) {
                invalidateBeneficiariesQueries(queryClient);
            }
        },
    });
};

export const useDeleteBeneficiary = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBeneficiaryApi,
        onMutate: async (beneficiaryId) => {
            await queryClient.cancelQueries({ queryKey: BENEFICIARIES_QUERY_KEY });
            const previous = queryClient.getQueryData<Beneficiary[]>(BENEFICIARIES_QUERY_KEY);
            queryClient.setQueryData<Beneficiary[]>(BENEFICIARIES_QUERY_KEY, (old) =>
                (old ?? []).filter((row) => row.id !== beneficiaryId),
            );
            return { previous };
        },
        onError: (_error, _input, context) => {
            if (context?.previous) {
                queryClient.setQueryData(BENEFICIARIES_QUERY_KEY, context.previous);
            }
        },
        onSettled: () => {
            invalidateBeneficiariesQueries(queryClient);
        },
    });
};
