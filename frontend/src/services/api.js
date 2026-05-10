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


// --- CÁC API CŨ ---
export const getHeroes = (page = 1, limit = 200) => apiClient.get(`/heroes?page=${page}&limit=${limit}`);
export const createHero = (heroData) => apiClient.post('/heroes', heroData);
export const getItems = () => apiClient.get('/items');
export const getCounters = (enemyIds = [], excludedIds = [], mode = 'standard', userId = null, page = 1, limit = 20) => apiClient.post('/matchups/recommend', { enemyIds, excludedIds, mode, userId, page, limit });

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

// Thay thế hàm getStrategies hiện tại bằng đoạn code này:
export const getStrategies = (mode = 'standard', userId = null, page = 1, limit = 20) => {
    return apiClient.post('/strategies/filter', { mode, userId, page, limit });
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

// ==========================================
// QUẢN LÝ NGƯỜI DÙNG (USER PROFILE)
// ==========================================
export const getAllUsers = () => apiClient.get('/users');
export const getUserProfile = () => apiClient.get('/users/profile');
export const updateUserInfo = (id, data) => apiClient.put(`/users/${id}`, data);
export const deleteUser = (id) => apiClient.delete(`/users/${id}`);
export const changePassword = (data) => apiClient.put('/users/change-password', data);

// --- CÁC API AUTH ---
export const loginUser = (data) => apiClient.post('/auth/login', data);
export const registerUser = (data) => apiClient.post('/auth/register', data);

// 🌟 BỔ SUNG 3 API QUÊN MẬT KHẨU
export const forgotPassword = (data) => apiClient.post('/auth/forgot-password', data);
export const verifyOtp = (data) => apiClient.post('/auth/verify-otp', data);
export const resetPassword = (data) => apiClient.post('/auth/reset-password', data);


export default apiClient;