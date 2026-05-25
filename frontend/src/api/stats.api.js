// src/api/stats.api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const statsAPI = {
    // Получить статистику пользователя
    getUserStats: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/users/${userId}/stats`);
            if (!response.ok) throw new Error('Failed to fetch user stats');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    // Получить статистику за период
    getStatsByPeriod: async (userId, startDate, endDate) => {
        try {
            const response = await fetch(`${API_URL}/workouts/stats/${userId}?startDate=${startDate}&endDate=${endDate}`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    }
};