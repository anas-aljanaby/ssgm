import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { PARTNERS_QUERY_KEY } from './usePartners';
import type { EvaluationScores } from '../data/partnerEvaluationsData';

export interface PartnerEvaluationRecord {
    id: string;
    partner_id?: string;
    reviewer: string;
    project: string;
    rating: number;
    scores: EvaluationScores;
    strengths: string;
    weaknesses: string;
    recommendations: string;
    date: string;
}

export interface CreatePartnerEvaluationInput {
    reviewer: string;
    project: string;
    scores: EvaluationScores;
    strengths: string;
    weaknesses: string;
    recommendations: string;
}

export const PARTNER_EVALUATIONS_QUERY_KEY = (partnerId: string) => ['partner-evaluations', partnerId] as const;
export const ALL_PARTNER_EVALUATIONS_QUERY_KEY = ['partner-evaluations', 'all'] as const;

export const usePartnerEvaluations = (partnerId: string) => {
    const { user, loading: authLoading } = useAuth();

    return useQuery({
        queryKey: PARTNER_EVALUATIONS_QUERY_KEY(partnerId),
        queryFn: () => api.get<PartnerEvaluationRecord[]>(`/implementing-partners/${partnerId}/evaluations`),
        enabled: !authLoading && !!user && !!partnerId,
    });
};

export const useAllPartnerEvaluations = (enabled = true) => {
    const { user, loading: authLoading } = useAuth();

    return useQuery({
        queryKey: ALL_PARTNER_EVALUATIONS_QUERY_KEY,
        queryFn: () => api.get<(PartnerEvaluationRecord & { partner_id: string })[]>('/implementing-partners/evaluations'),
        enabled: !authLoading && !!user && enabled,
    });
};

export const useCreatePartnerEvaluation = (partnerId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreatePartnerEvaluationInput) =>
            api.post<PartnerEvaluationRecord & { partnerRating: number }>(
                `/implementing-partners/${partnerId}/evaluations`,
                input,
            ),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: PARTNER_EVALUATIONS_QUERY_KEY(partnerId) });
            void queryClient.invalidateQueries({ queryKey: ALL_PARTNER_EVALUATIONS_QUERY_KEY });
            void queryClient.invalidateQueries({ queryKey: PARTNERS_QUERY_KEY });
        },
    });
};
