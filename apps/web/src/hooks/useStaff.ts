import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateStaff, OrgRole, UpdateStaff } from '@gms/shared';
import { api } from '../lib/api';
import { useOrg } from '../contexts/OrgContext';

export const STAFF_QUERY_KEY = ['staff'] as const;

export interface StaffMember {
    id: string;
    user_id: string;
    role: OrgRole;
    email: string;
    name: { en: string; ar: string };
    title: string;
    department: string;
    phone: string;
    avatar: string;
    status: 'active' | 'disabled';
    custom_fields: Record<string, unknown>;
    demo_password: string;
    created_at: string | null;
}

export interface CreatedStaff extends StaffMember {
    temp_password?: string;
}

export function useStaff() {
    const { activeOrgId } = useOrg();
    return useQuery({
        queryKey: [...STAFF_QUERY_KEY, activeOrgId],
        queryFn: () => api.get<StaffMember[]>('/staff'),
        enabled: !!activeOrgId,
    });
}

export function useCreateStaff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateStaff) => api.post<CreatedStaff>('/staff', input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
        },
    });
}

export function useUpdateStaff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateStaff }) =>
            api.patch<StaffMember>(`/staff/${id}`, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
        },
    });
}

export function useDeleteStaff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete<{ ok: true }>(`/staff/${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
        },
    });
}
