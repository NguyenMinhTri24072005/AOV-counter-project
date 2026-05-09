import axios from 'axios';


const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// INTERCEPTOR: Tự động đính kèm Token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// --- CÁC API AUTH ---
export const loginUser = (data) => apiClient.post('/auth/login', data);
export const registerUser = (data) => apiClient.post('/auth/register', data);

// --- CÁC API CŨ ---
export const getHeroes = () => apiClient.get('/heroes');
export const createHero = (heroData) => apiClient.post('/heroes', heroData);
export const getItems = () => apiClient.get('/items');
export const getCounters = (enemyIds, excludedIds = [], mode = 'standard', userId = null) => apiClient.post('/matchups/recommend', { enemyIds, excludedIds, mode, userId });

// --- ROLES & CATEGORIES ---
export const getRoles = () => apiClient.get('/roles');
export const createRole = (data) => apiClient.post('/roles', data);
export const deleteRole = (id) => apiClient.delete(`/roles/${id}`);

export const getCategories = () => apiClient.get('/categories');
export const createCategory = (data) => apiClient.post('/categories', data);
export const deleteCategory = (id) => apiClient.delete(`/categories/${id}`); // <-- THÊM DÒNG NÀY

// --- HEROES CRUD ---
export const updateHero = (id, data) => apiClient.put(`/heroes/${id}`, data);
export const deleteHero = (id) => apiClient.delete(`/heroes/${id}`);

// --- ITEMS CRUD (Đã bổ sung createItem) ---
export const createItem = (data) => apiClient.post('/items', data);
export const updateItem = (id, data) => apiClient.put(`/items/${id}`, data);
export const deleteItem = (id) => apiClient.delete(`/items/${id}`);

// --- MATCHUPS ---
export const createMatchup = (data) => apiClient.post('/matchups', data);

export const getMyMatchups = (userId) => apiClient.get(`/matchups/user/${userId}`);
export const deleteMatchup = (id) => apiClient.delete(`/matchups/${id}`);

// THÊM HÀM NÀY ĐỂ UPLOAD ẢNH
export const uploadImage = (formData) => apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

export const updateMatchup = (id, data) => apiClient.put(`/matchups/${id}`, data);
export const updateStrategy = (id, data) => apiClient.put(`/strategies/${id}`, data);
// ==========================================
// THÊM MỚI: API CHO CHIẾN THUẬT NÂNG CAO (STRATEGY)
// ==========================================

// Lấy danh sách chiến thuật nâng cao (Combo, Synergy, Kỹ năng)
export const getStrategies = (mode = 'standard', userId = null) => {
    return apiClient.post('/strategies/filter', { mode, userId }); // Sửa API thành apiClient
};

// Tạo chiến thuật nâng cao mới
export const createStrategy = (strategyData) => {
    return apiClient.post('/strategies', strategyData); // Sửa API thành apiClient
};

// Lấy chiến thuật nâng cao của user cụ thể
export const getMyStrategies = (userId) => {
    return apiClient.get(`/strategies/my/${userId}`); // Sửa API thành apiClient
};

// Xóa chiến thuật nâng cao
export const deleteStrategy = (id) => {
    return apiClient.delete(`/strategies/${id}`); // Sửa API thành apiClient
};

export default apiClient;