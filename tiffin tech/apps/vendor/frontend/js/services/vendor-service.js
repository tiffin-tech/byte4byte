class VendorService {
    static async completeRegistration(vendorData) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VENDOR.REGISTER}`, {
                method: 'POST',
                headers: AuthService.getAuthHeaders(),
                body: JSON.stringify(vendorData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Vendor registration failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Vendor registration error:', error);
            throw error;
        }
    }

    static async getProfile() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VENDOR.PROFILE}`, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch vendor profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Get vendor profile error:', error);
            throw error;
        }
    }

    static async getDashboardStats() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VENDOR.DASHBOARD_STATS}`, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch dashboard stats');
            }

            return await response.json();
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            throw error;
        }
    }

    static async updateProfile(vendorData) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VENDOR.UPDATE_PROFILE}`, {
                method: 'PUT',
                headers: AuthService.getAuthHeaders(),
                body: JSON.stringify(vendorData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update vendor profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Update vendor profile error:', error);
            throw error;
        }
    }
}

// Make it globally available
window.VendorService = VendorService;