import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InstitutionalDonor } from '../types';
import { api } from '../lib/api';

export interface InstitutionalDonorContact {
    id: string;
    name: string;
    position: string;
    email: string;
    phone?: string;
    whatsapp?: string;
    isPrimary: boolean;
    photoUrl?: string;
}

export interface InstitutionalDonorDocument {
    id: string;
    filename: string;
    file_url: string;
    label: string;
    content_type?: string | null;
    size_bytes?: number | null;
    uploaded_at: string | null;
}

export interface InstitutionalGrant {
    id: string;
    date: string | null;
    end_date: string | null;
    amount: number;
    received_amount: number;
    currency: string;
    type: 'Restricted' | 'Unrestricted';
    title: string;
    project_beneficiary: string;
    status: string;
}

type ApiInstitutionalDonor = {
    id: string;
    organizationName: { en: string; ar: string };
    logo: string;
    type: InstitutionalDonor['type'];
    primaryContact: { name: string; email: string };
    totalGrantsAwarded: number;
    activeGrants: number;
    nextDeadline: string;
    relationshipStatus: InstitutionalDonor['relationshipStatus'];
    focusAreas: string[];
    geographicFocus: string[];
    assignedManager: string;
    priority: InstitutionalDonor['priority'];
    country: string;
    lastContactDate: string;
    createdDate: string;
    registrationNumber?: string;
    city?: string;
    establishmentDate?: string;
    phone?: string;
    website?: string;
    socialMedia?: { linkedin?: string; twitter?: string; facebook?: string };
    address?: string;
    coordinates?: { lat: number; lng: number };
    contacts?: InstitutionalDonorContact[];
};

type InstitutionalDonorApiRow = ApiInstitutionalDonor | Record<string, unknown>;

const INSTITUTIONAL_DONORS_QUERY_KEY = ['institutional-donors'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);

const asStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
};

const customString = (customFields: unknown, key: string): string | undefined => {
    if (!isRecord(customFields)) return undefined;
    const value = customFields[key];
    return typeof value === 'string' && value.trim() ? value : undefined;
};

const toIso = (value: unknown): string => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

function mapApiInstitutionalDonor(row: InstitutionalDonorApiRow): InstitutionalDonor {
    if ('organizationName' in row && isRecord(row.organizationName) && typeof row.organizationName.en === 'string') {
        const mapped = row as ApiInstitutionalDonor;
        return {
            ...mapped,
            contacts: mapped.contacts ?? [],
        };
    }

    const raw = row as Record<string, unknown>;
    const customFields = raw.custom_fields;
    const socialMedia = isRecord(customFields) && isRecord(customFields.social_media)
        ? customFields.social_media
        : undefined;
    const coordinates = isRecord(customFields) && isRecord(customFields.coordinates)
        ? customFields.coordinates
        : undefined;

    return {
        id: String(raw.id),
        organizationName: {
            en: String(raw.name_en || ''),
            ar: String(raw.name_ar || raw.name_en || ''),
        },
        logo: customString(customFields, 'logo') || '',
        type: (raw.type as InstitutionalDonor['type']) || 'Foundation',
        primaryContact: {
            name: String(raw.primary_contact_name || ''),
            email: String(raw.primary_contact_email || ''),
        },
        totalGrantsAwarded: Number(raw.totalGrantsAwarded) || 0,
        activeGrants: Number(raw.activeGrants) || 0,
        nextDeadline: typeof raw.nextDeadline === 'string' ? raw.nextDeadline : '',
        relationshipStatus: (raw.relationship_status as InstitutionalDonor['relationshipStatus'])
            || (raw.relationshipStatus as InstitutionalDonor['relationshipStatus'])
            || 'Prospect',
        focusAreas: asStringArray(raw.focus_areas ?? raw.focusAreas),
        geographicFocus: asStringArray(raw.geographic_focus ?? raw.geographicFocus),
        assignedManager: String(raw.assigned_manager || raw.assignedManager || ''),
        priority: (raw.priority as InstitutionalDonor['priority']) || 'Medium',
        country: String(raw.country || ''),
        lastContactDate: customString(customFields, 'last_contact_date') || toIso(raw.updated_at) || toIso(raw.created_at),
        createdDate: toIso(raw.createdDate) || toIso(raw.created_at),
        registrationNumber: customString(customFields, 'registration_number'),
        city: customString(customFields, 'city'),
        establishmentDate: customString(customFields, 'establishment_date'),
        phone: customString(customFields, 'phone'),
        website: customString(customFields, 'website'),
        address: customString(customFields, 'address'),
        socialMedia: socialMedia ? {
            linkedin: typeof socialMedia.linkedin === 'string' ? socialMedia.linkedin : undefined,
            twitter: typeof socialMedia.twitter === 'string' ? socialMedia.twitter : undefined,
            facebook: typeof socialMedia.facebook === 'string' ? socialMedia.facebook : undefined,
        } : undefined,
        coordinates: coordinates ? {
            lat: Number(coordinates.lat) || 0,
            lng: Number(coordinates.lng) || 0,
        } : undefined,
        contacts: Array.isArray(raw.contacts) ? raw.contacts as InstitutionalDonorContact[] : [],
    };
}

export const useInstitutionalDonors = () => useQuery({
    queryKey: INSTITUTIONAL_DONORS_QUERY_KEY,
    queryFn: async () => {
        const rows = await api.get<InstitutionalDonorApiRow[]>('/institutional-donors');
        return rows.map(mapApiInstitutionalDonor);
    },
});

export type CreateInstitutionalDonorInput = {
    name_en: string;
    name_ar: string;
    type: InstitutionalDonor['type'];
    relationship_status: InstitutionalDonor['relationshipStatus'];
    priority: InstitutionalDonor['priority'];
    assigned_manager: string;
    primary_contact_name: string;
    primary_contact_email: string;
    focus_areas: string[];
    geographic_focus: string[];
    country: string;
    custom_fields: Record<string, unknown>;
};

export const useCreateInstitutionalDonor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateInstitutionalDonorInput) =>
            mapApiInstitutionalDonor(await api.post<InstitutionalDonorApiRow>('/institutional-donors', input)),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: INSTITUTIONAL_DONORS_QUERY_KEY });
        },
    });
};

export const useUpdateInstitutionalDonor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (vars: { donorId: string; payload: Record<string, unknown> }) =>
            mapApiInstitutionalDonor(await api.patch<InstitutionalDonorApiRow>(`/institutional-donors/${vars.donorId}`, vars.payload)),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: INSTITUTIONAL_DONORS_QUERY_KEY });
        },
    });
};

export const useDeleteInstitutionalDonor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (donorId: string) => api.delete<{ ok: true }>(`/institutional-donors/${donorId}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: INSTITUTIONAL_DONORS_QUERY_KEY });
        },
    });
};

export const useInstitutionalDonorContacts = (donorId: string) => useQuery({
    queryKey: ['institutional-donor-contacts', donorId],
    queryFn: () => api.get<InstitutionalDonorContact[]>(`/institutional-donors/${donorId}/contacts`),
    enabled: !!donorId,
});

export const useCreateInstitutionalDonorContact = (donorId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Record<string, unknown>) => api.post<InstitutionalDonorContact>(`/institutional-donors/${donorId}/contacts`, payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['institutional-donor-contacts', donorId] });
            void queryClient.invalidateQueries({ queryKey: INSTITUTIONAL_DONORS_QUERY_KEY });
        },
    });
};

export const useDeleteInstitutionalDonorContact = (donorId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (contactId: string) => api.delete<{ ok: true }>(`/institutional-donors/${donorId}/contacts/${contactId}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['institutional-donor-contacts', donorId] });
            void queryClient.invalidateQueries({ queryKey: INSTITUTIONAL_DONORS_QUERY_KEY });
        },
    });
};

export const useInstitutionalDonorDocuments = (donorId: string) => useQuery({
    queryKey: ['institutional-donor-documents', donorId],
    queryFn: () => api.get<InstitutionalDonorDocument[]>(`/institutional-donors/${donorId}/documents`),
    enabled: !!donorId,
});

export const useUploadInstitutionalDonorDocument = (donorId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ file, label }: { file: File; label?: string }) => {
            const form = new FormData();
            form.append('file', file);
            if (label) form.append('label', label);
            return api.upload<InstitutionalDonorDocument>(`/institutional-donors/${donorId}/documents`, form);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['institutional-donor-documents', donorId] });
        },
    });
};

export const useDeleteInstitutionalDonorDocument = (donorId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (documentId: string) => api.delete<{ ok: true }>(`/institutional-donors/${donorId}/documents/${documentId}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['institutional-donor-documents', donorId] });
        },
    });
};

export const useInstitutionalDonorGrants = (donorId: string) => useQuery({
    queryKey: ['institutional-donor-grants', donorId],
    queryFn: () => api.get<InstitutionalGrant[]>(`/institutional-donors/${donorId}/grants`),
    enabled: !!donorId,
});
