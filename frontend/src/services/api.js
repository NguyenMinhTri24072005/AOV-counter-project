import axios from 'axios'

const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
})

export const getHeroes = () => apiClient.get('/heroes');
export const createHero = (heroData) => apiClient.post('/heroes', heroData)
export const getItems = () => apiClient.get('/items');
export const getCounters = (enemyIds, excludedIds = []) => apiClient.post('/matchups/recommend', { enemyIds, excludedIds });
export default apiClient;