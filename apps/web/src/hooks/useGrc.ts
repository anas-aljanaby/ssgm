import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    Assessment,
    ComplianceRequirement,
    Decision,
    GrcData,
    GrcRisk,
    Policy,
} from '../types';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { AssessmentPayload } from '../components/pages/grc/AssessmentModal';
import type { RequirementPayload } from '../components/pages/grc/RequirementModal';
import type { LogRiskPayload } from '../components/pages/grc/LogRiskModal';

export const GRC_QUERY_KEY = ['grc'] as const;
export const GRC_SCREENING_QUERY_KEY = ['grc', 'screening'] as const;

export interface ApiGrcBundle extends GrcData {
    auditLog: GrcData['auditLog'];
}

export interface ScreeningResult {
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high';
    recommendation: 'approve' | 'review' | 'reject';
    reasoning_en: string;
    reasoning_ar: string;
    matchDetails: string | null;
}

export interface ApiScreeningBundle {
    entities: Array<{
        id: string;
        name: string;
        type: string;
        country: string;
        riskLevel: string;
        lastScreened: string;
        createdAt: string;
    }>;
    alerts: Array<{
        id: string;
        entityId: string;
        entityName: string;
        matchDetails: string;
        listSource: string;
        status: string;
        createdAt: string;
    }>;
    stats: {
        totalEntities: number;
        highRisk: number;
        mediumRisk: number;
        lowRisk: number;
        openAlerts: number;
    };
}

async function fetchGrcBundle(): Promise<ApiGrcBundle> {
    return api.get<ApiGrcBundle>('/grc');
}

async function fetchScreeningBundle(): Promise<ApiScreeningBundle> {
    return api.get<ApiScreeningBundle>('/grc/screening');
}

export function useGrc() {
    return useQuery({
        queryKey: GRC_QUERY_KEY,
        queryFn: fetchGrcBundle,
    });
}

export function useGrcScreening() {
    return useQuery({
        queryKey: GRC_SCREENING_QUERY_KEY,
        queryFn: fetchScreeningBundle,
    });
}

function invalidateGrc(queryClient: ReturnType<typeof useQueryClient>) {
    void queryClient.invalidateQueries({ queryKey: GRC_QUERY_KEY });
}

function invalidateScreening(queryClient: ReturnType<typeof useQueryClient>) {
    void queryClient.invalidateQueries({ queryKey: GRC_SCREENING_QUERY_KEY });
}

export interface CreatePolicyInput {
    title: { en: string; ar: string };
    category: string;
    version: string;
    effectiveDate?: string;
    reviewDate?: string;
}

export interface CreateDecisionInput {
    title: { en: string; ar: string };
    date: string;
    impact: Decision['impact'];
}

export function useCreateGrcPolicy() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: (input: CreatePolicyInput) =>
            api.post<Policy>('/grc/policies', {
                title: input.title,
                category: input.category || 'compliance',
                status: 'draft',
                version: input.version || '1.0',
                effectiveDate: input.effectiveDate,
                reviewDate: input.reviewDate,
                ownerUserId: user?.id ?? '',
            }),
        onSuccess: () => invalidateGrc(queryClient),
    });
}

export function useCreateGrcDecision() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateDecisionInput) =>
            api.post<Decision>('/grc/decisions', {
                title: input.title,
                date: input.date,
                status: 'pending',
                impact: input.impact,
            }),
        onSuccess: () => invalidateGrc(queryClient),
    });
}

export function useCreateGrcRisk() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: LogRiskPayload) =>
            api.post<GrcRisk>('/grc/risks', {
                risk: input.risk,
                category: input.category,
                probability: input.probability,
                impact: input.impact,
                score: input.score,
                level: input.level,
                scope: input.scope,
                mitigation: [{ en: 'Pending mitigation plan', ar: 'خطة تخفيف قيد الإعداد' }],
                status: 'identified',
            }),
        onSuccess: () => invalidateGrc(queryClient),
    });
}

export function useUpdateGrcRisk() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...patch }: { id: string } & Partial<GrcRisk>) =>
            api.patch<GrcRisk>(`/grc/risks/${id}`, {
                risk: patch.risk,
                category: patch.category,
                probability: patch.probability,
                impact: patch.impact,
                score: patch.score,
                level: patch.level,
                scope: patch.scope,
                mitigation: patch.mitigation,
                status: patch.status,
            }),
        onSuccess: () => invalidateGrc(queryClient),
    });
}

export function useCreateGrcRequirement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: RequirementPayload) =>
            api.post<ComplianceRequirement>('/grc/requirements', {
                code: input.code,
                title: input.title,
                source: input.source,
                sourceName: input.sourceName,
                priority: input.priority,
                nextDueDate: input.nextDueDate,
                status: input.status,
            }),
        onSuccess: () => invalidateGrc(queryClient),
    });
}

export function useUpdateGrcRequirement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...input }: RequirementPayload & { id: string }) =>
            api.patch<ComplianceRequirement>(`/grc/requirements/${id}`, {
                code: input.code,
                title: input.title,
                source: input.source,
                sourceName: input.sourceName,
                priority: input.priority,
                nextDueDate: input.nextDueDate,
                status: input.status,
            }),
        onSuccess: () => invalidateGrc(queryClient),
    });
}

export function useDeleteGrcRequirement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ ok: true }>(`/grc/requirements/${id}`),
        onSuccess: () => invalidateGrc(queryClient),
    });
}

export function useCreateGrcAssessment() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: ({ requirementId, payload }: { requirementId: string; payload: AssessmentPayload }) =>
            api.post<Assessment>('/grc/assessments', {
                requirementId,
                date: payload.date,
                status: payload.status,
                score: payload.score,
                assessorId: user?.id ?? '',
                findings: payload.findings,
            }),
        onSuccess: () => invalidateGrc(queryClient),
    });
}

export function useScreenEntity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: { name: string; type: string; country: string; listSourceLabel: string }) =>
            api.post<{ entity: unknown; result: ScreeningResult; alert: unknown | null }>(
                '/grc/screening/screen',
                input,
            ),
        onSuccess: () => {
            invalidateScreening(queryClient);
            invalidateGrc(queryClient);
        },
    });
}
