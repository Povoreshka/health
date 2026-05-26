// src/api/exercises.api.js
const API_URL = process.env.REACT_APP_API_URL;

export const exercisesAPI = {
    // Получить все упражнения
    getAll: async () => {
        try {
            const response = await fetch(`${API_URL}/exercises`);
            if (!response.ok) throw new Error('Failed to fetch exercises');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Получить упражнение по ID
    getById: async (id) => {
        try {
            const response = await fetch(`${API_URL}/exercises/${id}`);
            if (!response.ok) throw new Error('Failed to fetch exercise');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Получить упражнения по группе мышц
    getByMuscleGroup: async (muscleGroup) => {
        try {
            const response = await fetch(`${API_URL}/exercises/muscle/${muscleGroup}`);
            if (!response.ok) throw new Error('Failed to fetch exercises');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Получить упражнения с фильтрацией
    getFiltered: async (filters) => {
        try {
            const params = new URLSearchParams(filters).toString();
            const response = await fetch(`${API_URL}/exercises/filter?${params}`);
            if (!response.ok) throw new Error('Failed to fetch exercises');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};