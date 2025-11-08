class CustomerService {
    static async getAllCustomers(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.location) queryParams.append('location', filters.location);
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);

            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMER.ALL}?${queryParams.toString()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch customers');
            }

            return await response.json();
        } catch (error) {
            console.error('Get customers error:', error);
            throw error;
        }
    }

    static async getPaidCustomers(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);

            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMER.PAID}?${queryParams.toString()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch paid customers');
            }

            return await response.json();
        } catch (error) {
            console.error('Get paid customers error:', error);
            throw error;
        }
    }

    static async getUnpaidCustomers() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMER.UNPAID}`, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch unpaid customers');
            }

            return await response.json();
        } catch (error) {
            console.error('Get unpaid customers error:', error);
            throw error;
        }
    }

    static async sendPaymentReminder(customerId) {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMER.SEND_REMINDER.replace(':id', customerId)}`,
                {
                    method: 'POST',
                    headers: AuthService.getAuthHeaders()
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send payment reminder');
            }

            return await response.json();
        } catch (error) {
            console.error('Send payment reminder error:', error);
            throw error;
        }
    }
}

// Make it globally available
window.CustomerService = CustomerService;