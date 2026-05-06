const API = {
    baseUrl: '/api',

    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        });

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        let data = null;
        let rawText = '';
        if (contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (_) {
                data = null;
            }
        } else {
            try {
                rawText = await response.text();
            } catch (_) {
                rawText = '';
            }
            // Bazı ortamlarda yanlış content-type gelebiliyor; JSON parse dene
            if (rawText) {
                try {
                    data = JSON.parse(rawText);
                } catch (_) {
                    data = null;
                }
            }
        }

        if (!response.ok) {
            if (response.status === 401) {
                const rawMsg = (data && data.msg) ? String(data.msg) : '';
                // Giriş: yanlış şifre vb. — JWT eksikliği değil; sunucu mesajını göster
                if (endpoint === '/auth/login' || endpoint.startsWith('/auth/login?')) {
                    const loginMap = {
                        'Invalid email or password': 'E-posta veya şifre hatalı.'
                    };
                    throw new Error(loginMap[rawMsg] || rawMsg || 'Giriş yapılamadı.');
                }
                localStorage.removeItem('token');
                window.dispatchEvent(new CustomEvent('unauthorized'));
                const jwt401Map = {
                    'Missing Authorization Header': 'Bu işlem için giriş yapmalısınız.',
                    'No token provided': 'Bu işlem için giriş yapmalısınız.',
                    'Token has expired': 'Oturumunuz sona erdi, lütfen tekrar giriş yapın.'
                };
                // JSON değilse büyük ihtimalle HTML (login sayfası / reverse proxy / 404 html)
                if (!rawMsg && rawText && rawText.trim().startsWith('<')) {
                    throw new Error('Oturumunuz sona erdi, lütfen tekrar giriş yapın.');
                }
                throw new Error(jwt401Map[rawMsg] || rawMsg || 'Bu işlem için giriş yapmalısınız.');
            }
            let errorMsg = (data && data.msg) ? data.msg : '';
            const errorMap = {
                'Missing Authorization Header': 'Bu işlem için giriş yapmalısınız.',
                'No token provided': 'Bu işlem için giriş yapmalısınız.',
                'Token has expired': 'Oturumunuz sona erdi, lütfen tekrar giriş yapın.',
                'Something went wrong': 'Bir hata oluştu'
            };
            errorMsg = errorMap[errorMsg] || errorMsg;
            if (!errorMsg) {
                if (rawText && rawText.trim().startsWith('<')) {
                    throw new Error('Sunucu beklenmeyen bir HTML yanıtı döndürdü.');
                }
                throw new Error('Sunucu yanıtı JSON değil veya okunamadı.');
            }
            throw new Error(errorMsg);
        }

        if (data == null) {
            // response.ok ama JSON parse edilemedi
            if (rawText && rawText.trim().startsWith('<')) {
                throw new Error('Sunucu JSON yerine HTML döndürdü (oturum düşmüş olabilir).');
            }
            throw new Error('Sunucu yanıtı JSON formatında değil.');
        }
        return data;
    },

    auth: {
        login: (email, password) => API.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }),
        register: (data) => API.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        me: () => API.request('/auth/me'),
        forgotPassword: (email) => API.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        }),
        resetPassword: (token, password) => API.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password })
        }),
        updateProfile: (data) => API.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        changePassword: (currentPassword, newPassword) => API.request('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
        })
    },

    customer: {
        getLocations: () => API.request('/customer/locations'),
        search: (q, il = '', ilce = '') => {
            let url = `/customer/search?q=${encodeURIComponent(q)}`;
            if (il) url += `&il=${encodeURIComponent(il)}`;
            if (ilce) url += `&ilce=${encodeURIComponent(ilce)}`;
            return API.request(url);
        },
        getBusinesses: (page = 1, params = {}) => {
            const qs = new URLSearchParams({ page, ...params }).toString();
            return API.request(`/customer/businesses?${qs}`);
        },
        getBusiness: (id) => API.request(`/customer/businesses/${id}`),
        getHotels: (page = 1, search = '') => API.request(`/customer/hotels?page=${page}&search=${search}`),
        getHotelRooms: (hotelId, page = 1) => API.request(`/customer/hotels/${hotelId}/rooms?page=${page}`),
        getServices: (page = 1, search = '', category = '') => API.request(`/customer/services?page=${page}&search=${search}&category=${category}`),
        getService: (id) => API.request(`/customer/services/${id}`),
        getAvailability: (serviceId, dateOrOpts = '') => {
            const params = new URLSearchParams();
            let date = '';
            let excludeReservationId = null;
            if (dateOrOpts && typeof dateOrOpts === 'object' && !Array.isArray(dateOrOpts)) {
                date = dateOrOpts.date || '';
                if (dateOrOpts.excludeReservationId != null && dateOrOpts.excludeReservationId !== '') {
                    excludeReservationId = dateOrOpts.excludeReservationId;
                }
            } else if (dateOrOpts) {
                date = String(dateOrOpts);
            }
            if (date) params.set('date', date);
            if (excludeReservationId != null && excludeReservationId !== '') {
                params.set('exclude_reservation_id', String(excludeReservationId));
            }
            const qs = params.toString();
            return API.request(`/customer/services/${serviceId}/availability${qs ? `?${qs}` : ''}`);
        },
        createReservation: (data) => {
            // Auto-prefix note with [lang:en] when UI is in English so backend mail uses correct language
            try {
                const lang = (window.i18n && window.i18n.getCurrentLang && window.i18n.getCurrentLang()) || 'tr';
                if (lang === 'en') {
                    const existing = data.note || '';
                    if (!existing.includes('[lang:en]')) {
                        data = { ...data, note: '[lang:en] ' + existing };
                    }
                }
            } catch (e) {}
            return API.request('/customer/reservations', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        getMyReservations: (page = 1) => API.request(`/customer/reservations?page=${page}`),
        cancelReservation: (id) => API.request(`/customer/reservations/${id}/cancel`, { method: 'POST' }),
        modifyReservation: (id, data) => API.request(`/customer/reservations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        partnerInquiry: async (data) => {
            const response = await fetch(`${API.baseUrl}/customer/partner-inquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            let d = {};
            try {
                d = await response.json();
            } catch (_) {
                throw new Error('Sunucu yanıtı okunamadı');
            }
            if (!response.ok) throw new Error(d.msg || 'Bir hata oluştu');
            return d;
        }
    },

    superadmin: {
        getBusinesses: (page = 1, search = '') => API.request(`/superadmin/businesses?page=${page}&search=${encodeURIComponent(search || '')}`),
        createBusiness: (data) => API.request('/superadmin/businesses', { method: 'POST', body: JSON.stringify(data) }),
        updateBusiness: (id, data) => API.request(`/superadmin/businesses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteBusiness: (id) => API.request(`/superadmin/businesses/${id}`, { method: 'DELETE' }),
        createBusinessOwner: (data) => API.request('/superadmin/business-owners', { method: 'POST', body: JSON.stringify(data) }),
        getUsers: (page = 1, search = '') => API.request(`/superadmin/users?page=${page}&search=${encodeURIComponent(search || '')}`),
        updateUser: (id, data) => API.request(`/superadmin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteUser: (id) => API.request(`/superadmin/users/${id}`, { method: 'DELETE' }),
        getLogs: (page = 1, search = '') => API.request(`/superadmin/logs?page=${page}&search=${search}`),
        statsOverview: () => API.request('/superadmin/stats/overview'),
        statsMonthly: () => API.request('/superadmin/stats/monthly'),
        statsByCategory: () => API.request('/superadmin/stats/by-category'),
        statsTopServices: () => API.request('/superadmin/stats/top-services'),
        deleteReview: (id) => API.request(`/superadmin/reviews/${id}`, { method: 'DELETE' })
    },

    business: {
        getMe: () => API.request('/business/me'),
        updateMe: (data) => API.request('/business/me', { method: 'PUT', body: JSON.stringify(data) }),
        getServices: () => API.request('/business/services'),
        createService: (data) => API.request('/business/services', { method: 'POST', body: JSON.stringify(data) }),
        updateService: (id, data) => API.request(`/business/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteService: (id) => API.request(`/business/services/${id}`, { method: 'DELETE' }),
        generateSlots: (id, data = {}) => API.request(`/business/services/${id}/generate-slots`, { method: 'POST', body: JSON.stringify(data) }),
        getAvailabilitySummary: (id) => API.request(`/business/services/${id}/availability-summary`),
        getSlots: (serviceId, date = '') => API.request(`/business/slots?service_id=${serviceId}${date ? `&date=${date}` : ''}`),
        createSlot: (data) => API.request('/business/slots', { method: 'POST', body: JSON.stringify(data) }),
        toggleSlot: (id) => API.request(`/business/slots/${id}/toggle`, { method: 'POST' }),
        getReservations: (page = 1, status = '') => API.request(`/business/reservations?page=${page}&status=${status}`),
        updateReservationStatus: (id, status) => API.request(`/business/reservations/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status })
        }),
        getStaff: () => API.request('/business/staff'),
        createStaff: (data) => API.request('/business/staff', { method: 'POST', body: JSON.stringify(data) }),
        updateStaff: (id, data) => API.request(`/business/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteStaff: (id) => API.request(`/business/staff/${id}`, { method: 'DELETE' }),
        createManualReservation: (data) => API.request('/business/reservations/manual', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        getStats: () => API.request('/business/stats')
    },

    staff: {
        getSchedule: (view = 'weekly') => API.request(`/staff/schedule?view=${view}`),
        getReservations: (page = 1, status = '') => API.request(`/staff/reservations?page=${page}&status=${status}`),
        getReservation: (id) => API.request(`/staff/reservations/${id}`),
        updateReservationStatus: (id, status) => API.request(`/staff/reservations/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status })
        }),
        getServices: () => API.request('/staff/services'),
        getSlots: (serviceId, date = '') => API.request(`/staff/slots?service_id=${serviceId}${date ? `&date=${date}` : ''}`),
        toggleSlot: (id) => API.request(`/staff/slots/${id}/toggle`, { method: 'POST' }),
        getAvailabilitySummary: (id) => API.request(`/staff/services/${id}/availability-summary`),
        generateSlots: (id, data = {}) => API.request(`/staff/services/${id}/generate-slots`, { method: 'POST', body: JSON.stringify(data) }),
        replyReview: (id, reply) => API.request(`/staff/reviews/${id}/reply`, {
            method: 'PUT',
            body: JSON.stringify({ reply })
        })
    },

    reviews: {
        create: (reservationId, data) => API.request(`/customer/reservations/${reservationId}/review`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        getForService: (serviceId) => API.request(`/customer/services/${serviceId}/reviews`)
    }
};
