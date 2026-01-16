const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

/**
 * Server-side HTTP client for gateway API
 * Automatically attaches admin token
 */
class GatewayClient {
    async request(endpoint, options = {}) {
        const url = `${GATEWAY_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            ...options.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.message || error.error || 'Gateway request failed');
        }

        // Handle CSV/file downloads
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/csv')) {
            return response.text();
        }

        return response.json();
    }

    // System endpoints
    async getSystem() {
        return this.request('/admin/api/system');
    }

    async updateSystem(data) {
        return this.request('/admin/api/system', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // User endpoints
    async getUsers() {
        return this.request('/admin/api/users');
    }

    async updateUser(userId, data) {
        return this.request(`/admin/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async createUser(data) {
        return this.request('/admin/api/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteUser(userId, deleteUsageData = false) {
        return this.request(`/admin/api/users/${userId}?deleteUsageData=${deleteUsageData}`, {
            method: 'DELETE',
        });
    }

    async regenerateUserToken(userId) {
        return this.request(`/admin/api/users/${userId}/regenerate-token`, {
            method: 'POST',
        });
    }

    // Usage endpoints
    async getUsage(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/api/usage${query ? `?${query}` : ''}`);
    }

    // Logs endpoints
    async getLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/api/logs${query ? `?${query}` : ''}`);
    }

    // Reset endpoint
    async resetUsage(data) {
        return this.request('/admin/api/reset', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Export endpoint
    async exportData(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/api/export${query ? `?${query}` : ''}`);
    }
}

export const gatewayClient = new GatewayClient();
