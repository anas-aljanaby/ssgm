import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ContactPerson, Language, Partner } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export const PARTNERS_QUERY_KEY = ['implementing-partners'] as const;

export interface PartnerCreateInput {
    name_en: string;
    name_ar: string;
    sector: Partner['sector'];
    status?: Partner['status'];
    country: string;
    city?: string;
    description?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    rating?: number;
    budget?: number;
    projectsCompleted?: number;
    projectsInProgress?: number;
    contacts?: ContactPerson[];
}

export interface ApiPartner {
    id: string;
    name_en: string;
    name_ar: string;
    logo: string;
    sector: Partner['sector'];
    status: Partner['status'];
    country: string;
    city: string;
    description: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    coordinates: { lat: number; lng: number } | null;
    rating: number;
    budget: number;
    projectsCompleted: number;
    projectsInProgress: number;
    contacts: ContactPerson[];
}

function asNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function asContacts(value: unknown): ContactPerson[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is ContactPerson => {
        return !!item && typeof item === 'object' && typeof (item as ContactPerson).id === 'string';
    });
}

function displayCountry(country: string, city: string): string {
    const trimmedCountry = country.trim();
    const trimmedCity = city.trim();
    if (trimmedCity) return `${trimmedCountry} · ${trimmedCity}`;
    return trimmedCountry;
}

export function mapApiPartnerToPartner(row: ApiPartner, language: Language = 'ar'): Partner {
    const nameAr = row.name_ar || row.name_en;
    const nameEn = row.name_en || row.name_ar;
    const displayName = language === 'ar' ? nameAr : nameEn;
    const logoSource = displayName || nameEn;

    return {
        id: row.id,
        name: displayName,
        logo: row.logo || logoSource.slice(0, 2).toUpperCase(),
        country: displayCountry(row.country, row.city),
        sector: row.sector,
        status: row.status,
        projectsCompleted: row.projectsCompleted,
        projectsInProgress: row.projectsInProgress,
        rating: asNumber(row.rating),
        budget: asNumber(row.budget),
        phone: row.phone || undefined,
        email: row.email || undefined,
        website: row.website || undefined,
        address: row.address || undefined,
        coordinates: row.coordinates,
        contacts: asContacts(row.contacts),
    };
}

export function mapPartnerToUpdatePayload(partner: Partner): Record<string, unknown> {
    const countryParts = partner.country.split('·').map((part) => part.trim());
    const country = countryParts[0] ?? partner.country;
    const city = countryParts.length > 1 ? countryParts.slice(1).join('·').trim() : '';

    return {
        sector: partner.sector,
        status: partner.status,
        country,
        city,
        phone: partner.phone ?? '',
        email: partner.email ?? '',
        website: partner.website ?? '',
        address: partner.address ?? '',
        rating: partner.rating,
        budget: partner.budget,
        projectsCompleted: partner.projectsCompleted,
        projectsInProgress: partner.projectsInProgress,
        contacts: partner.contacts ?? [],
        coordinates: partner.coordinates ?? null,
    };
}

export async function fetchPartnersList(language: Language): Promise<Partner[]> {
    const rows = await api.get<ApiPartner[]>('/implementing-partners');
    return rows.map((row) => mapApiPartnerToPartner(row, language));
}

export async function createPartnerApi(input: PartnerCreateInput, language: Language): Promise<Partner> {
    const row = await api.post<ApiPartner>('/implementing-partners', {
        name_en: input.name_en.trim(),
        name_ar: input.name_ar.trim(),
        sector: input.sector,
        status: input.status ?? 'قيد المراجعة',
        country: input.country.trim(),
        city: input.city?.trim() ?? '',
        description: input.description?.trim() ?? '',
        phone: input.phone?.trim() ?? '',
        email: input.email?.trim() ?? '',
        website: input.website?.trim() ?? '',
        address: input.address?.trim() ?? '',
        rating: input.rating ?? 0,
        budget: input.budget ?? 0,
        projectsCompleted: input.projectsCompleted ?? 0,
        projectsInProgress: input.projectsInProgress ?? 0,
        contacts: input.contacts ?? [],
    });
    return mapApiPartnerToPartner(row, language);
}

export async function updatePartnerApi(partner: Partner, language: Language): Promise<Partner> {
    const row = await api.patch<ApiPartner>(`/implementing-partners/${partner.id}`, mapPartnerToUpdatePayload(partner));
    return mapApiPartnerToPartner(row, language);
}

export async function deletePartnerApi(id: Partner['id']): Promise<void> {
    await api.delete<{ ok: true }>(`/implementing-partners/${id}`);
}

export const usePartners = (language: Language = 'ar') => {
    const { user, loading: authLoading } = useAuth();

    return useQuery({
        queryKey: [...PARTNERS_QUERY_KEY, language],
        queryFn: () => fetchPartnersList(language),
        enabled: !authLoading && !!user,
    });
};

export const useCreatePartner = (language: Language = 'ar') => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: PartnerCreateInput) => createPartnerApi(input, language),
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: PARTNERS_QUERY_KEY });
        },
    });
};

export const useUpdatePartner = (language: Language = 'ar') => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (partner: Partner) => updatePartnerApi(partner, language),
        onMutate: async (partner) => {
            await queryClient.cancelQueries({ queryKey: PARTNERS_QUERY_KEY });
            const previous = queryClient.getQueryData<Partner[]>([...PARTNERS_QUERY_KEY, language]);
            queryClient.setQueryData<Partner[]>([...PARTNERS_QUERY_KEY, language], (old) =>
                (old ?? []).map((row) => (row.id === partner.id ? partner : row)),
            );
            return { previous };
        },
        onSuccess: (updated) => {
            queryClient.setQueryData<Partner[]>([...PARTNERS_QUERY_KEY, language], (old) =>
                (old ?? []).map((row) => (row.id === updated.id ? updated : row)),
            );
        },
        onError: (_error, _input, context) => {
            queryClient.setQueryData([...PARTNERS_QUERY_KEY, language], context?.previous ?? []);
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: PARTNERS_QUERY_KEY });
        },
    });
};

export const useDeletePartner = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePartnerApi,
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: PARTNERS_QUERY_KEY });
        },
    });
};
