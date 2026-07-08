import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import type { GriDisclosureStatus } from '../data/griReportingData';

export interface GriDisclosureResponseRecord {
    disclosureNumber: string;
    narrative: string;
    status: GriDisclosureStatus;
    reference: string;
    custom_fields?: Record<string, unknown>;
}

export interface GriReportRecord {
    id: string;
    reportPeriod: string;
    frameworkVersion: string;
    materialTopics: string[];
    responses: GriDisclosureResponseRecord[];
    custom_fields?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface UpsertGriReportInput {
    reportPeriod?: string;
    frameworkVersion?: string;
    materialTopics?: string[];
    responses?: GriDisclosureResponseRecord[];
    custom_fields?: Record<string, unknown>;
}

export const GRI_REPORTING_QUERY_KEY = ['gri-reporting'] as const;

export async function fetchGriReports(): Promise<GriReportRecord[]> {
    return api.get<GriReportRecord[]>('/gri-reporting');
}

export const useGriReports = () => {
    const { user, session, loading: authLoading } = useAuth();
    return useQuery({
        queryKey: GRI_REPORTING_QUERY_KEY,
        queryFn: fetchGriReports,
        enabled: !authLoading && !!user && !!session?.access_token,
    });
};

export const useCreateGriReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: UpsertGriReportInput) => api.post<GriReportRecord>('/gri-reporting', input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: GRI_REPORTING_QUERY_KEY });
        },
    });
};

export const useUpdateGriReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpsertGriReportInput }) =>
            api.patch<GriReportRecord>(`/gri-reporting/${id}`, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: GRI_REPORTING_QUERY_KEY });
        },
    });
};

export const useDeleteGriReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete<{ ok: true }>(`/gri-reporting/${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: GRI_REPORTING_QUERY_KEY });
        },
    });
};
