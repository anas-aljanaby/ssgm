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

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const isFormData = options.body instanceof FormData;
        const headers: Record<string, string> = {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers as Record<string, string> ?? {}),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (this.orgId) {
            headers['x-org-id'] = this.orgId;
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

        return res.json();
    }

    get<T>(path: string) {
        return this.request<T>(path);
    }

    post<T>(path: string, body: unknown) {
        return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
    }

    upload<T>(path: string, body: FormData) {
        return this.request<T>(path, { method: 'POST', body });
    }

    patch<T>(path: string, body: unknown) {
        return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
    }

    delete<T>(path: string) {
        return this.request<T>(path, { method: 'DELETE' });
    }
}

export const api = new ApiClient();
