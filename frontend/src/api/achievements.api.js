// src/api/achievements.api.js
const API_URL = process.env.REACT_APP_API_URL;

export const achievementsAPI = {
    // Получить достижения пользователя
    getUserAchievements: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/achievements/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch achievements');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    // Принудительно проверить и выдать достижения
    checkAchievements: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/achievements/check/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error('Failed to check achievements');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, newAchievements: [], count: 0 };
        }
    },

    // Диагностика - получить детальную информацию
    debugAchievements: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/debug/achievements/${userId}`);
            if (!response.ok) throw new Error('Failed to get debug info');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }
};