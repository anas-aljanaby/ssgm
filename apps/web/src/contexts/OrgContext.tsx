import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrgRole } from '@gms/shared';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

export interface MeOrg {
    id: string;
    name: string;
    role: OrgRole;
    membership_id: string;
}

interface MeResponse {
    id: string;
    email: string;
    is_platform_admin: boolean;
    organizations: MeOrg[];
}

interface OrgContextType {
    ready: boolean;
    orgs: MeOrg[];
    activeOrgId: string | null;
    activeOrg: MeOrg | null;
    activeOrgName: string | null;
    role: OrgRole | null;
    isPlatformAdmin: boolean;
    // True when a platform admin is viewing an org they are not a member of.
    isImpersonating: boolean;
    setActiveOrg: (orgId: string | null, label?: string) => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

const ACTIVE_ORG_KEY = 'activeOrgId';
const ACTIVE_ORG_LABEL_KEY = 'activeOrgLabel';

export const OrgProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, session } = useAuth();
    const queryClient = useQueryClient();
    const hasToken = !!session?.access_token;

    const { data: me, isSuccess } = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get<MeResponse>('/me'),
        enabled: !!user && hasToken,
    });

    const [activeOrgId, setActiveOrgIdState] = useState<string | null>(
        () => localStorage.getItem(ACTIVE_ORG_KEY),
    );
    // Display label used when a platform admin enters an org they are not a member of.
    const [impersonationLabel, setImpersonationLabel] = useState<string | null>(
        () => localStorage.getItem(ACTIVE_ORG_LABEL_KEY),
    );

    const setActiveOrg = (orgId: string | null, label?: string) => {
        setActiveOrgIdState(orgId);
        setImpersonationLabel(label ?? null);
        if (orgId) {
            localStorage.setItem(ACTIVE_ORG_KEY, orgId);
        } else {
            localStorage.removeItem(ACTIVE_ORG_KEY);
        }
        if (label) {
            localStorage.setItem(ACTIVE_ORG_LABEL_KEY, label);
        } else {
            localStorage.removeItem(ACTIVE_ORG_LABEL_KEY);
        }
        api.setOrgId(orgId);
        // Org changed → all org-scoped data is stale.
        void queryClient.invalidateQueries();
    };

    // Default the active org to the user's first membership once /me resolves.
    useEffect(() => {
        if (!me) return;
        const isKnown = me.organizations.some((o) => o.id === activeOrgId);
        const staleImpersonation = !isKnown && me.is_platform_admin && !impersonationLabel;
        if (!activeOrgId || (!isKnown && !me.is_platform_admin) || staleImpersonation) {
            const fallback = me.organizations[0]?.id ?? null;
            if (fallback !== activeOrgId) {
                setActiveOrg(fallback);
            }
        }
    }, [me, activeOrgId, impersonationLabel]);

    // Keep the api client's org header in sync.
    useEffect(() => {
        api.setOrgId(activeOrgId);
    }, [activeOrgId]);

    const value = useMemo<OrgContextType>(() => {
        const orgs = me?.organizations ?? [];
        const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? null;
        const isPlatformAdmin = me?.is_platform_admin ?? false;
        const isImpersonating = isPlatformAdmin && !!activeOrgId && !activeOrg;
        return {
            ready: !hasToken || isSuccess,
            orgs,
            activeOrgId,
            activeOrg,
            activeOrgName: activeOrg?.name ?? (isImpersonating ? impersonationLabel : null),
            // Platform admins acting in a non-member org get admin-level access.
            role: activeOrg?.role ?? (isImpersonating ? 'admin' : null),
            isPlatformAdmin,
            isImpersonating,
            setActiveOrg,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [me, activeOrgId, hasToken, isSuccess, impersonationLabel]);

    return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};

export const useOrg = () => {
    const ctx = useContext(OrgContext);
    if (!ctx) throw new Error('useOrg must be used within OrgProvider');
    return ctx;
};
