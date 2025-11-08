class PaymentService {
    static async getPaymentStats() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENTS.STATS}`, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch payment stats');
            }

            return await response.json();
        } catch (error) {
            console.error('Get payment stats error:', error);
            throw error;
        }
    }

    static async getReceipt(paymentId) {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENTS.RECEIPT.replace(':id', paymentId)}`,
                {
                    method: 'GET',
                    headers: AuthService.getAuthHeaders()
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch receipt');
            }

            return await response.json();
        } catch (error) {
            console.error('Get receipt error:', error);
            throw error;
        }
    }

    static async getPayments(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.month) queryParams.append('month', filters.month);
            if (filters.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod);
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);

            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENTS.LIST}?${queryParams.toString()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch payments');
            }

            return await response.json();
        } catch (error) {
            console.error('Get payments error:', error);
            throw error;
        }
    }
}

// Make it globally available
window.PaymentService = PaymentService;