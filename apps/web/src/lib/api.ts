const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
    private token: string | null = null;
    private orgId: string | null = null;

    setToken(token: string | null) {
        this.token = token;
    }

    // Active organization sent on every request as x-org-id (drives backend org scoping
    // and platform-admin impersonation).
    setOrgId(orgId: string | null) {
        this.orgId = orgId;
    }

    private async request<T>(
        path: string,
        options: RequestInit = {},
        orgIdOverride?: string | null,
    ): Promise<T> {
        const isFormData = options.body instanceof FormData;
        const headers: Record<string, string> = {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers as Record<string, string> ?? {}),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const scopedOrgId = orgIdOverride !== undefined ? orgIdOverride : this.orgId;
        if (scopedOrgId) {
            headers['x-org-id'] = scopedOrgId;
        }

        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers,
            credentials: 'include',
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(body.error || `API error ${res.status}`);
        }

        // Handle 204 No Content and other empty-body successes without throwing.
        if (res.status === 204) {
            return undefined as T;
        }
        const text = await res.text();
        return (text ? JSON.parse(text) : undefined) as T;
    }

    get<T>(path: string, orgIdOverride?: string | null) {
        return this.request<T>(path, {}, orgIdOverride);
    }

    post<T>(path: string, body: unknown, orgIdOverride?: string | null) {
        return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) }, orgIdOverride);
    }

    upload<T>(path: string, body: FormData, orgIdOverride?: string | null) {
        return this.request<T>(path, { method: 'POST', body }, orgIdOverride);
    }

    patch<T>(path: string, body: unknown, orgIdOverride?: string | null) {
        return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, orgIdOverride);
    }

    delete<T>(path: string, orgIdOverride?: string | null) {
        return this.request<T>(path, { method: 'DELETE' }, orgIdOverride);
    }
}

export const api = new ApiClient();
