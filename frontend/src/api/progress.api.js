// src/api/progress.api.js
const API_URL = process.env.REACT_APP_API_URL;

export const progressAPI = {
    // Получить прогресс веса
    getWeightProgress: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/health/${userId}/weight-progress`);
            if (!response.ok) throw new Error('Failed to fetch weight progress');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    // Получить прогресс тренировок
    getWorkoutProgress: async (userId, period = 'month') => {
        try {
            const response = await fetch(`${API_URL}/workouts/stats/${userId}?period=${period}`);
            if (!response.ok) throw new Error('Failed to fetch workout progress');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    }
};