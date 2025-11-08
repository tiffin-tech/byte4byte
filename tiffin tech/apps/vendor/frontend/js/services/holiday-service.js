class HolidayService {
    static async getHolidays() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HOLIDAYS.VENDOR}`, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch holidays');
            }

            return await response.json();
        } catch (error) {
            console.error('Get holidays error:', error);
            throw error;
        }
    }

    static async createHoliday(holidayData) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HOLIDAYS.CREATE}`, {
                method: 'POST',
                headers: AuthService.getAuthHeaders(),
                body: JSON.stringify(holidayData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create holiday');
            }

            return await response.json();
        } catch (error) {
            console.error('Create holiday error:', error);
            throw error;
        }
    }

    static async deleteHoliday(holidayId) {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HOLIDAYS.DELETE.replace(':id', holidayId)}`,
                {
                    method: 'DELETE',
                    headers: AuthService.getAuthHeaders()
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete holiday');
            }

            return await response.json();
        } catch (error) {
            console.error('Delete holiday error:', error);
            throw error;
        }
    }

    static async checkHoliday(date) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HOLIDAYS.CHECK}?date=${date}`, {
                method: 'GET',
                headers: AuthService.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to check holiday');
            }

            return await response.json();
        } catch (error) {
            console.error('Check holiday error:', error);
            throw error;
        }
    }
}

// Make it globally available
window.HolidayService = HolidayService;