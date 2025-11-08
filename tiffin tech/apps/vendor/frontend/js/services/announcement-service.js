class AnnouncementService {
    static async createAnnouncement(announcementData) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.CREATE}`, {
                method: 'POST',
                headers: AuthService.getAuthHeaders(),
                body: JSON.stringify(announcementData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create announcement');
            }

            return await response.json();
        } catch (error) {
            console.error('Create announcement error:', error);
            throw error;
        }
    }

    static async getAnnouncements(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);
            if (filters.status) queryParams.append('status', filters.status);

            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.LIST}?${queryParams.toString()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch announcements');
            }

            return await response.json();
        } catch (error) {
            console.error('Get announcements error:', error);
            throw error;
        }
    }

    static async getAnnouncementStats() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.STATS}`, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch announcement stats');
            }

            return await response.json();
        } catch (error) {
            console.error('Get announcement stats error:', error);
            throw error;
        }
    }
}

// Make it globally available
window.AnnouncementService = AnnouncementService;