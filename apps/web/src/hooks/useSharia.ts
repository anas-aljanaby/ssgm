import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import type {
    ShariaActivityEvent,
    ShariaException,
    ShariaFatwa,
    ShariaReview,
    ShariaTrendPoint,
    ZakatAllocationReview,
    ZakatPolicyRule,
} from '../data/shariaData';

export const SHARIA_QUERY_KEY = ['sharia'] as const;

export interface ShariaBundle {
    fatwas: ShariaFatwa[];
    reviews: ShariaReview[];
    zakatReviews: ZakatAllocationReview[];
    policyRules: ZakatPolicyRule[];
    exceptions: ShariaException[];
    activities: ShariaActivityEvent[];
    trend: ShariaTrendPoint[];
    zakatTarget: number | null;
}

async function fetchShariaBundle(): Promise<ShariaBundle> {
    return api.get<ShariaBundle>('/sharia');
}

export function useSharia() {
    const { user, session, loading: authLoading } = useAuth();
    return useQuery({
        queryKey: SHARIA_QUERY_KEY,
        queryFn: fetchShariaBundle,
        enabled: !authLoading && !!user && !!session?.access_token,
    });
}

function invalidateSharia(queryClient: ReturnType<typeof useQueryClient>) {
    void queryClient.invalidateQueries({ queryKey: SHARIA_QUERY_KEY });
}

export type CreateFatwaInput = Omit<ShariaFatwa, 'id' | 'referenceNumber' | 'statusHistory'>;
export type CreateReviewInput = Omit<ShariaReview, 'id' | 'activityHistory'>;
export type CreateZakatReviewInput = Omit<ZakatAllocationReview, 'id'>;

export function useCreateShariaFatwa() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateFatwaInput) => api.post<ShariaFatwa>('/sharia/fatwas', input),
        onSuccess: () => invalidateSharia(queryClient),
    });
}

export function useUpdateShariaFatwa() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...input }: Partial<ShariaFatwa> & { id: string }) =>
            api.patch<ShariaFatwa>(`/sharia/fatwas/${id}`, input),
        onSuccess: () => invalidateSharia(queryClient),
    });
}

export function useDeleteShariaFatwa() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete<{ ok: true }>(`/sharia/fatwas/${id}`),
        onSuccess: () => invalidateSharia(queryClient),
    });
}

export function useCreateShariaReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateReviewInput) => api.post<ShariaReview>('/sharia/reviews', input),
        onSuccess: () => invalidateSharia(queryClient),
    });
}

export function useUpdateShariaReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...input }: Partial<ShariaReview> & { id: string }) =>
            api.patch<ShariaReview>(`/sharia/reviews/${id}`, input),
        onSuccess: () => invalidateSharia(queryClient),
    });
}

export function useDeleteShariaReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete<{ ok: true }>(`/sharia/reviews/${id}`),
        onSuccess: () => invalidateSharia(queryClient),
    });
}

export function useCreateShariaZakatReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateZakatReviewInput) => api.post<ZakatAllocationReview>('/sharia/zakat-reviews', input),
        onSuccess: () => invalidateSharia(queryClient),
    });
}

export function useUpdateShariaZakatReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...input }: Partial<ZakatAllocationReview> & { id: string }) =>
            api.patch<ZakatAllocationReview>(`/sharia/zakat-reviews/${id}`, input),
        onSuccess: () => invalidateSharia(queryClient),
    });
}

export function useDeleteShariaZakatReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete<{ ok: true }>(`/sharia/zakat-reviews/${id}`),
        onSuccess: () => invalidateSharia(queryClient),
    });
}

export function useUpdateShariaException() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...input }: Partial<ShariaException> & { id: string }) =>
            api.patch<ShariaException>(`/sharia/exceptions/${id}`, input),
        onSuccess: () => invalidateSharia(queryClient),
    });
}

export function useDeleteShariaException() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete<{ ok: true }>(`/sharia/exceptions/${id}`),
        onSuccess: () => invalidateSharia(queryClient),
    });
}
