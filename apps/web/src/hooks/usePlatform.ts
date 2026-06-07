import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useOrg } from '../contexts/OrgContext';

export interface PlatformOrg {
    id: string;
    name: string;
    created_at: string | null;
    member_count: number;
}

export interface PlatformOrgDetail extends PlatformOrg {
    counts: {
        members: number;
        donors: number;
        projects: number;
        beneficiaries: number;
    };
}

export const PLATFORM_ORGS_KEY = ['platform', 'orgs'] as const;

export function usePlatformOrgs() {
    const { isPlatformAdmin } = useOrg();
    return useQuery({
        queryKey: [...PLATFORM_ORGS_KEY],
        queryFn: () => api.get<PlatformOrg[]>('/platform/orgs'),
        enabled: isPlatformAdmin,
    });
}

export function useCreateOrg() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: { name: string }) => api.post<PlatformOrg>('/platform/orgs', body),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [...PLATFORM_ORGS_KEY] });
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        },
    });
}

export function useDeleteOrg() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (orgId: string) => api.delete<{ ok: boolean }>(`/platform/orgs/${orgId}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [...PLATFORM_ORGS_KEY] });
            void queryClient.invalidateQueries({ queryKey: ['me'] });
            void queryClient.invalidateQueries();
        },
    });
}
