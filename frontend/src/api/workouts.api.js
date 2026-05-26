// src/api/workouts.api.js
const API_URL = process.env.REACT_APP_API_URL;

export const workoutsAPI = {
    getHistory: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/workouts/history/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch workout history');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    create: async (workoutData) => {
        try {
            const response = await fetch(`${API_URL}/workouts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workoutData)
            });
            if (!response.ok) throw new Error('Failed to save workout');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};