class AuthService {
    static async login(loginData) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const result = await response.json();
            
            // Store token and user data
            if (result.data.token) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
            }

            return result;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static async register(registerData) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            const result = await response.json();
            
            // Store token and user data
            if (result.data.token) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
            }

            return result;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    static async getCurrentUser() {
        try {
            const token = Storage.getToken();
            if (!token) {
                throw new Error('No token found');
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.ME}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get user data');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Get user error:', error);
            throw error;
        }
    }

    static isAuthenticated() {
        return !!Storage.getToken();
    }

    static logout() {
        Storage.clear();
        window.location.href = 'login_singup.html';
    }

    static getAuthHeaders() {
        const token = Storage.getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Make it globally available
window.AuthService = AuthService;