// src/api/health.api.js

// Используем абсолютный URL к бэкенду
const API_URL = process.env.REACT_APP_API_URL;

export const healthAPI = {
    // Получить все записи здоровья пользователя
    getByUserId: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/health/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch health entries');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    // Получить записи здоровья за период
    getByDateRange: async (userId, startDate, endDate) => {
        try {
            const response = await fetch(`${API_URL}/health/${userId}/range?startDate=${startDate}&endDate=${endDate}`);
            if (!response.ok) throw new Error('Failed to fetch health entries range');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    // Создать запись здоровья
    create: async (entryData) => {
        try {
            const response = await fetch(`${API_URL}/health`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entryData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save health entry');
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Обновить запись здоровья (только id, userId не нужен)
    update: async (id, entryData) => {
        try {
            const response = await fetch(`${API_URL}/health/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entryData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update health entry');
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Удалить запись здоровья (только id, userId не нужен)
    delete: async (id) => {
        try {
            const response = await fetch(`${API_URL}/health/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete health entry');
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};