const API_CONFIG = {
    BASE_URL: 'http://localhost:6999/api',
    ENDPOINTS: {
        HEALTH: '/health',
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            ME: '/auth/me'
        },
        VENDOR: {
            REGISTER: '/vendors/complete-registration',
            PROFILE: '/vendors/profile',
            DASHBOARD_STATS: '/vendors/dashboard/stats',
            UPDATE_PROFILE: '/vendors/profile'
        },
        SUBSCRIPTION: {
            REQUESTS: '/subscriptions/requests',
            ACCEPT_REQUEST: '/subscriptions/requests/:id/accept',
            REJECT_REQUEST: '/subscriptions/requests/:id/reject'
        },
        CUSTOMER: {
            ALL: '/customers',
            PAID: '/customers/paid',
            UNPAID: '/customers/unpaid',
            SEND_REMINDER: '/customers/:id/send-reminder'
        },
        ORDERS: {
            LOCATION_BREAKDOWN: '/orders/location-breakdown',
            TODAY: '/orders/today',
            EXTRA: '/orders/extra',
            REJECTED: '/orders/rejected'
        },
        PAYMENTS: {
            STATS: '/payments/stats',
            RECEIPT: '/payments/:id/receipt',
            LIST: '/payments'
        },
        ANNOUNCEMENTS: {
            CREATE: '/announcements',
            LIST: '/announcements',
            STATS: '/announcements/stats'
        },
        HOLIDAYS: {
            VENDOR: '/holidays/vendor',
            CREATE: '/holidays',
            DELETE: '/holidays/:id',
            CHECK: '/holidays/check'
        }
    }
};

// Make it globally available
window.API_CONFIG = API_CONFIG;