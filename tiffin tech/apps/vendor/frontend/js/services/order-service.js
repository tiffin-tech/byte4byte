class OrderService {
    static async getLocationBreakdown(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.date) queryParams.append('date', filters.date);
            if (filters.type) queryParams.append('type', filters.type);
            if (filters.period) queryParams.append('period', filters.period);

            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS.LOCATION_BREAKDOWN}?${queryParams.toString()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch location breakdown');
            }

            return await response.json();
        } catch (error) {
            console.error('Get location breakdown error:', error);
            throw error;
        }
    }

    static async getTodaysOrders() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS.TODAY}`, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch today\'s orders');
            }

            return await response.json();
        } catch (error) {
            console.error('Get today\'s orders error:', error);
            throw error;
        }
    }

    static async getExtraOrders() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS.EXTRA}`, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch extra orders');
            }

            return await response.json();
        } catch (error) {
            console.error('Get extra orders error:', error);
            throw error;
        }
    }

    static async getRejectedOrders(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.date) queryParams.append('date', filters.date);

            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS.REJECTED}?${queryParams.toString()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch rejected orders');
            }

            return await response.json();
        } catch (error) {
            console.error('Get rejected orders error:', error);
            throw error;
        }
    }
}

// Make it globally available
window.OrderService = OrderService;