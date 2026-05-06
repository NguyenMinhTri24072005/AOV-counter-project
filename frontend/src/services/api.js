import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// INTERCEPTOR: Tự động đính kèm Token vào request nếu có
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
export const getCounters = (enemyIds, excludedIds = []) => apiClient.post('/matchups/recommend', { enemyIds, excludedIds });

// --- ROLES & CATEGORIES ---
export const getRoles = () => apiClient.get('/roles');
export const createRole = (data) => apiClient.post('/roles', data);
export const deleteRole = (id) => apiClient.delete(`/roles/${id}`);

export const getCategories = () => apiClient.get('/categories');
export const createCategory = (data) => apiClient.post('/categories', data);

// --- HEROES CRUD ---
export const updateHero = (id, data) => apiClient.put(`/heroes/${id}`, data);
export const deleteHero = (id) => apiClient.delete(`/heroes/${id}`);

// --- ITEMS CRUD ---
export const updateItem = (id, data) => apiClient.put(`/items/${id}`, data);
export const deleteItem = (id) => apiClient.delete(`/items/${id}`);

// --- MATCHUPS ---
export const createMatchup = (data) => apiClient.post('/matchups', data);

export default apiClient;