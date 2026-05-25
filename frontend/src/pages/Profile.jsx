// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../api/users.api';
import './Profile.css';

const API_URL = 'http://localhost:5000/api';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [waterReminder, setWaterReminder] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [achievements, setAchievements] = useState([]);
    const [achievementsLoading, setAchievementsLoading] = useState(false);
    const [statistics, setStatistics] = useState({
        totalWorkouts: 0,
        totalMinutes: 0,
        currentStreak: 0,
        bmi: null
    });
    const [statsLoading, setStatsLoading] = useState(false);
    const navigate = useNavigate();
    const [showAllAchievements, setShowAllAchievements] = useState(false);

    // Получаем ID пользователя из localStorage
    const getUserId = () => {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        return userData.id || localStorage.getItem('userId');
    };

    useEffect(() => {
        loadProfile();
        loadAchievements();
    }, []);

    // Отдельная функция для загрузки статистики после того, как userData загружен
    useEffect(() => {
        if (userData && userData.id) {
            loadStatistics();
        }
    }, [userData]);

    // Загрузка статистики тренировок из базы данных
    const loadStatistics = async () => {
        const userId = getUserId();
        if (!userId) return;
        
        setStatsLoading(true);
        try {
            const response = await fetch(`${API_URL}/workouts/history/${userId}`);
            if (!response.ok) throw new Error('Failed to load workouts');
            const workouts = await response.json();
            
            console.log('Loaded workouts:', workouts);
            
            // ВАЖНО: duration в базе хранится в СЕКУНДАХ, конвертируем в минуты
            let totalWorkouts = workouts.length;
            let totalMinutes = workouts.reduce((sum, workout) => {
                const durationInSeconds = parseInt(workout.duration) || 0;
                const durationInMinutes = Math.floor(durationInSeconds / 60);
                return sum + durationInMinutes;
            }, 0);
            
            // Вычисляем текущий стрик
            let currentStreak = 0;
            if (workouts.length > 0) {
                const uniqueDates = [...new Set(workouts.map(w => {
                    const date = new Date(w.date);
                    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
                }))].sort((a, b) => new Date(b) - new Date(a));
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = today.toISOString();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString();
                
                if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
                    currentStreak = 1;
                    let checkDate = new Date(today);
                    
                    for (let i = 1; i < uniqueDates.length; i++) {
                        checkDate.setDate(checkDate.getDate() - 1);
                        checkDate.setHours(0, 0, 0, 0);
                        const expectedStr = checkDate.toISOString();
                        
                        if (uniqueDates[i] === expectedStr) {
                            currentStreak++;
                        } else {
                            break;
                        }
                    }
                }
            }
            
            // Рассчитываем ИМТ из userData
            let bmi = null;
            if (userData) {
                // Пробуем взять рост и вес из разных полей
                const height = userData.height || userData.height_cm;
                const weight = userData.weight || userData.weight_kg;
                
                console.log('Calculating BMI with:', { height, weight, userData });
                
                if (height && weight && height > 0 && weight > 0) {
                    const heightInMeters = height / 100;
                    bmi = weight / (heightInMeters * heightInMeters);
                    bmi = Math.round(bmi * 10) / 10; // Округляем до 1 знака
                    console.log('BMI calculated:', bmi);
                } else if (userData.bmi) {
                    bmi = userData.bmi;
                    console.log('Using existing BMI:', bmi);
                }
            }
            
            setStatistics({
                totalWorkouts,
                totalMinutes,
                currentStreak,
                bmi: bmi
            });
            
            console.log('Statistics updated:', { 
                totalWorkouts, 
                totalMinutes, 
                currentStreak, 
                bmi,
                userDataHasHeight: !!userData?.height,
                userDataHasWeight: !!userData?.weight
            });
            
        } catch (err) {
            console.error('Error loading statistics:', err);
            setStatistics({
                totalWorkouts: 0,
                totalMinutes: 0,
                currentStreak: 0,
                bmi: null
            });
        } finally {
            setStatsLoading(false);
        }
    };

    // Загрузка достижений из базы данных
    const loadAchievements = async () => {
        const userId = getUserId();
        if (!userId) return;
        
        setAchievementsLoading(true);
        try {
            const response = await fetch(`${API_URL}/achievements/${userId}`);
            if (!response.ok) throw new Error('Failed to load achievements');
            const data = await response.json();
            
            const formattedAchievements = data.map(ach => ({
                id: ach.id,
                title: ach.title,
                description: ach.description,
                icon: ach.icon,
                unlocked: !!ach.unlocked_at,
                unlockedAt: ach.unlocked_at
            }));
            
            setAchievements(formattedAchievements);
        } catch (err) {
            console.error('Error loading achievements:', err);
            setAchievements([
                { id: 1, title: 'Первая тренировка', icon: '🏆', unlocked: true },
                { id: 2, title: '7 дней подряд', icon: '🔥', unlocked: false },
                { id: 3, title: '10 тренировок', icon: '💪', unlocked: false },
                { id: 4, title: '30 минут тренировки', icon: '⏱️', unlocked: false },
                { id: 5, title: 'ИМТ в норме', icon: '⚖️', unlocked: false },
                { id: 6, title: 'Месяц тренировок', icon: '📅', unlocked: false }
            ]);
        } finally {
            setAchievementsLoading(false);
        }
    };

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = getUserId();
            
            if (data && data.name) {
                setUserData(data);
                setWaterReminder(data.waterReminder || false);
            } else {
                navigate('/onboarding/1');
                return;
            }
            
            if (userId) {
                try {
                    const userFromApi = await usersAPI.getById(userId);
                    if (userFromApi) {
                        console.log('User from API:', userFromApi);
                        setUserData(prev => ({
                            ...prev,
                            ...userFromApi,
                            waterReminder: userFromApi.water_reminder || prev?.waterReminder || false
                        }));
                        setWaterReminder(userFromApi.water_reminder || false);
                    }
                } catch (err) {
                    console.error('Error loading user from API:', err);
                }
            }
            
        } catch (err) {
            console.error('Error loading profile:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!userData) return;
        
        setSaving(true);
        try {
            const userId = getUserId();
            
            // Рассчитываем ИМТ для сохранения
            let bmi = null;
            if (userData.height && userData.weight) {
                const heightInMeters = userData.height / 100;
                bmi = userData.weight / (heightInMeters * heightInMeters);
                bmi = Math.round(bmi * 10) / 10;
            }
            
            const updatedData = {
                ...userData,
                waterReminder: waterReminder,
                bmi: bmi,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('userData', JSON.stringify(updatedData));
            
            if (userId) {
                try {
                    await usersAPI.update(userId, {
                        name: userData.name,
                        age: userData.age,
                        gender: userData.gender,
                        height: userData.height,
                        weight: userData.weight,
                        experience: userData.experience,
                        workouts_per_week: userData.workoutsPerWeek || userData.workouts_per_week,
                        email: userData.email,
                        water_reminder: waterReminder
                    });
                    
                    // Обновляем ИМТ в статистике
                    setStatistics(prev => ({ ...prev, bmi: bmi }));
                } catch (err) {
                    console.error('Error updating user in API:', err);
                }
            }
            
            alert('✅ Профиль успешно обновлен!');
        } catch (err) {
            console.error('Error saving profile:', err);
            alert('❌ Ошибка при сохранении: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleWaterReminderToggle = async () => {
        const newValue = !waterReminder;
        setWaterReminder(newValue);
        
        const updatedData = {
            ...userData,
            waterReminder: newValue,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('userData', JSON.stringify(updatedData));
        
        const userId = getUserId();
        if (userId) {
            try {
                await usersAPI.update(userId, {
                    name: userData.name,
                    age: userData.age,
                    gender: userData.gender,
                    height: userData.height,
                    weight: userData.weight,
                    experience: userData.experience,
                    workouts_per_week: userData.workoutsPerWeek || userData.workouts_per_week,
                    email: userData.email,
                    water_reminder: newValue
                });
                console.log(`Water reminder ${newValue ? 'enabled' : 'disabled'} in database`);
            } catch (err) {
                console.error('Error updating water reminder in API:', err);
                setWaterReminder(!newValue);
                alert('Ошибка при сохранении настройки');
                return;
            }
        }
        
        if (newValue) {
            setShowNotification(true);
            setTimeout(() => {
                setShowNotification(false);
            }, 3000);
            
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    };

    const handleLogout = () => {
        if (window.confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('userData');
            localStorage.removeItem('userId');
            localStorage.removeItem('currentUser');
            navigate('/');
        }
    };

    const showWorkoutDetails = async () => {
        const userId = getUserId();
        if (!userId) return;
        
        try {
            const response = await fetch(`${API_URL}/workouts/history/${userId}`);
            if (!response.ok) throw new Error('Failed to load workouts');
            const workouts = await response.json();
            
            if (workouts.length === 0) {
                alert('У вас пока нет тренировок');
                return;
            }
            
            const details = workouts.map(w => {
                const date = new Date(w.date).toLocaleDateString('ru-RU');
                const name = w.workout_name || 'Тренировка';
                const durationSeconds = parseInt(w.duration) || 0;
                const durationMinutes = Math.floor(durationSeconds / 60);
                const type = w.workout_type || 'strength';
                return `${date}: ${name} - ${durationMinutes} мин (${durationSeconds} сек) [${type}]`;
            }).join('\n');
            
            const totalSeconds = workouts.reduce((sum, w) => sum + (parseInt(w.duration) || 0), 0);
            const totalMinutes = Math.floor(totalSeconds / 60);
            alert(`📊 Все тренировки (${workouts.length} шт., всего ${totalMinutes} мин / ${totalSeconds} сек):\n\n${details}`);
        } catch (err) {
            console.error('Error loading workouts:', err);
            alert('Ошибка при загрузке тренировок');
        }
    };

    // Функция для принудительного пересчета ИМТ
    const recalculateBMI = () => {
        if (userData && userData.height && userData.weight) {
            const heightInMeters = userData.height / 100;
            const bmi = userData.weight / (heightInMeters * heightInMeters);
            const roundedBMI = Math.round(bmi * 10) / 10;
            setStatistics(prev => ({ ...prev, bmi: roundedBMI }));
            console.log('BMI recalculated:', roundedBMI);
            alert(`ИМТ пересчитан: ${roundedBMI}`);
        } else {
            alert('Введите рост и вес для расчета ИМТ');
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="spinner"></div>
                <p>Загрузка профиля...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-error">
                <div className="error-container">
                    <p>❌ Ошибка: {error}</p>
                    <button onClick={loadProfile} className="retry-btn">Повторить</button>
                </div>
            </div>
        );
    }

    if (!userData) {
        return null;
    }

    const completedAchievements = achievements.filter(a => a.unlocked).length;
    const totalAchievements = achievements.length;

    return (
        <div className="profile-page">
            {showNotification && (
                <div className="notification-popup">
                    <div className="notification-content">
                        <span className="notification-icon">💧</span>
                        <div>
                            <h4>Включено!</h4>
                            <p>Теперь напоминания о воде будут приходить к вам</p>
                        </div>
                        <button 
                            className="notification-close"
                            onClick={() => setShowNotification(false)}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
            
            <div className="profile-header">
                <button className="back-button" onClick={() => navigate('/home')}>
                    ← 
                </button>
                <h1>Мой профиль</h1>
            </div>

            <div className="profile-content">
                <div className="profile-card">
                    <div className="profile-avatar">
                        <div className="avatar-circle">
                            {userData.name.charAt(0).toUpperCase()}
                        </div>
                        <h2>{userData.name}</h2>
                        <p className="member-since">
                            С нами с {new Date(userData.createdAt || Date.now()).toLocaleDateString('ru-RU')}
                        </p>
                    </div>

                    <div className="profile-form">
                        <div className="form-group">
                            <label>Имя</label>
                            <input
                                type="text"
                                value={userData.name}
                                onChange={(e) => setUserData({...userData, name: e.target.value})}
                                placeholder="Ваше имя"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={userData.email || ''}
                                onChange={(e) => setUserData({...userData, email: e.target.value})}
                                placeholder="Введите email"
                            />
                        </div>

                        <div className="form-group">
                            <label>Возраст</label>
                            <input
                                type="number"
                                value={userData.age || ''}
                                onChange={(e) => setUserData({...userData, age: parseInt(e.target.value)})}
                                placeholder="Ваш возраст"
                                min="10"
                                max="100"
                            />
                        </div>

                        <div className="form-group">
                            <label>Пол</label>
                            <div className="gender-select">
                                <button 
                                    className={`gender-btn ${userData.gender === 'male' ? 'active' : ''}`}
                                    onClick={() => setUserData({...userData, gender: 'male'})}
                                >
                                    👨 Мужской
                                </button>
                                <button 
                                    className={`gender-btn ${userData.gender === 'female' ? 'active' : ''}`}
                                    onClick={() => setUserData({...userData, gender: 'female'})}
                                >
                                    👩 Женский
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Уровень опыта</label>
                            <div className="experience-badges">
                                {[
                                    { id: 'beginner', label: 'Новичок' },
                                    { id: 'intermediate', label: 'Средний' },
                                    { id: 'advanced', label: 'Продвинутый' },
                                    { id: 'professional', label: 'Профессионал' }
                                ].map(level => (
                                    <button
                                        key={level.id}
                                        className={`experience-badge ${userData.experience === level.id ? 'active' : ''}`}
                                        onClick={() => setUserData({...userData, experience: level.id})}
                                    >
                                        {level.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Тренировок в неделю</label>
                            <div className="workouts-slider">
                                <input
                                    type="range"
                                    min="1"
                                    max="7"
                                    value={userData.workoutsPerWeek || userData.workouts_per_week || 3}
                                    onChange={(e) => setUserData({...userData, workoutsPerWeek: parseInt(e.target.value)})}
                                />
                                <div className="slider-value">
                                    {userData.workoutsPerWeek || userData.workouts_per_week || 3} раз в неделю
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Рост (см)</label>
                                <input
                                    type="number"
                                    min="100"
                                    max="250"
                                    value={userData.height || ''}
                                    onChange={(e) => {
                                        const newHeight = parseInt(e.target.value);
                                        setUserData({...userData, height: newHeight});
                                        // Пересчитываем ИМТ при изменении роста
                                        if (newHeight && userData.weight) {
                                            const heightInMeters = newHeight / 100;
                                            const bmi = userData.weight / (heightInMeters * heightInMeters);
                                            setStatistics(prev => ({ ...prev, bmi: Math.round(bmi * 10) / 10 }));
                                        }
                                    }}
                                    placeholder="Введите рост"
                                />
                            </div>

                            <div className="form-group">
                                <label>Вес (кг)</label>
                                <input
                                    type="number"
                                    min="30"
                                    max="200"
                                    value={userData.weight || ''}
                                    onChange={(e) => {
                                        const newWeight = parseInt(e.target.value);
                                        setUserData({...userData, weight: newWeight});
                                        // Пересчитываем ИМТ при изменении веса
                                        if (userData.height && newWeight) {
                                            const heightInMeters = userData.height / 100;
                                            const bmi = newWeight / (heightInMeters * heightInMeters);
                                            setStatistics(prev => ({ ...prev, bmi: Math.round(bmi * 10) / 10 }));
                                        }
                                    }}
                                    placeholder="Введите вес"
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="button"
                            className="recalc-bmi-button"
                            onClick={recalculateBMI}
                            
                        >
                            🔄 Пересчитать ИМТ
                        </button>
                    </div>

                    <div className="profile-actions">
                        <button 
                            className="save-button" 
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Сохранение...' : '💾 Сохранить изменения'}
                        </button>
                        <button className="logout-button" onClick={handleLogout}>
                            🚪 Выйти из аккаунта
                        </button>
                    </div>
                </div>

                <div className="right-column">
                    <div className="achievements-section">
                        <div className="section-header">
                            <h3>🏆 Мои награды</h3>
                            <span className="achievements-count">
                                {achievementsLoading
                                    ? '...'
                                    : `${completedAchievements}/${totalAchievements}`}
                            </span>
                        </div>

                        {achievementsLoading ? (
                            <div className="achievements-loading">
                                <div className="spinner-small"></div>
                                <p>Загрузка достижений...</p>
                            </div>
                        ) : (
                            <>
                                <div className="achievements-grid">
                                    {(showAllAchievements
                                        ? achievements
                                        : achievements.slice(0, 4)
                                    ).map(achievement => (
                                        <div
                                            key={achievement.id}
                                            className={`achievement-item ${
                                                achievement.unlocked ? 'unlocked' : 'locked'
                                            }`}
                                            title={achievement.description || ''}
                                        >
                                            <div className="achievement-icon">
                                                {achievement.icon || '🏆'}
                                            </div>
                                            <div className="achievement-info">
                                                <h4>{achievement.title}</h4>
                                                <p>
                                                    {achievement.unlocked ? (
                                                        <>
                                                            ✅ Получено{' '}
                                                            {achievement.unlockedAt &&
                                                                `• ${new Date(
                                                                    achievement.unlockedAt
                                                                ).toLocaleDateString('ru-RU')}`}
                                                        </>
                                                    ) : (
                                                        '🔒 Еще не получено'
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {achievements.length > 4 && (
                                    <button
                                        className={`show-more-achievements ${
                                            showAllAchievements ? 'opened' : ''
                                        }`}
                                        onClick={() =>
                                            setShowAllAchievements(!showAllAchievements)
                                        }
                                    >
                                        <span>
                                            {showAllAchievements
                                                ? 'Скрыть награды'
                                                : `Показать еще ${
                                                      achievements.length - 4
                                                  }`}
                                        </span>
                                        <span className="show-more-icon">
                                            {showAllAchievements ? '−' : '+'}
                                        </span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    <div className="water-reminder-section">
                        <div className="reminder-header">
                            <h3>💧 Напоминание о воде</h3>
                            <div className="toggle-switch">
                                <input
                                    type="checkbox"
                                    id="water-reminder"
                                    checked={waterReminder}
                                    onChange={handleWaterReminderToggle}
                                />
                                <label htmlFor="water-reminder" className="toggle-slider"></label>
                            </div>
                        </div>
                        <p className="reminder-description">
                            Получайте напоминания пить воду каждые 2 часа
                        </p>
                        
                        {waterReminder && (
                            <div className="reminder-settings">
                                <div className="setting-item">
                                    <span>⏰ Интервал:</span>
                                    <span>2 часа</span>
                                </div>
                                <div className="setting-item">
                                    <span>🌅 Время начала:</span>
                                    <span>09:00</span>
                                </div>
                                <div className="setting-item">
                                    <span>🌙 Время конца:</span>
                                    <span>21:00</span>
                                </div>
                                <div className="setting-item">
                                    <span>💧 Рекомендуемая норма:</span>
                                    <span>{Math.round((userData.weight || 70) * 0.03)} л/день</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="stats-summary">
                        <h3>📊 Краткая статистика</h3>
                        {statsLoading ? (
                            <div className="stats-loading">
                                <div className="spinner-small"></div>
                                <p>Загрузка статистики...</p>
                            </div>
                        ) : (
                            <>
                                <div className="stats-list">
                                    <div className="stat-item">
                                        <span className="stat-label">🏋️ Всего тренировок:</span>
                                        <span className="stat-value">{statistics.totalWorkouts}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">⏱️ Всего минут:</span>
                                        <span className="stat-value">{statistics.totalMinutes}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">🔥 Текущий стрик:</span>
                                        <span className="stat-value">{statistics.currentStreak} дней</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">⚖️ ИМТ:</span>
                                        <span className="stat-value">
                                            {statistics.bmi && !isNaN(statistics.bmi) && statistics.bmi > 0
                                                ? statistics.bmi.toFixed(1)
                                                : (userData?.height && userData?.weight 
                                                    ? (() => {
                                                        const h = userData.height / 100;
                                                        const b = userData.weight / (h * h);
                                                        return b.toFixed(1);
                                                    })()
                                                    : '—')}
                                        </span>
                                    </div>
                                </div>
                                
                                <button 
                                    className="details-button"
                                    onClick={showWorkoutDetails}
                                >
                                    📋 Показать все тренировки
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;