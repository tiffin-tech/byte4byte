class Storage {
    static setToken(token) {
        localStorage.setItem('tiffintech_token', token);
    }

    static getToken() {
        return localStorage.getItem('tiffintech_token');
    }

    static removeToken() {
        localStorage.removeItem('tiffintech_token');
    }

    static setUser(user) {
        localStorage.setItem('tiffintech_user', JSON.stringify(user));
    }

    static getUser() {
        const user = localStorage.getItem('tiffintech_user');
        return user ? JSON.parse(user) : null;
    }

    static removeUser() {
        localStorage.removeItem('tiffintech_user');
    }

    static clear() {
        this.removeToken();
        this.removeUser();
    }
}

// Make it globally available
window.Storage = Storage;