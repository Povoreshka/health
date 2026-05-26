// src/api/users.api.js
// Используем прямой URL к бэкенду
const API_URL = process.env.REACT_APP_API_URL;

export const usersAPI = {
    getAll: async () => {
        try {
            const response = await fetch(`${API_URL}/users`);
            if (!response.ok) throw new Error('Failed to fetch users');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await fetch(`${API_URL}/users/${id}`);
            if (!response.ok) throw new Error('Failed to fetch user');
            const user = await response.json();
            
            // Трансформируем данные для единообразия с фронтендом
            return {
                ...user,
                workoutsPerWeek: user.workouts_per_week,
                waterReminder: user.water_reminder
            };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Регистрация через auth эндпоинт
    register: async (email, password, name) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Вход через auth эндпоинт
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Создание пользователя (используется для обновления данных после регистрации)
    create: async (userData) => {
        try {
            console.log('Creating/updating user with data:', userData);
            
            const userId = localStorage.getItem('userId');
            
            // Если есть ID, обновляем существующего пользователя
            if (userId) {
                return await usersAPI.update(userId, userData);
            }
            
            // Иначе создаем нового
            const backendData = {
                name: userData.name,
                age: userData.age,
                gender: userData.gender,
                height: userData.height,
                weight: userData.weight,
                experience: userData.experience,
                workouts_per_week: userData.workoutsPerWeek || userData.workouts_per_week || 3,
                goals: userData.goals || [],
                email: userData.email || null
            };
            
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(backendData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.id) {
                localStorage.setItem('userId', result.id);
                const existingUserData = JSON.parse(localStorage.getItem('userData') || '{}');
                const updatedUserData = {
                    ...existingUserData,
                    id: result.id,
                    ...userData
                };
                localStorage.setItem('userData', JSON.stringify(updatedUserData));
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    update: async (id, userData) => {
        try {
            const backendData = {
                name: userData.name,
                age: userData.age,
                gender: userData.gender,
                height: userData.height,
                weight: userData.weight,
                experience: userData.experience,
                workouts_per_week: userData.workoutsPerWeek || userData.workouts_per_week,
                email: userData.email,
                water_reminder: userData.waterReminder || userData.water_reminder || false
            };
            
            // Добавляем goals если есть
            if (userData.goals) {
                backendData.goals = userData.goals;
            }
            
            console.log('Updating user with data:', backendData);
            
            const response = await fetch(`${API_URL}/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendData)
            });
            
            if (!response.ok) throw new Error('Failed to update user');
            
            const result = await response.json();
            
            // Обновляем localStorage
            const existingUserData = JSON.parse(localStorage.getItem('userData') || '{}');
            const updatedUserData = {
                ...existingUserData,
                ...userData,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Смена пароля
    changePassword: async (id, currentPassword, newPassword) => {
        try {
            const response = await fetch(`${API_URL}/users/${id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to change password');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Получение статистики пользователя
    getStats: async (id) => {
        try {
            const response = await fetch(`${API_URL}/stats/${id}`);
            if (!response.ok) throw new Error('Failed to fetch user stats');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Получение активной программы пользователя
    getActiveProgram: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/users/${userId}/active-program`);
            if (!response.ok) throw new Error('Failed to fetch active program');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },
    
    // Установка активной программы
    setActiveProgram: async (userId, programId, selectedMuscleGroups) => {
        try {
            const response = await fetch(`${API_URL}/users/${userId}/active-program`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    program_id: programId, 
                    selected_muscle_groups: selectedMuscleGroups 
                })
            });
            if (!response.ok) throw new Error('Failed to set active program');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Удаление пользователя
    delete: async (id) => {
        try {
            const response = await fetch(`${API_URL}/users/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete user');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};