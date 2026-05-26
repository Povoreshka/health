// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_URL = process.env.REACT_APP_API_URL;

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('weekly');
    const [weeklyData, setWeeklyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [quarterlyData, setQuarterlyData] = useState([]);
    const [yearlyData, setYearlyData] = useState([]);
    const [workoutDistribution, setWorkoutDistribution] = useState([]);
    const [weightProgress, setWeightProgress] = useState([]);
    const [streakData, setStreakData] = useState({ currentStreak: 0, bestStreak: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalStats, setTotalStats] = useState({
        totalWorkouts: 0,
        totalCalories: 0,
        totalMinutes: 0,
        avgDuration: 0
    });
    
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId') || '1';
    const isMounted = useRef(true);
    const isLoadingRef = useRef(false);

    // Функция для расчета калорий на основе типа тренировки и длительности
    const calculateCalories = useCallback((workoutType, durationMinutes) => {
        const caloriesPerMinute = {
            'strength': 6,
            'cardio': 8,
            'hiit': 10,
            'yoga': 4,
            'flexibility': 3,
            'recovery': 3,
            'stretching': 3,
            'default': 5
        };
        
        let normalizedType = (workoutType || '').toLowerCase();
        if (normalizedType.includes('сил')) normalizedType = 'strength';
        else if (normalizedType.includes('кард')) normalizedType = 'cardio';
        else if (normalizedType.includes('hiit')) normalizedType = 'hiit';
        else if (normalizedType.includes('йог')) normalizedType = 'yoga';
        else if (normalizedType.includes('растяж')) normalizedType = 'flexibility';
        else if (normalizedType.includes('восст')) normalizedType = 'recovery';
        
        const rate = caloriesPerMinute[normalizedType] || caloriesPerMinute.default;
        return Math.round(durationMinutes * rate);
    }, []);

    // Загрузка данных из localStorage и API
    const loadDashboardData = useCallback(async () => {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;
        
        try {
            if (isMounted.current) setLoading(true);
            
            let allWorkouts = [];
            
            // 1. Загружаем из localStorage (локальные тренировки)
            const localHistory = JSON.parse(localStorage.getItem('localWorkoutHistory') || '[]');
            if (localHistory.length > 0 && isMounted.current) {
                console.log('Loaded from localStorage:', localHistory.length, 'workouts');
                const localWithCalories = localHistory.map(workout => {
                    const durationMinutes = Math.floor((workout.duration || 0) / 60);
                    const calories = workout.calories_burned || calculateCalories(workout.type, durationMinutes);
                    return {
                        ...workout,
                        calories_burned: calories
                    };
                });
                allWorkouts.push(...localWithCalories);
            }
            
            // 2. Загружаем из API
            try {
                const response = await fetch(`${API_URL}/workouts/history/${userId}`);
                if (response.ok && isMounted.current) {
                    const apiWorkouts = await response.json();
                    console.log('Loaded from API:', apiWorkouts.length, 'workouts');
                    console.log('API workouts details:', apiWorkouts.map(w => ({ type: w.workout_type, name: w.workout_name })));
                    
                    const apiWithCalories = apiWorkouts.map(workout => {
                        const durationMinutes = Math.floor((workout.duration || 0) / 60);
                        const workoutType = workout.workout_type || workout.type || 'strength';
                        const calories = workout.calories_burned || calculateCalories(workoutType, durationMinutes);
                        return {
                            ...workout,
                            workout_type: workoutType,
                            type: workoutType,
                            calories_burned: calories
                        };
                    });
                    allWorkouts.push(...apiWithCalories);
                }
            } catch (err) {
                console.error('Error loading from API:', err);
            }
            
            // 3. Удаляем дубликаты по дате
            const uniqueWorkouts = [];
            const seenDates = new Set();
            for (const workout of allWorkouts) {
                const workoutDate = workout.date ? workout.date.split('T')[0] : null;
                if (workoutDate && !seenDates.has(workoutDate)) {
                    seenDates.add(workoutDate);
                    uniqueWorkouts.push(workout);
                }
            }
            
            // Сортируем по дате (от старых к новым)
            const sortedWorkouts = uniqueWorkouts.sort((a, b) => {
                if (!a.date || !b.date) return 0;
                return new Date(a.date) - new Date(b.date);
            });
            
            console.log('Total unique workouts:', sortedWorkouts.length);
            console.log('Workouts with types:', sortedWorkouts.map(w => ({ type: w.type || w.workout_type, name: w.workout_name })));
            
            // Загружаем записи здоровья
            let healthEntries = [];
            try {
                const healthResponse = await fetch(`${API_URL}/health/${userId}`);
                if (healthResponse.ok && isMounted.current) {
                    healthEntries = await healthResponse.json();
                    console.log('Health entries loaded:', healthEntries.length);
                }
            } catch (err) {
                console.error('Error loading health entries:', err);
            }
            
            if (isMounted.current) {
                processAllData(sortedWorkouts, healthEntries);
            }
            
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            if (isMounted.current) setError(err.message);
        } finally {
            isLoadingRef.current = false;
            if (isMounted.current) setLoading(false);
        }
    }, [userId, calculateCalories]);

    const processAllData = useCallback((history, healthEntries) => {
        calculateTotalStatistics(history);
        calculateStreak(history);
        processWeeklyData(history);
        processMonthlyData(history);
        processQuarterlyData(history);
        processYearlyData(history);
        processWorkoutDistribution(history);
        processWeightProgress(healthEntries);
    }, []);

    const calculateTotalStatistics = useCallback((history) => {
        const totalWorkouts = history.length;
        const totalCalories = history.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
        const totalMinutes = Math.floor(history.reduce((sum, w) => sum + (w.duration || 0), 0) / 60);
        const avgDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;
        
        setTotalStats({
            totalWorkouts,
            totalCalories,
            totalMinutes,
            avgDuration
        });
    }, []);

    const calculateStreak = useCallback((history) => {
        if (history.length === 0) {
            setStreakData({ currentStreak: 0, bestStreak: 0 });
            return;
        }
        
        const workoutDates = history
            .map(w => w.date ? w.date.split('T')[0] : null)
            .filter(d => d)
            .sort();
        const uniqueDates = [...new Set(workoutDates)];
        
        let currentStreak = 0;
        let bestStreak = 0;
        let streak = 0;
        
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const hasToday = uniqueDates.includes(today);
        const hasYesterday = uniqueDates.includes(yesterdayStr);
        
        if (hasToday || hasYesterday) {
            let checkDate = new Date();
            if (!hasToday) {
                checkDate.setDate(checkDate.getDate() - 1);
            }
            
            while (true) {
                const dateStr = checkDate.toISOString().split('T')[0];
                if (uniqueDates.includes(dateStr)) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }
        
        for (let i = 0; i < uniqueDates.length; i++) {
            if (i > 0) {
                const prevDate = new Date(uniqueDates[i - 1]);
                const currDate = new Date(uniqueDates[i]);
                const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    streak++;
                } else {
                    bestStreak = Math.max(bestStreak, streak + 1);
                    streak = 0;
                }
            }
        }
        bestStreak = Math.max(bestStreak, streak + 1);
        
        setStreakData({ currentStreak, bestStreak });
    }, []);

    const processWeeklyData = useCallback((history) => {
        const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weekly = weekDays.map((day, index) => {
            const dayWorkouts = history.filter(w => {
                if (!w.date) return false;
                const workoutDate = new Date(w.date);
                const dayOfWeek = (workoutDate.getDay() + 6) % 7;
                return dayOfWeek === index && workoutDate >= weekAgo;
            });
            
            return {
                day: day,
                тренировки: dayWorkouts.length,
                калории: dayWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0),
                время: Math.floor(dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / 60)
            };
        });
        
        setWeeklyData(weekly);
    }, []);

    const processMonthlyData = useCallback((history) => {
        if (history.length === 0) {
            setMonthlyData([
                { week: '1-7 день', тренировки: 0, калории: 0, время: 0 },
                { week: '8-14 день', тренировки: 0, калории: 0, время: 0 },
                { week: '15-21 день', тренировки: 0, калории: 0, время: 0 },
                { week: '22-31 день', тренировки: 0, калории: 0, время: 0 }
            ]);
            return;
        }
        
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const monthWorkouts = history.filter(w => {
            if (!w.date) return false;
            const workoutDate = new Date(w.date);
            return workoutDate.getMonth() === currentMonth && workoutDate.getFullYear() === currentYear;
        });
        
        const weekly = [
            { week: '1-7 день', тренировки: 0, калории: 0, время: 0 },
            { week: '8-14 день', тренировки: 0, калории: 0, время: 0 },
            { week: '15-21 день', тренировки: 0, калории: 0, время: 0 },
            { week: '22-31 день', тренировки: 0, калории: 0, время: 0 }
        ];
        
        monthWorkouts.forEach(w => {
            const day = new Date(w.date).getDate();
            let weekIndex = 0;
            if (day <= 7) weekIndex = 0;
            else if (day <= 14) weekIndex = 1;
            else if (day <= 21) weekIndex = 2;
            else weekIndex = 3;
            
            weekly[weekIndex].тренировки++;
            weekly[weekIndex].калории += (w.calories_burned || 0);
            weekly[weekIndex].время += Math.floor((w.duration || 0) / 60);
        });
        
        setMonthlyData(weekly);
    }, []);

    const processQuarterlyData = useCallback((history) => {
        const months = ['Январь', 'Февраль', 'Март'];
        const currentYear = new Date().getFullYear();
        
        const quarterly = months.map((month, index) => {
            const monthWorkouts = history.filter(w => {
                if (!w.date) return false;
                const workoutDate = new Date(w.date);
                return workoutDate.getMonth() === index && workoutDate.getFullYear() === currentYear;
            });
            
            return {
                month: month,
                тренировки: monthWorkouts.length,
                калории: monthWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0),
                время: Math.floor(monthWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / 60)
            };
        });
        
        setQuarterlyData(quarterly);
    }, []);

    const processYearlyData = useCallback((history) => {
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        const currentYear = new Date().getFullYear();
        
        const yearly = months.map((month, index) => {
            const monthWorkouts = history.filter(w => {
                if (!w.date) return false;
                const workoutDate = new Date(w.date);
                return workoutDate.getMonth() === index && workoutDate.getFullYear() === currentYear;
            });
            
            return {
                month: month,
                тренировки: monthWorkouts.length,
                калории: monthWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0),
                время: Math.floor(monthWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / 60)
            };
        });
        
        setYearlyData(yearly);
    }, []);

    // ИСПРАВЛЕННАЯ функция распределения тренировок по типам
    const processWorkoutDistribution = useCallback((history) => {
        console.log('=== processWorkoutDistribution ===');
        console.log('History length:', history.length);
        
        if (history.length === 0) {
            setWorkoutDistribution([
                { name: 'Нет данных', value: 100, color: '#e0e0e0' }
            ]);
            return;
        }
        
        const types = {};
        
        history.forEach((workout, index) => {
            // Получаем тип тренировки из разных возможных полей
            let type = workout.workout_type || workout.type || workout.workoutType || 'strength';
            
            // Приводим к строке и нижнему регистру
            let typeStr = String(type).toLowerCase().trim();
            
            console.log(`Workout ${index + 1}: type="${typeStr}", name="${workout.workout_name || workout.name}"`);
            
            // Нормализация типов
            if (typeStr === 'strength' || typeStr === 'силовая' || typeStr === 'силовые' || typeStr === 'силовая тренировка' || typeStr === 'силовая тренировка') {
                types['Силовые'] = (types['Силовые'] || 0) + 1;
            }
            else if (typeStr === 'cardio' || typeStr === 'кардио' || typeStr === 'кардиотренировка') {
                types['Кардио'] = (types['Кардио'] || 0) + 1;
            }
            else if (typeStr === 'hiit') {
                types['HIIT'] = (types['HIIT'] || 0) + 1;
            }
            else if (typeStr === 'yoga' || typeStr === 'йога') {
                types['Йога'] = (types['Йога'] || 0) + 1;
            }
            else if (typeStr === 'flexibility' || typeStr === 'растяжка' || typeStr === 'stretching') {
                types['Растяжка'] = (types['Растяжка'] || 0) + 1;
            }
            else if (typeStr === 'recovery' || typeStr === 'восстановление') {
                types['Восстановление'] = (types['Восстановление'] || 0) + 1;
            }
            else {
                // По умолчанию считаем силовыми
                console.log(`Unknown type "${typeStr}", defaulting to Силовые`);
                types['Силовые'] = (types['Силовые'] || 0) + 1;
            }
        });
        
        const typeColors = {
            'Силовые': '#FF6B6B',
            'Кардио': '#4ECDC4',
            'HIIT': '#96CEB4',
            'Йога': '#FFEAA7',
            'Растяжка': '#A8E6CF',
            'Восстановление': '#DDA0DD'
        };
        
        const distribution = Object.entries(types).map(([name, value]) => ({
            name: name,
            value: value,
            color: typeColors[name] || '#95A5A6'
        }));
        
        console.log('Final distribution:', distribution);
        
        setWorkoutDistribution(distribution);
    }, []);

    const processWeightProgress = useCallback((healthEntries) => {
        if (!healthEntries || healthEntries.length === 0) {
            setWeightProgress([]);
            return;
        }
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentEntries = healthEntries
            .filter(entry => entry.weight && new Date(entry.date) >= thirtyDaysAgo)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(entry => ({
                date: new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
                вес: entry.weight
            }));
        
        setWeightProgress(recentEntries);
    }, []);

    const getCurrentData = () => {
        switch(activeTab) {
            case 'weekly': return weeklyData;
            case 'monthly': return monthlyData;
            case 'quarterly': return quarterlyData;
            case 'yearly': return yearlyData;
            default: return weeklyData;
        }
    };

    const getXAxisKey = () => {
        switch(activeTab) {
            case 'weekly': return 'day';
            case 'monthly': return 'week';
            case 'quarterly': return 'month';
            case 'yearly': return 'month';
            default: return 'day';
        }
    };

    const getChartTitle = () => {
        switch(activeTab) {
            case 'weekly': return 'Активность по дням недели';
            case 'monthly': return 'Активность по неделям месяца';
            case 'quarterly': return 'Активность по месяцам (квартал)';
            case 'yearly': return 'Активность по месяцам (год)';
            default: return 'Активность';
        }
    };

    useEffect(() => {
        isMounted.current = true;
        loadDashboardData();
        
        return () => {
            isMounted.current = false;
        };
    }, [loadDashboardData]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Загрузка статистики...</p>
            </div>
        );
    }

    const currentData = getCurrentData();
    const xAxisKey = getXAxisKey();

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <button className="back-button" onClick={() => navigate('/home')}>
                    ← Назад
                </button>
                <div className="header-content">
                    <h1>📊 Статистика и прогресс</h1>
                    <p>Анализ ваших тренировок и достижений</p>
                </div>
            </div>

            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-icon">🏋️</div>
                    <div className="stat-info">
                        <div className="stat-value">{totalStats.totalWorkouts}</div>
                        <div className="stat-label">Всего тренировок</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-info">
                        <div className="stat-value">{totalStats.totalCalories.toLocaleString()}</div>
                        <div className="stat-label">Сожжено калорий</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-info">
                        <div className="stat-value">{totalStats.totalMinutes}</div>
                        <div className="stat-label">Минут тренировок</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-info">
                        <div className="stat-value">{totalStats.avgDuration}</div>
                        <div className="stat-label">Средняя длительность (мин)</div>
                    </div>
                </div>
            </div>

            <div className="streak-cards">
                <div className="streak-card current">
                    <div className="streak-icon">🔥</div>
                    <div className="streak-info">
                        <div className="streak-value">{streakData.currentStreak}</div>
                        <div className="streak-label">Текущая серия (дней)</div>
                    </div>
                </div>
                <div className="streak-card best">
                    <div className="streak-icon">🏆</div>
                    <div className="streak-info">
                        <div className="streak-value">{streakData.bestStreak}</div>
                        <div className="streak-label">Лучшая серия (дней)</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                {weightProgress.length > 0 && (
                    <div className="chart-container">
                        <h3>⚖️ Динамика веса</h3>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={weightProgress}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" stroke="#666" />
                                    <YAxis stroke="#666" domain={['auto', 'auto']} />
                                    <Tooltip formatter={(value) => [`${value} кг`, 'Вес']} />
                                    <Legend />
                                    <Line type="monotone" dataKey="вес" stroke="#FF6B6B" strokeWidth={3} dot={{ r: 4 }} name="Вес (кг)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="period-tabs">
                    <button className={`tab ${activeTab === 'weekly' ? 'active' : ''}`} onClick={() => setActiveTab('weekly')}>📅 Неделя</button>
                    <button className={`tab ${activeTab === 'monthly' ? 'active' : ''}`} onClick={() => setActiveTab('monthly')}>📆 Месяц</button>
                    <button className={`tab ${activeTab === 'quarterly' ? 'active' : ''}`} onClick={() => setActiveTab('quarterly')}>📊 Квартал</button>
                    <button className={`tab ${activeTab === 'yearly' ? 'active' : ''}`} onClick={() => setActiveTab('yearly')}>📈 Год</button>
                </div>

                <div className="charts-section">
                    <div className="chart-container">
                        <h3>📊 {getChartTitle()}</h3>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={currentData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey={xAxisKey} stroke="#666" />
                                    <YAxis yAxisId="left" stroke="#666" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#4ECDC4" />
                                    <Tooltip />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="калории" stroke="#667eea" strokeWidth={3} dot={{ r: 4 }} name="Калории" />
                                    <Line yAxisId="right" type="monotone" dataKey="время" stroke="#4ECDC4" strokeWidth={3} dot={{ r: 4 }} name="Время (мин)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="chart-container">
                        <h3>🥧 Распределение тренировок по типам</h3>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={workoutDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''} outerRadius={100} dataKey="value">
                                        {workoutDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(value, name, props) => [`${value} тренировок`, props.payload.name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="chart-container full-width">
                        <h3>📈 Количество тренировок и калорий</h3>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={currentData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey={xAxisKey} stroke="#666" />
                                    <YAxis yAxisId="left" stroke="#666" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="тренировки" fill="#8884d8" radius={[4, 4, 0, 0]} name="Кол-во тренировок" />
                                    <Bar yAxisId="right" dataKey="калории" fill="#82ca9d" radius={[4, 4, 0, 0]} name="Калории" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {totalStats.totalWorkouts === 0 && (
                    <div className="no-data-message">
                        <div className="no-data-icon">📭</div>
                        <h3>Нет данных для отображения</h3>
                        <p>Проведите несколько тренировок, чтобы увидеть статистику</p>
                        <button onClick={() => navigate('/programs')} className="start-workout-btn">Начать тренировку</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;