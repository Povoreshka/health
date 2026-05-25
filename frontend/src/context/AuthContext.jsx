// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { usersAPI } from '../api/users.api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        // Загружаем пользователя из localStorage
        const savedUser = localStorage.getItem('userData');
        const userId = localStorage.getItem('userId');
        const savedToken = localStorage.getItem('token');
        
        if (savedUser && userId) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                if (savedToken) setToken(savedToken);
                console.log('AuthContext: User loaded from localStorage', userData);
            } catch (err) {
                console.error('Error parsing saved user:', err);
                localStorage.removeItem('userData');
                localStorage.removeItem('userId');
                localStorage.removeItem('token');
            }
        }
        
        setLoading(false);
    }, []);

    // Регистрация нового пользователя
    const register = async (email, password, name) => {
        setError(null);
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка регистрации');
            }

            console.log('AuthContext: Registration successful', data);
            
            // Сохраняем данные пользователя
            setUser(data);
            localStorage.setItem('userData', JSON.stringify(data));
            localStorage.setItem('userId', data.id);
            
            return { success: true, data };
        } catch (error) {
            setError(error.message);
            console.error('AuthContext: Registration error', error.message);
            return { success: false, error: error.message };
        }
    };

    // Вход существующего пользователя
    const login = async (email, password) => {
        setError(null);
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Неверный email или пароль');
            }

            console.log('AuthContext: Login successful', data);
            
            // Сохраняем данные пользователя
            setUser(data);
            localStorage.setItem('userData', JSON.stringify(data));
            localStorage.setItem('userId', data.id);
            
            return { success: true, data };
        } catch (error) {
            setError(error.message);
            console.error('AuthContext: Login error', error.message);
            return { success: false, error: error.message };
        }
    };

    // Вход по ID (для тестирования)
    const loginById = async (userId) => {
        setError(null);
        try {
            const userData = await usersAPI.getById(userId);
            if (userData) {
                setUser(userData);
                localStorage.setItem('userData', JSON.stringify(userData));
                localStorage.setItem('userId', userId);
                return { success: true };
            }
            return { success: false, error: 'User not found' };
        } catch (error) {
            setError(error.message);
            return { success: false, error: error.message };
        }
    };

    // Выход из аккаунта
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('userData');
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userEmail');
        console.log('AuthContext: User logged out');
    };

    // Обновление данных пользователя
    const updateUser = async (updatedData) => {
        if (!user || !user.id) return { success: false, error: 'User not authenticated' };
        
        try {
            await usersAPI.update(user.id, updatedData);
            const updatedUser = { ...user, ...updatedData };
            setUser(updatedUser);
            localStorage.setItem('userData', JSON.stringify(updatedUser));
            return { success: true };
        } catch (error) {
            setError(error.message);
            return { success: false, error: error.message };
        }
    };

    // Смена пароля
    const changePassword = async (currentPassword, newPassword) => {
        if (!user || !user.id) return { success: false, error: 'User not authenticated' };
        
        setError(null);
        try {
            await usersAPI.changePassword(user.id, currentPassword, newPassword);
            return { success: true };
        } catch (error) {
            setError(error.message);
            return { success: false, error: error.message };
        }
    };

    // Обновление данных пользователя из API
    const refreshUser = async () => {
        if (!user || !user.id) return;
        
        try {
            const freshUser = await usersAPI.getById(user.id);
            if (freshUser) {
                setUser(freshUser);
                localStorage.setItem('userData', JSON.stringify(freshUser));
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    };

    const value = {
        user,
        setUser,  // <-- ДОБАВЛЯЕМ setUser В ЭКСПОРТ
        loading,
        error,
        token,
        isAuthenticated: !!user,
        register,
        login,
        loginById,
        logout,
        updateUser,
        changePassword,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};