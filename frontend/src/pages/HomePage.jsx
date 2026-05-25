import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const API_URL = 'http://localhost:5000/api';

const HomePage = () => {
    const [userData, setUserData] = useState(null);
    const [todayWorkout, setTodayWorkout] = useState(null);
    const [weeklySchedule, setWeeklySchedule] = useState([]);
    const [workoutHistory, setWorkoutHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [availablePrograms, setAvailablePrograms] = useState([]);
    const [forceUpdate, setForceUpdate] = useState(0);
    const navigate = useNavigate();

    // Типы тренировок для выбора
    const workoutTypes = [
        { value: 'strength', label: '💪 Силовая', color: '#FF6B6B', programTypes: ['силовой', 'пауэрлифтинг', 'бодибилдинг'] },
        { value: 'cardio', label: '🏃 Кардио', color: '#4ECDC4', programTypes: ['кардио'] },
        { value: 'hiit', label: '⚡ HIIT', color: '#96CEB4', programTypes: ['hiit'] },
        { value: 'yoga', label: '🧘 Йога', color: '#FFEAA7', programTypes: ['йога'] },
        { value: 'flexibility', label: '🧘‍♂️ Растяжка', color: '#A8E6CF', programTypes: ['растяжка', 'мобильность'] },
        { value: 'recovery', label: '🌿 Восстановление', color: '#4CAF50', programTypes: ['восстановление'] },
        { value: 'rest', label: '😴 Отдых', color: '#DDA0DD', programTypes: [] }
    ];

    // Функция для расчета калорий
    const calculateCalories = useCallback((workoutType, durationMinutes) => {
        const caloriesPerMinute = {
            'yoga': 4,
            'strength': 6,
            'cardio': 8,
            'hiit': 10,
            'flexibility': 3,
            'recovery': 3,
            'default': 5
        };
        
        const rate = caloriesPerMinute[workoutType] || caloriesPerMinute.default;
        return Math.round(durationMinutes * rate);
    }, []);

    const getLevelLabel = (level) => {
        switch(level) {
            case 'beginner': return 'Новичок';
            case 'intermediate': return 'Продолжающий';
            case 'advanced': return 'Продвинутый';
            case 'professional': return 'Профессионал';
            default: return 'Новичок';
        }
    };

    const getLevelColor = (level) => {
        switch(level) {
            case 'beginner': return '#4CAF50';
            case 'intermediate': return '#2196F3';
            case 'advanced': return '#FF9800';
            case 'professional': return '#9C27B0';
            default: return '#4CAF50';
        }
    };

    const getWorkoutIcon = (type, customIcon) => {
        if (customIcon) return customIcon;
        const typeStr = String(type || '').toLowerCase();
        
        if (typeStr === 'yoga' || typeStr === 'йога') return '🧘';
        if (typeStr === 'strength' || typeStr === 'силовая' || typeStr === 'силовые') return '💪';
        if (typeStr === 'cardio' || typeStr === 'кардио') return '🏃';
        if (typeStr === 'hiit') return '⚡';
        if (typeStr === 'flexibility' || typeStr === 'растяжка') return '🧘‍♂️';
        if (typeStr === 'recovery' || typeStr === 'восстановление') return '🌿';
        if (typeStr === 'rest' || typeStr === 'отдых') return '😴';
        
        return '🏋️';
    };

    const getWorkoutColor = (type, customColor) => {
        if (customColor) return customColor;
        switch(type) {
            case 'strength': return '#FF6B6B';
            case 'cardio': return '#4ECDC4';
            case 'recovery': return '#4CAF50';
            case 'hiit': return '#96CEB4';
            case 'yoga': return '#FFEAA7';
            case 'flexibility': return '#A8E6CF';
            case 'rest': return '#DDA0DD';
            default: return '#95A5A6';
        }
    };

    const getDayName = (day) => {
        const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        return days[day];
    };

    // Синхронизация статусов тренировок с историей
    const syncWorkoutStatuses = useCallback((schedule, history) => {
        return schedule.map(workout => {
            if (workout.type === 'recovery') {
                return { ...workout, completed: true };
            }
            
            if (workout.type === 'rest') {
                return { ...workout, completed: true };
            }
            
            const currentDate = new Date();
            const today = currentDate.getDay();
            const dayDiff = workout.day - today;
            const targetDate = new Date();
            targetDate.setDate(currentDate.getDate() + dayDiff);
            targetDate.setHours(0, 0, 0, 0);
            const targetDateStr = targetDate.toISOString().split('T')[0];
            
            const isCompleted = history.some(historyWorkout => {
                const historyDate = historyWorkout.date ? historyWorkout.date.split('T')[0] : null;
                return historyDate === targetDateStr;
            });
            
            return { ...workout, completed: isCompleted };
        });
    }, []);

    // Загрузка программ из БД
    const loadPrograms = async () => {
        try {
            const response = await fetch(`${API_URL}/programs`);
            if (!response.ok) throw new Error('Failed to load programs');
            const data = await response.json();
            setAvailablePrograms(data);
            return data;
        } catch (err) {
            console.error('Error loading programs:', err);
            return [];
        }
    };

    // Фильтрация программ по типу тренировки
    const getFilteredProgramsByType = (workoutType) => {
        if (!workoutType || workoutType === 'rest' || workoutType === 'recovery') {
            return [];
        }
        
        const typeConfig = workoutTypes.find(t => t.value === workoutType);
        if (!typeConfig || !typeConfig.programTypes.length) {
            return availablePrograms;
        }
        
        return availablePrograms.filter(program => {
            const title = program.title.toLowerCase();
            return typeConfig.programTypes.some(keyword => title.includes(keyword));
        });
    };

    // ИСПРАВЛЕНО: Маппинг целей на типы программ с учетом уровня
    const getProgramsByGoalAndLevel = (goals, level, allPrograms) => {
        // Более точное сопоставление целей с программами
        const programMapping = {
            weight_loss: ['Кардио марафон', 'HIIT интенсив', 'Сушка и рельеф'],
            muscle_gain: ['Базовая сила', 'Бодибилдинг классик', 'Ударный режим PRO'],
            strength: ['Силовой пауэрлифтинг', 'Ударный режим PRO', 'Базовая сила'],
            endurance: ['Кардио марафон', 'HIIT интенсив', 'Функциональный тренинг'],
            health: ['Йога-трансформация', 'Домашний фитнес', 'Утренняя зарядка+'],
            flexibility: ['Йога-трансформация', 'Растяжка и мобильность', 'Вечерняя йога'],
            energy: ['Утренняя зарядка+', 'Кардио марафон', 'Домашний фитнес'],
            stress: ['Йога-трансформация', 'Вечерняя йога', 'Растяжка и мобильность']
        };
        
        const levelRequirements = {
            beginner: ['beginner'],
            intermediate: ['beginner', 'intermediate'],
            advanced: ['beginner', 'intermediate', 'advanced'],
            professional: ['beginner', 'intermediate', 'advanced', 'professional']
        };
        
        const allowedLevels = levelRequirements[level] || ['beginner', 'intermediate', 'advanced'];
        
        let matchedPrograms = [];
        
        // Если цели не указаны, используем здоровье как цель по умолчанию
        const effectiveGoals = goals.length === 0 ? ['health'] : goals;
        
        effectiveGoals.forEach(goal => {
            const goalPrograms = programMapping[goal] || [];
            goalPrograms.forEach(programName => {
                const program = allPrograms.find(p => p.title === programName && allowedLevels.includes(p.level));
                if (program && !matchedPrograms.find(mp => mp.id === program.id)) {
                    matchedPrograms.push(program);
                }
            });
        });
        
        // Если не найдено ни одной программы, берем базовые для уровня
        if (matchedPrograms.length === 0) {
            matchedPrograms = allPrograms.filter(p => allowedLevels.includes(p.level)).slice(0, 5);
        }
        
        return matchedPrograms;
    };

    // ИСПРАВЛЕНО: Функция для создания расписания с учетом выбранного количества тренировок
    const generateWeeklyScheduleFromPrograms = useCallback((goals, userLevel, workoutsPerWeek, programs, historyData, customSchedule = null) => {
        if (programs.length === 0) return [];
        
        if (customSchedule && customSchedule.length === 7) {
            return syncWorkoutStatuses(customSchedule, historyData);
        }
        
        const goalPrograms = getProgramsByGoalAndLevel(goals, userLevel, programs);
        
        // ИСПРАВЛЕНО: Логика распределения тренировок по дням недели
        const trainingDays = [];
        
        // Конвертируем workoutsPerWeek в число, если это строка
        let workoutsCount = parseInt(workoutsPerWeek);
        if (isNaN(workoutsCount)) workoutsCount = 4;
        
        // Распределяем тренировки равномерно по дням (1-5, исключая выходные где можно)
        if (workoutsCount <= 3) {
            // Мало тренировок - ставим в понедельник, среду, пятницу
            if (workoutsCount >= 1) trainingDays.push(1); // Пн
            if (workoutsCount >= 2) trainingDays.push(3); // Ср
            if (workoutsCount >= 3) trainingDays.push(5); // Пт
        } else if (workoutsCount <= 5) {
            // Среднее количество - Пн, Вт, Чт, Пт, Сб
            if (workoutsCount >= 1) trainingDays.push(1);
            if (workoutsCount >= 2) trainingDays.push(2);
            if (workoutsCount >= 3) trainingDays.push(4);
            if (workoutsCount >= 4) trainingDays.push(5);
            if (workoutsCount >= 5) trainingDays.push(6);
        } else {
            // Много тренировок - почти каждый день
            for (let i = 1; i <= Math.min(workoutsCount, 6); i++) {
                trainingDays.push(i);
            }
        }
        
        // Сортируем дни
        trainingDays.sort((a, b) => a - b);
        
        // Определяем дни восстановления
        const recoveryDays = [];
        for (let day = 1; day <= 6; day++) {
            if (!trainingDays.includes(day)) {
                recoveryDays.push(day);
            }
        }
        
        const workouts = [];
        let programIndex = 0;
        
        // ИСПРАВЛЕНО: Определение типа тренировки на основе целей пользователя
        const getWorkoutTypeByGoalAndDay = (goal, day, level) => {
            // Приоритет целей
            if (goal.includes('flexibility') || goal.includes('yoga')) {
                return 'yoga';
            }
            if (goal.includes('weight_loss')) {
                // Для похудения чередуем кардио и силовые
                return day % 2 === 0 ? 'cardio' : 'strength';
            }
            if (goal.includes('muscle_gain')) {
                return 'strength';
            }
            if (goal.includes('strength')) {
                return 'strength';
            }
            if (goal.includes('endurance')) {
                return day % 2 === 0 ? 'cardio' : 'hiit';
            }
            if (goal.includes('stress') || goal.includes('health')) {
                return 'yoga';
            }
            return 'strength';
        };
        
        // Основные цели пользователя
        const primaryGoal = goals.length > 0 ? goals[0] : 'health';
        
        for (let day = 0; day <= 6; day++) {
            const isTrainingDay = trainingDays.includes(day);
            const isRecoveryDay = recoveryDays.includes(day) && !isTrainingDay;
            
            if (day === 0) { // Воскресенье - всегда отдых или восстановление
                workouts.push({
                    day: day,
                    name: 'Отдых',
                    type: 'rest',
                    duration: 0,
                    completed: true,
                    intensity: 'low',
                    color: '#DDA0DD',
                    icon: '😴',
                    isTrainingDay: false,
                    canEdit: true
                });
                continue;
            }
            
            if (isTrainingDay && workoutsCount > 0) {
                // Определяем тип тренировки для этого дня
                let workoutType = getWorkoutTypeByGoalAndDay(primaryGoal, day, userLevel);
                
                // Ищем подходящую программу
                let selectedProgram = null;
                
                // Сначала ищем программу по типу
                for (const program of goalPrograms) {
                    const title = program.title.toLowerCase();
                    if (workoutType === 'strength' && (title.includes('силовой') || title.includes('пауэрлифтинг') || title.includes('бодибилдинг'))) {
                        selectedProgram = program;
                        break;
                    } else if (workoutType === 'cardio' && (title.includes('кардио'))) {
                        selectedProgram = program;
                        break;
                    } else if (workoutType === 'hiit' && (title.includes('hiit'))) {
                        selectedProgram = program;
                        break;
                    } else if (workoutType === 'yoga' && (title.includes('йога'))) {
                        selectedProgram = program;
                        break;
                    }
                }
                
                // Если не нашли, берем любую программу из списка
                if (!selectedProgram && goalPrograms.length > 0) {
                    selectedProgram = goalPrograms[programIndex % goalPrograms.length];
                    programIndex++;
                }
                
                // Если все еще нет программы, создаем базовую
                if (!selectedProgram) {
                    selectedProgram = {
                        title: workoutType === 'strength' ? 'Силовая тренировка' :
                                workoutType === 'cardio' ? 'Кардио тренировка' :
                                workoutType === 'hiit' ? 'HIIT тренировка' : 'Функциональная тренировка',
                        intensity: userLevel === 'beginner' ? 'medium' : 'high',
                        id: null
                    };
                }
                
                const getDurationByLevel = (baseDuration, level) => {
                    switch(level) {
                        case 'beginner': return 40;
                        case 'intermediate': return 50;
                        case 'advanced': return 60;
                        case 'professional': return 75;
                        default: return 45;
                    }
                };
                
                const duration = getDurationByLevel(45, userLevel);
                
                workouts.push({
                    day: day,
                    name: selectedProgram.title,
                    type: workoutType,
                    duration: duration,
                    programId: selectedProgram.id,
                    completed: false,
                    intensity: selectedProgram.intensity || 'medium',
                    color: getWorkoutColor(workoutType),
                    icon: getWorkoutIcon(workoutType),
                    isTrainingDay: true,
                    canEdit: true
                });
            } else if (isRecoveryDay) {
                const recoveryDuration = userLevel === 'beginner' ? 25 : userLevel === 'professional' ? 15 : 20;
                workouts.push({
                    day: day,
                    name: 'Активное восстановление',
                    type: 'recovery',
                    duration: recoveryDuration,
                    completed: true,
                    intensity: 'low',
                    color: '#4CAF50',
                    icon: '🌿',
                    isTrainingDay: false,
                    canEdit: true
                });
            } else if (day !== 0) {
                workouts.push({
                    day: day,
                    name: 'Отдых',
                    type: 'rest',
                    duration: 0,
                    completed: true,
                    intensity: 'low',
                    color: '#DDA0DD',
                    icon: '😴',
                    isTrainingDay: false,
                    canEdit: true
                });
            }
        }
        
        // Сортируем по дням и синхронизируем статусы
        const sortedWorkouts = workouts.sort((a, b) => a.day - b.day);
        return syncWorkoutStatuses(sortedWorkouts, historyData);
    }, [syncWorkoutStatuses]);

    // Функция для получения статуса тренировки
    const getWorkoutCompletionStatus = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const localFlag = localStorage.getItem(`workout_completed_${today}`);
        
        if (localFlag === 'true') {
            return true;
        }
        return false;
    }, []);

    // Основная функция загрузки данных
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const userId = localStorage.getItem('userId');
            
            if (!userId) {
                navigate('/onboarding/0');
                return;
            }
            
            // Загружаем данные пользователя из API
            let currentUser = null;
            try {
                const response = await fetch(`${API_URL}/users/${userId}`);
                if (response.ok) {
                    currentUser = await response.json();
                    localStorage.setItem('userData', JSON.stringify(currentUser));
                } else {
                    throw new Error('User not found');
                }
            } catch (err) {
                console.error('Error loading user from API:', err);
                // Пробуем загрузить из localStorage
                const userDataStr = localStorage.getItem('userData');
                if (userDataStr) {
                    currentUser = JSON.parse(userDataStr);
                } else {
                    navigate('/onboarding/0');
                    return;
                }
            }
            
            if (!currentUser || !currentUser.name) {
                navigate('/onboarding/0');
                return;
            }
            
            setUserData(currentUser);
            
            const programs = await loadPrograms();
            
            // ИСПРАВЛЕНО: Правильное получение целей и количества тренировок
            let userGoals = currentUser.goals || [];
            if (typeof userGoals === 'string') {
                try {
                    userGoals = JSON.parse(userGoals);
                } catch (e) {
                    userGoals = [userGoals];
                }
            }
            if (!Array.isArray(userGoals)) {
                userGoals = [userGoals];
            }
            
            // ИСПРАВЛЕНО: Получение количества тренировок в неделю
            let workoutsPerWeek = currentUser.workouts_per_week || currentUser.workoutsPerWeek || 4;
            if (typeof workoutsPerWeek === 'string') {
                workoutsPerWeek = parseInt(workoutsPerWeek);
            }
            
            const userLevel = currentUser.experience || 'beginner';
            
            // Загружаем историю тренировок
            let historyData = [];
            try {
                const historyResponse = await fetch(`${API_URL}/workouts/history/${currentUser.id}`);
                if (historyResponse.ok) {
                    const apiWorkouts = await historyResponse.json();
                    const processedWorkouts = apiWorkouts.map(workout => ({
                        id: workout.id,
                        date: workout.date ? workout.date.split('T')[0] : new Date().toISOString().split('T')[0],
                        workout_name: workout.workout_name || workout.name || 'Тренировка',
                        duration: workout.duration || 0,
                        type: workout.workout_type || workout.type || 'strength',
                        calories_burned: workout.calories_burned || 0
                    }));
                    historyData = processedWorkouts;
                }
            } catch (err) {
                console.error('Error loading workouts:', err);
            }
            
            setWorkoutHistory(historyData);
            
            // Генерируем расписание
            const savedSchedule = localStorage.getItem('customWeeklySchedule');
            let customSchedule = null;
            if (savedSchedule) {
                try {
                    customSchedule = JSON.parse(savedSchedule);
                } catch (e) {
                    console.error('Error parsing saved schedule:', e);
                }
            }
            
            console.log('Generating schedule with:', {
                goals: userGoals,
                level: userLevel,
                workoutsPerWeek: workoutsPerWeek,
                programsCount: programs.length
            });
            
            const generatedSchedule = generateWeeklyScheduleFromPrograms(
                userGoals, 
                userLevel, 
                workoutsPerWeek, 
                programs,
                historyData,
                customSchedule
            );
            
            setWeeklySchedule(generatedSchedule);
            
            // Определяем сегодняшнюю тренировку
            const todayNum = new Date().getDay();
            const todayWorkoutData = generatedSchedule.find(w => w.day === todayNum);
            const isWorkoutCompletedToday = getWorkoutCompletionStatus();
            
            if (todayWorkoutData) {
                setTodayWorkout({ 
                    ...todayWorkoutData, 
                    completed: isWorkoutCompletedToday || todayWorkoutData.completed 
                });
            }
            
        } catch (err) {
            console.error('Error loading data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [navigate, generateWeeklyScheduleFromPrograms, getWorkoutCompletionStatus]);

    // Сохранение пользовательского расписания
    const saveCustomSchedule = () => {
        localStorage.setItem('customWeeklySchedule', JSON.stringify(weeklySchedule));
        alert('✅ Расписание сохранено!');
        setShowEditModal(false);
    };

    // Обновление тренировки в расписании
    const updateWorkoutInSchedule = (day, field, value) => {
        const updatedSchedule = [...weeklySchedule];
        
        if (field === 'type') {
            const workoutType = workoutTypes.find(t => t.value === value);
            if (workoutType) {
                updatedSchedule[day] = {
                    ...updatedSchedule[day],
                    type: workoutType.value,
                    name: workoutType.label,
                    color: workoutType.color,
                    icon: workoutType.label.split(' ')[0],
                    duration: workoutType.value === 'rest' ? 0 : (workoutType.value === 'recovery' ? 25 : 45),
                    programId: null,
                    completed: workoutType.value === 'recovery' || workoutType.value === 'rest'
                };
            }
        } else if (field === 'programId') {
            const program = availablePrograms.find(p => p.id === parseInt(value));
            if (program) {
                let workoutType = 'strength';
                const title = program.title.toLowerCase();
                if (title.includes('йога')) workoutType = 'yoga';
                else if (title.includes('кардио')) workoutType = 'cardio';
                else if (title.includes('силовой')) workoutType = 'strength';
                else if (title.includes('hiit')) workoutType = 'hiit';
                else if (title.includes('растяжка')) workoutType = 'flexibility';
                
                updatedSchedule[day] = {
                    ...updatedSchedule[day],
                    name: program.title,
                    type: workoutType,
                    programId: program.id,
                    intensity: program.intensity,
                    color: program.color,
                    icon: program.icon,
                    duration: 45,
                    completed: updatedSchedule[day].completed || false
                };
            }
        }
        
        setWeeklySchedule(updatedSchedule);
    };

    // Начать тренировку
    const startWorkout = () => {
        if (todayWorkout && todayWorkout.type !== 'rest') {
            if (todayWorkout.type === 'recovery') {
                alert('🌿 Сегодня день восстановления!\n\nРекомендуемые активности:\n• Легкая растяжка (15-20 мин)\n• Спокойная прогулка\n• Дыхательные упражнения\n• Медитация\n\nОтличного восстановления! 🌿');
                return;
            }
            
            if (todayWorkout.completed) {
                alert('Вы уже выполнили эту тренировку сегодня! Отличная работа! 🎉');
                return;
            }
            if (todayWorkout.programId) {
                navigate(`/programs/${todayWorkout.programId}`);
            } else {
                navigate(`/workout/${todayWorkout.type}/${todayWorkout.day}`);
            }
        } else {
            alert('Сегодня день отдыха! Отличного восстановления 🌟');
        }
    };

    // Получение статистики
    const getWorkoutStats = () => {
        const totalWorkoutsThisWeek = weeklySchedule.filter(w => 
            w.type !== 'rest' && w.type !== 'recovery'
        ).length;
        
        const completedWorkoutsThisWeek = weeklySchedule.filter(w => 
            w.completed && w.type !== 'rest' && w.type !== 'recovery'
        ).length;
        
        return { totalWorkoutsThisWeek, completedWorkoutsThisWeek };
    };

    const getGoalBasedMessage = () => {
        const goals = userData?.goals || [];
        const level = userData?.experience || 'beginner';
        
        let message = '';
        if (goals.includes('weight_loss')) message = 'Продолжайте в том же духе! Каждая тренировка приближает вас к цели! 🔥';
        else if (goals.includes('muscle_gain')) message = 'Растим мышцы вместе! Не пропускайте тренировки! 💪';
        else if (goals.includes('strength')) message = 'Становимся сильнее день за днём! 🏋️';
        else if (goals.includes('endurance')) message = 'Развиваем выносливость! Вы сможете больше! 🏃';
        else if (goals.includes('flexibility')) message = 'Гибкость тела - здоровье духа! Продолжайте! 🧘';
        else if (goals.includes('stress')) message = 'Находите гармонию через практику! 🌿';
        else message = 'Продолжайте в том же духе! Отличная работа! 🌟';
        
        if (level === 'beginner') {
            message += ' Помните: регулярность важнее интенсивности! 🌱';
        } else if (level === 'advanced') {
            message += ' Вы на правильном пути! Продолжайте прогрессировать! 📈';
        } else if (level === 'professional') {
            message += ' Ваш уровень впечатляет! Не останавливайтесь на достигнутом! 🏆';
        }
        
        return message;
    };

    // Эффекты
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Эффект для обновления данных при возвращении на вкладку
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadData();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [loadData]);

    // Эффект для проверки завершения тренировки
    useEffect(() => {
        const checkWorkoutCompletion = () => {
            const today = new Date().toISOString().split('T')[0];
            const completed = localStorage.getItem(`workout_completed_${today}`);
            
            if (completed === 'true') {
                setWeeklySchedule(prev => 
                    prev.map(workout => {
                        const todayNum = new Date().getDay();
                        return {
                            ...workout,
                            completed: workout.day === todayNum ? true : workout.completed
                        };
                    })
                );
                
                setTodayWorkout(prev => {
                    if (prev) {
                        return { ...prev, completed: true };
                    }
                    return prev;
                });
            }
        };
        
        const interval = setInterval(checkWorkoutCompletion, 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="homepage-loading">
                <div className="spinner"></div>
                <p>Загрузка...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="homepage-error">
                <div className="error-container">
                    <p>❌ Ошибка: {error}</p>
                    <button onClick={loadData} className="retry-btn">Повторить</button>
                </div>
            </div>
        );
    }

    if (!userData) {
        return null;
    }

    const stats = getWorkoutStats();
    const goalMessage = getGoalBasedMessage();
    let userGoals = userData.goals || [];
    if (typeof userGoals === 'string') {
        try {
            userGoals = JSON.parse(userGoals);
        } catch (e) {
            userGoals = [userGoals];
        }
    }
    if (!Array.isArray(userGoals)) {
        userGoals = [userGoals];
    }
    
    let workoutsPerWeek = userData.workouts_per_week || userData.workoutsPerWeek || 4;
    if (typeof workoutsPerWeek === 'string') {
        workoutsPerWeek = parseInt(workoutsPerWeek);
    }
    
    const userLevel = userData.experience || 'beginner';

    const goalLabels = {
        weight_loss: 'Похудение',
        muscle_gain: 'Набор массы',
        strength: 'Сила',
        endurance: 'Выносливость',
        health: 'Здоровье',
        flexibility: 'Гибкость',
        energy: 'Энергия',
        stress: 'Релаксация'
    };

    const currentTodayWorkout = todayWorkout;

    return (
        <div className="homepage">
            <div className="shock-mode-banner">
                <div className="shock-mode-content">
                    <div className="shock-mode-icon">⚡</div>
                    <div className="shock-mode-info">
                        <h3>Ударный режим тренировок</h3>
                        <p>
                            {workoutsPerWeek} тренировок в неделю • 
                            <span style={{ color: getLevelColor(userLevel), marginLeft: '4px', marginRight: '4px' }}>
                                {getLevelLabel(userLevel)}
                            </span>
                            {userGoals.length > 0 && ` • Цель: ${userGoals.map(g => goalLabels[g]).join(', ')}`}
                        </p>
                    </div>
                    <div className="shock-mode-stats">
                        <div className="shock-stat">
                            <span className="stat-value2">{stats.completedWorkoutsThisWeek}/{stats.totalWorkoutsThisWeek}</span>
                            <span className="stat-label2">тренировок</span>
                        </div>
                        <div className="shock-stat">
                            <span className="stat-value2">{stats.totalWorkoutsThisWeek > 0 ? Math.round((stats.completedWorkoutsThisWeek / stats.totalWorkoutsThisWeek) * 100) : 0}%</span>
                            <span className="stat-label2">выполнено</span>
                        </div>
                        <button className="shock-mode-btn" onClick={() => navigate('/programs')}>
                            Программы →
                        </button>
                    </div>
                </div>
            </div>

            <div className="homepage-content">
                <div className="welcome-section">
                    <h1>Привет, {userData.name}! 👋</h1>
                    <p>{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>

                <div className="today-workout-section">
                    <h2>Сегодняшняя тренировка</h2>
                    {currentTodayWorkout && currentTodayWorkout.type !== 'rest' && currentTodayWorkout.type !== 'recovery' ? (
                        <div 
                            className={`today-workout-card ${currentTodayWorkout.completed ? 'completed' : ''}`}
                            style={{ 
                                borderLeftColor: currentTodayWorkout.completed ? '#4CAF50' : '#FFC107'
                            }}
                        >
                            <div className="workout-header">
                                <div className="workout-icon" style={{ backgroundColor: getWorkoutColor(currentTodayWorkout.type, currentTodayWorkout.color) + '20' }}>
                                    {getWorkoutIcon(currentTodayWorkout.type, currentTodayWorkout.icon)}
                                </div>
                                <div className="workout-info">
                                    <h3>{currentTodayWorkout.name}</h3>
                                    <div className="workout-meta">
                                        <span className="duration">⏱️ {currentTodayWorkout.duration} мин</span>
                                        {currentTodayWorkout.intensity && (
                                            <span className="intensity-badge" style={{ backgroundColor: 
                                                currentTodayWorkout.intensity === 'low' ? '#4CAF50' :
                                                currentTodayWorkout.intensity === 'medium' ? '#FF9800' :
                                                currentTodayWorkout.intensity === 'high' ? '#F44336' :
                                                currentTodayWorkout.intensity === 'very_high' ? '#9C27B0' : '#D32F2F'
                                            }}>
                                                {currentTodayWorkout.intensity === 'low' ? 'Низкая' :
                                                 currentTodayWorkout.intensity === 'medium' ? 'Средняя' :
                                                 currentTodayWorkout.intensity === 'high' ? 'Высокая' :
                                                 currentTodayWorkout.intensity === 'very_high' ? 'Очень высокая' : 'Экстремальная'}
                                            </span>
                                        )}
                                        <span className={`status ${currentTodayWorkout.completed ? 'completed' : 'pending'}`}>
                                            {currentTodayWorkout.completed ? '✅ Завершено' : '⏳ Ожидает'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="workout-actions">
                                <button 
                                    className="start-button"
                                    onClick={startWorkout}
                                    disabled={currentTodayWorkout.completed}
                                    style={{
                                        backgroundColor: currentTodayWorkout.completed ? '#4CAF50' : '#FFC107',
                                        cursor: currentTodayWorkout.completed ? 'default' : 'pointer'
                                    }}
                                >
                                    {currentTodayWorkout.completed ? '✅ Тренировка завершена' : '▶️ Начать тренировку'}
                                </button>
                            </div>
                        </div>
                    ) : currentTodayWorkout && currentTodayWorkout.type === 'recovery' ? (
                        <div className="today-workout-card recovery-day" style={{ borderLeftColor: '#4CAF50' }}>
                            <div className="workout-header">
                                <div className="workout-icon" style={{ backgroundColor: '#4CAF5020' }}>
                                    🌿
                                </div>
                                <div className="workout-info">
                                    <h3>{currentTodayWorkout.name}</h3>
                                    <div className="workout-meta">
                                        <span className="duration">🧘 Легкая активность • {currentTodayWorkout.duration} мин</span>
                                        <span className="status recovery">🌿 Восстановление</span>
                                    </div>
                                    <p className="recovery-tip">Рекомендации: легкая растяжка, прогулка на свежем воздухе, дыхательные упражнения</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="today-workout-card rest-day">
                            <div className="workout-header">
                                <div className="workout-icon" style={{ backgroundColor: '#DDA0DD20' }}>
                                    😴
                                </div>
                                <div className="workout-info">
                                    <h3>День отдыха</h3>
                                    <div className="workout-meta">
                                        <span className="duration">Отдых и восстановление</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="weekly-schedule-section">
                    <div className="section-header">
                        <h2>График на неделю ({workoutsPerWeek} тренировок • {getLevelLabel(userLevel)})</h2>
                        <div className="schedule-actions">
                            <button 
                                className="edit-schedule-btn" 
                                onClick={() => setShowEditModal(true)}
                            >
                                ✏️ Редактировать расписание
                            </button>
                            <button className="view-all" onClick={() => navigate('/programs')}>
                                Посмотреть всё →
                            </button>
                        </div>
                    </div>
                    <div className="weekly-grid">
                        {weeklySchedule.map((workout, index) => {
                            const today = new Date();
                            const todayDayNum = today.getDay();
                            
                            const dayDiff = workout.day - todayDayNum;
                            const targetDate = new Date();
                            targetDate.setDate(today.getDate() + dayDiff);
                            targetDate.setHours(0, 0, 0, 0);
                            
                            const isCompleted = workout.completed;
                            const isPastDay = targetDate < new Date(new Date().setHours(0, 0, 0, 0)) && !isCompleted && workout.type !== 'rest' && workout.type !== 'recovery';
                            const isToday = workout.day === todayDayNum && !isCompleted && workout.type !== 'recovery';
                            
                            let statusColor = '#e0e0e0';
                            let statusText = '';
                            
                            if (workout.type === 'recovery') {
                                statusColor = '#4CAF50';
                                statusText = 'Восстановление';
                            } else if (isCompleted) {
                                statusColor = '#4CAF50';
                                statusText = 'Выполнено';
                            } else if (isToday) {
                                statusColor = '#FFC107';
                                statusText = 'Сегодня';
                            } else if (isPastDay) {
                                statusColor = '#F44336';
                                statusText = 'Пропущено';
                            } else {
                                statusColor = '#95A5A6';
                                statusText = 'Предстоит';
                            }
                            
                            return (
                                <div 
                                    key={index}
                                    className={`day-card ${workout.day === todayDayNum ? 'today' : ''} ${isCompleted ? 'completed' : ''} ${isPastDay && !isCompleted ? 'missed' : ''}`}
                                    style={{ 
                                        backgroundColor: statusColor + '15',
                                        borderTop: `3px solid ${statusColor}`,
                                        transform: workout.day === todayDayNum ? 'scale(1.02)' : 'scale(1)'
                                    }}
                                >
                                    <div className="day-icon">{getWorkoutIcon(workout.type, workout.icon)}</div>
                                    <div className="day-info">
                                        <h4>{workout.name}</h4>
                                        <p className="day-name">{getDayName(workout.day)}</p>
                                        <p className="workout-duration">
                                            {workout.duration > 0 ? `${workout.duration} мин` : 'Отдых'}
                                        </p>
                                        <div className="status-badge-wrapper">
                                            <span className="status-badge-custom" style={{ backgroundColor: statusColor }}>
                                                {statusText}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="day-status">
                                        {workout.type === 'recovery' ? (
                                            <span className="status-icon recovery">🌿</span>
                                        ) : isCompleted ? (
                                            <span className="status-icon completed">✓</span>
                                        ) : workout.type === 'rest' ? (
                                            <span className="status-icon rest">💤</span>
                                        ) : isToday ? (
                                            <span className="status-icon today">●</span>
                                        ) : isPastDay ? (
                                            <span className="status-icon missed">!</span>
                                        ) : (
                                            <span className="status-icon upcoming">○</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {showEditModal && (
                    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>✏️ Редактирование расписания</h2>
                                <button className="close-modal" onClick={() => setShowEditModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p className="modal-description">
                                    Выберите тип тренировки или программу для каждого дня недели:
                                </p>
                                
                                {weeklySchedule.map((workout, index) => {
                                    const filteredPrograms = getFilteredProgramsByType(workout.type);
                                    
                                    return (
                                        <div key={index} className="schedule-edit-item">
                                            <div className="schedule-day">{getDayName(workout.day)}</div>
                                            <select 
                                                className="schedule-select"
                                                value={workout.type}
                                                onChange={(e) => updateWorkoutInSchedule(workout.day, 'type', e.target.value)}
                                            >
                                                {workoutTypes.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                            
                                            {workout.type !== 'rest' && workout.type !== 'recovery' && (
                                                <select 
                                                    className="schedule-select-program"
                                                    value={workout.programId || ''}
                                                    onChange={(e) => updateWorkoutInSchedule(workout.day, 'programId', e.target.value)}
                                                >
                                                    <option value="">Выбрать программу</option>
                                                    {filteredPrograms.map(program => (
                                                        <option key={program.id} value={program.id}>
                                                            {program.icon} {program.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    );
                                })}
                                
                                <div className="schedule-actions-modal">
                                    <button className="reset-schedule-btn" onClick={() => {
                                        if (window.confirm('Сбросить расписание к настройкам по умолчанию?')) {
                                            localStorage.removeItem('customWeeklySchedule');
                                            loadData();
                                            setShowEditModal(false);
                                        }
                                    }}>
                                        Сбросить к default
                                    </button>
                                    <button className="save-schedule-btn" onClick={saveCustomSchedule}>
                                        Сохранить расписание
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="quick-actions-section">
                <h2>Быстрый доступ</h2>
                <div className="quick-actions-grid">
                    <div className="quick-action" onClick={() => navigate('/programs')}>
                        <div className="action-icon">💪</div>
                        <h4>Тренировки</h4>
                        <p>Все программы</p>
                    </div>
                    <div className="quick-action" onClick={() => navigate('/nutrition')}>
                        <div className="action-icon">🥗</div>
                        <h4>Питание</h4>
                        <p>План питания</p>
                    </div>
                    <div className="quick-action" onClick={() => navigate('/health')}>
                        <div className="action-icon">📖</div>
                        <h4>Дневник</h4>
                        <p>Мои показатели</p>
                    </div>
                    <div className="quick-action" onClick={() => navigate('/dashboard')}>
                        <div className="action-icon">📊</div>
                        <h4>Прогресс</h4>
                        <p>Мои результаты</p>
                    </div>
                </div>
            </div>

            <div className="motivation-section">
                <div className="motivation-card">
                    <div className="motivation-icon">🔥</div>
                    <div className="motivation-content">
                        <h3>Держи темп!</h3>
                        <p>Вы уже на {stats.totalWorkoutsThisWeek > 0 ? Math.round((stats.completedWorkoutsThisWeek / stats.totalWorkoutsThisWeek) * 100) : 0}% к цели этой недели. {goalMessage}</p>
                    </div>
                </div>
            </div>

            {workoutHistory.length > 0 && (
                <div className="recent-results-section">
                    <h2>Последние тренировки</h2>
                    <div className="recent-results-list">
                        {workoutHistory.slice(0, 5).map((workout, index) => {
                            const durationMinutes = Math.floor((workout.duration || 0) / 60);
                            const workoutType = workout.workout_type || workout.type || 'strength';
                            const calories = workout.calories_burned || calculateCalories(workoutType, durationMinutes);
                            const workoutName = workout.workout_name || workout.name || 'Тренировка';
                            const workoutDate = workout.date ? new Date(workout.date).toLocaleDateString('ru-RU') : 'Дата неизвестна';
                            
                            return (
                                <div key={index} className="recent-result-item">
                                    <div className="result-icon">{getWorkoutIcon(workoutType)}</div>
                                    <div className="result-info">
                                        <h4>{workoutName}</h4>
                                        <p>{workoutDate}</p>
                                    </div>
                                    <div className="result-stats">
                                        <span className="result-duration">⏱️ {durationMinutes} мин</span>
                                        <span className="result-calories">🔥 {calories} ккал</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <nav className="bottom-nav">
                <button className="nav-item active" onClick={() => navigate('/home')}>
                    <span className="nav-icon">🏠</span>
                    <span className="nav-label">Главная</span>
                </button>
                <button className="nav-item" onClick={() => navigate('/programs')}>
                    <span className="nav-icon">📅</span>
                    <span className="nav-label">Программы</span>
                </button>
                <button className="nav-item" onClick={() => navigate('/nutrition')}>
                    <span className="nav-icon">🥗</span>
                    <span className="nav-label">Питание</span>
                </button>
                <button className="nav-item" onClick={() => navigate('/health')}>
                    <span className="nav-icon">📖</span>
                    <span className="nav-label">Дневник</span>
                </button>
                <button className="nav-item" onClick={() => navigate('/profile')}>
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Профиль</span>
                </button>
            </nav>
        </div>
    );
};

export default HomePage;