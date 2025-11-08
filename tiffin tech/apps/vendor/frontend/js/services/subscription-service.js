class SubscriptionService {
    static async getRequests(filter = 'all') {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUBSCRIPTION.REQUESTS}?filter=${filter}`, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch subscription requests');
            }

            return await response.json();
        } catch (error) {
            console.error('Get subscription requests error:', error);
            throw error;
        }
    }

    static async acceptRequest(requestId) {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUBSCRIPTION.ACCEPT_REQUEST.replace(':id', requestId)}`,
                {
                    method: 'POST',
                    headers: AuthService.getAuthHeaders()
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to accept subscription request');
            }

            return await response.json();
        } catch (error) {
            console.error('Accept subscription request error:', error);
            throw error;
        }
    }

    static async rejectRequest(requestId, reason = '') {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUBSCRIPTION.REJECT_REQUEST.replace(':id', requestId)}`,
                {
                    method: 'POST',
                    headers: AuthService.getAuthHeaders(),
                    body: JSON.stringify({ reason })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to reject subscription request');
            }

            return await response.json();
        } catch (error) {
            console.error('Reject subscription request error:', error);
            throw error;
        }
    }
}

// Make it globally available
window.SubscriptionService = SubscriptionService;