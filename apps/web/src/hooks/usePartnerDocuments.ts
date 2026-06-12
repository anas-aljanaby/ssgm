import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import type { PartnerDocumentCategory } from '../components/pages/implementing_partners/partnerStaticData';

export interface PartnerDocumentRecord {
    id: string;
    filename: string;
    file_url: string;
    label: string;
    category: PartnerDocumentCategory;
    content_type: string | null;
    size_bytes: number | null;
    uploaded_at: string | null;
}

export const PARTNER_DOCUMENTS_QUERY_KEY = (partnerId: string) => ['partner-documents', partnerId] as const;

export const usePartnerDocuments = (partnerId: string) => {
    const { user, loading: authLoading } = useAuth();

    return useQuery({
        queryKey: PARTNER_DOCUMENTS_QUERY_KEY(partnerId),
        queryFn: () => api.get<PartnerDocumentRecord[]>(`/implementing-partners/${partnerId}/documents`),
        enabled: !authLoading && !!user && !!partnerId,
    });
};

export const useUploadPartnerDocument = (partnerId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ file, label, category }: { file: File; label?: string; category?: PartnerDocumentCategory }) => {
            const form = new FormData();
            form.append('file', file);
            if (label) form.append('label', label);
            if (category) form.append('category', category);
            return api.upload<PartnerDocumentRecord>(`/implementing-partners/${partnerId}/documents`, form);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: PARTNER_DOCUMENTS_QUERY_KEY(partnerId) });
        },
    });
};

export const useDeletePartnerDocument = (partnerId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (documentId: string) => api.delete<{ ok: true }>(`/implementing-partners/${partnerId}/documents/${documentId}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: PARTNER_DOCUMENTS_QUERY_KEY(partnerId) });
        },
    });
};

export function resolvePartnerDocumentUrl(fileUrl: string): string {
    if (fileUrl.startsWith('http')) return fileUrl;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${base}${fileUrl}`;
}
