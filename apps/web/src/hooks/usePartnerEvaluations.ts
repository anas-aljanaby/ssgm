import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { PARTNERS_QUERY_KEY } from './usePartners';

export interface PartnerEvaluationRecord {
    id: string;
    reviewer: string;
    project: string;
    rating: number;
    comment: string;
    date: string;
}

export interface CreatePartnerEvaluationInput {
    reviewer: string;
    project: string;
    rating: number;
    comment: string;
}

export const PARTNER_EVALUATIONS_QUERY_KEY = (partnerId: string) => ['partner-evaluations', partnerId] as const;

export const usePartnerEvaluations = (partnerId: string) => {
    const { user, loading: authLoading } = useAuth();

    return useQuery({
        queryKey: PARTNER_EVALUATIONS_QUERY_KEY(partnerId),
        queryFn: () => api.get<PartnerEvaluationRecord[]>(`/implementing-partners/${partnerId}/evaluations`),
        enabled: !authLoading && !!user && !!partnerId,
    });
};

export const useCreatePartnerEvaluation = (partnerId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreatePartnerEvaluationInput) =>
            api.post<PartnerEvaluationRecord & { partnerRating: number }>(`/implementing-partners/${partnerId}/evaluations`, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: PARTNER_EVALUATIONS_QUERY_KEY(partnerId) });
            void queryClient.invalidateQueries({ queryKey: PARTNERS_QUERY_KEY });
        },
    });
};
