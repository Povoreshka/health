import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './WorkoutSession.css';

const API_URL = 'http://localhost:5000/api';

const WorkoutSession = () => {
    const navigate = useNavigate();
    const { type, day } = useParams();
    
    const [workoutData, setWorkoutData] = useState(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [completedExercises, setCompletedExercises] = useState([]);
    const [gifError, setGifError] = useState({});
    const [showGif, setShowGif] = useState(false);
    const [saving, setSaving] = useState(false);

    const isMounted = useRef(true);
    const timerRef = useRef(null);

    // Загрузка программы из БД
    useEffect(() => {
        const loadWorkout = async () => {
            try {
                const response = await fetch(`${API_URL}/programs`);
                const programs = await response.json();
                
                let program = programs.find(p => {
                    if (type === 'strength') return p.title.toLowerCase().includes('силовой');
                    if (type === 'cardio') return p.title.toLowerCase().includes('кардио');
                    if (type === 'hiit') return p.title.toLowerCase().includes('hiit');
                    if (type === 'yoga') return p.title.toLowerCase().includes('йога');
                    if (type === 'recovery') return p.title.toLowerCase().includes('восстановление');
                    return false;
                });
                
                if (!program && programs.length > 0) {
                    program = programs[0];
                }
                
                if (program) {
                    const exercisesResponse = await fetch(`${API_URL}/programs/${program.id}/exercises`);
                    const exercises = await exercisesResponse.json();
                    
                    setWorkoutData({
                        id: program.id,
                        type: type,
                        day: day,
                        name: program.title,
                        exercises: exercises
                    });
                } else {
                    setWorkoutData({
                        type: type,
                        day: day,
                        name: getWorkoutName(type),
                        exercises: getDemoExercises(type)
                    });
                }
                
                setStartTime(new Date());
            } catch (error) {
                console.error('Error loading workout:', error);
                setWorkoutData({
                    type: type,
                    day: day,
                    name: getWorkoutName(type),
                    exercises: getDemoExercises(type)
                });
                setStartTime(new Date());
            }
        };
        
        loadWorkout();
        
        return () => {
            isMounted.current = false;
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [type, day]);

    const getWorkoutName = (type) => {
        switch(type) {
            case 'strength': return 'Силовая тренировка';
            case 'cardio': return 'Кардио тренировка';
            case 'hiit': return 'HIIT тренировка';
            case 'yoga': return 'Йога практика';
            case 'recovery': return 'Восстановительная тренировка';
            default: return 'Тренировка';
        }
    };

    const getDemoExercises = (type) => {
        const exercises = {
            'strength': [
                { id: 1, name: 'Приседания', description: 'Базовое упражнение для ног', sets: 3, reps: '12-15', rest_time: 60, exercise_time: 60, muscleGroup: 'Ноги', tips: ['Держите спину прямой'] },
                { id: 2, name: 'Отжимания', description: 'Упражнение для груди', sets: 3, reps: '10-12', rest_time: 60, exercise_time: 60, muscleGroup: 'Грудь', tips: ['Корпус прямой'] }
            ],
            'cardio': [
                { id: 101, name: 'Бег на месте', description: 'Кардио упражнение', sets: 3, reps: '30 сек', rest_time: 30, exercise_time: 30, muscleGroup: 'Кардио' }
            ],
            'hiit': [
                { id: 201, name: 'Берпи', description: 'Интенсивное упражнение', sets: 3, reps: '10', rest_time: 30, exercise_time: 45, muscleGroup: 'Все тело' }
            ],
            'yoga': [
                { id: 301, name: 'Собака мордой вниз', description: 'Растяжка', sets: 2, reps: '30 сек', rest_time: 15, exercise_time: 30, muscleGroup: 'Растяжка' }
            ],
            'recovery': [
                { id: 401, name: 'Растяжка', description: 'Восстановление', sets: 2, reps: '30 сек', rest_time: 10, exercise_time: 30, muscleGroup: 'Растяжка' }
            ]
        };
        return exercises[type] || exercises['strength'];
    };

    const handleGifError = (exerciseId) => {
        if (isMounted.current) {
            setGifError(prev => ({
                ...prev,
                [exerciseId]: true
            }));
        }
    };

    const handleGifLoad = (exerciseId) => {
        if (isMounted.current) {
            setGifError(prev => ({
                ...prev,
                [exerciseId]: false
            }));
        }
    };

    const handleClose = () => {
        if (window.confirm('Вы уверены, что хотите завершить тренировку досрочно?')) {
            navigate('/home');
        }
    };

    const handleNext = useCallback(() => {
        if (!isMounted.current) return;
        
        setIsResting(false);
        setTimeLeft(0);
        setShowGif(false);
        
        if (!completedExercises.includes(currentExerciseIndex)) {
            setCompletedExercises(prev => [...prev, currentExerciseIndex]);
        }
        
        if (workoutData && currentExerciseIndex < workoutData.exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
            setCurrentSet(1);
        } else {
            handleCompleteWorkout();
        }
    }, [currentExerciseIndex, workoutData, completedExercises]);

    const handleCompleteWorkout = async () => {
        const endTime = new Date();
        const totalDurationSec = Math.floor((endTime - startTime) / 1000);
        
        console.log('=== STARTING WORKOUT COMPLETION ===');
        console.log('Workout Data:', workoutData);
        console.log('Total Duration (sec):', totalDurationSec);
        console.log('Completed Exercises:', completedExercises);
        
        setSaving(true);
        
        try {
            const userId = localStorage.getItem('userId');
            console.log('User ID from localStorage:', userId);
            
            if (!userId) {
                console.error('❌ No userId found in localStorage');
                alert('Ошибка: пользователь не найден. Пожалуйста, войдите снова.');
                // Всё равно отмечаем тренировку как выполненную локально
                markWorkoutLocally();
                setIsWorkoutComplete(true);
                return;
            }
            
            const today = new Date().toISOString().split('T')[0];
            const todayNum = new Date().getDay();
            
            const workoutResult = {
                user_id: parseInt(userId),
                workout_name: workoutData.name,
                duration: totalDurationSec,
                date: today,
                type: workoutData.type,
                day_of_week: todayNum,
                exercises_completed: completedExercises.length + 1,
                total_exercises: workoutData.exercises.length,
                calories_burned: Math.round((totalDurationSec / 60) * 8),
                avg_heart_rate: 130
            };
            
            console.log('📤 Sending workout data to server:', workoutResult);
            
            const response = await fetch(`${API_URL}/workouts`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(workoutResult)
            });
            
            console.log('📥 Response status:', response.status);
            console.log('📥 Response OK?', response.ok);
            
            if (response.ok) {
                const savedWorkout = await response.json();
                console.log('✅ Workout saved successfully on server:', savedWorkout);
                
                // Сохраняем отметку в localStorage
                markWorkoutLocally();
                
                alert('🎉 Поздравляем! Тренировка завершена и сохранена!');
                setIsWorkoutComplete(true);
            } else {
                const errorText = await response.text();
                console.error('❌ Server error:', response.status, errorText);
                alert(`⚠️ Тренировка завершена, но не сохранена на сервере.\nОшибка: ${response.status}\nДанные сохранены локально.`);
                
                // Даже если сервер вернул ошибку, сохраняем локально
                markWorkoutLocally();
                setIsWorkoutComplete(true);
            }
        } catch (error) {
            console.error('❌ Network error while saving workout:', error);
            alert('⚠️ Тренировка завершена! (Данные сохранены локально, синхронизация при следующем подключении)');
            
            // При ошибке сети всё равно отмечаем тренировку как выполненную локально
            markWorkoutLocally();
            setIsWorkoutComplete(true);
        } finally {
            setSaving(false);
            console.log('=== WORKOUT COMPLETION FINISHED ===');
        }
    };
    
    // Функция для локальной отметки тренировки
    const markWorkoutLocally = () => {
        const today = new Date().toISOString().split('T')[0];
        
        // Сохраняем несколько флагов для надежности
        localStorage.setItem(`workout_completed_${today}`, 'true');
        localStorage.setItem('workout_just_completed', 'true');
        localStorage.setItem('needRefreshHome', 'true');
        localStorage.setItem('lastWorkoutDate', today);
        localStorage.setItem('lastWorkoutName', workoutData.name);
        localStorage.setItem('workout_completed_timestamp', Date.now().toString());
        
        // Сохраняем в историю локально
        const localHistory = JSON.parse(localStorage.getItem('localWorkoutHistory') || '[]');
        localHistory.push({
            date: today,
            workout_name: workoutData.name,
            duration: Math.floor((new Date() - startTime) / 1000),
            type: workoutData.type,
            timestamp: Date.now()
        });
        localStorage.setItem('localWorkoutHistory', JSON.stringify(localHistory));
        
        console.log('✅ Workout marked as completed in localStorage');
        console.log('  - workout_completed_' + today + ' = true');
        console.log('  - workout_just_completed = true');
        console.log('  - needRefreshHome = true');
    };

    useEffect(() => {
        if (timeLeft > 0) {
            timerRef.current = setInterval(() => {
                if (isMounted.current) {
                    setTimeLeft(prev => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current);
                            if (isResting) {
                                handleNext();
                            }
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        }
        
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [timeLeft, isResting, handleNext]);

    const startRest = useCallback((seconds) => {
        if (isMounted.current) {
            setIsResting(true);
            setTimeLeft(seconds);
            setShowGif(false);
        }
    }, []);

    const startExercise = useCallback((seconds) => {
        if (isMounted.current) {
            setIsResting(false);
            setTimeLeft(seconds);
            setShowGif(true);
        }
    }, []);

    const nextSet = useCallback(() => {
        if (!isMounted.current || !workoutData) return;
        
        const currentExercise = workoutData.exercises[currentExerciseIndex];
        if (currentSet < currentExercise.sets) {
            setCurrentSet(prev => prev + 1);
            startRest(currentExercise.rest_time || 60);
            setShowGif(false);
        } else {
            handleNext();
        }
    }, [currentSet, workoutData, currentExerciseIndex, handleNext, startRest]);

    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }, []);

    const calculateProgress = useCallback(() => {
        if (!workoutData) return 0;
        const totalExercises = workoutData.exercises.length;
        const completedCount = completedExercises.length;
        return (completedCount / totalExercises) * 100;
    }, [workoutData, completedExercises]);

    const finishWorkout = () => {
        // Убеждаемся, что флаги установлены перед переходом
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`workout_completed_${today}`, 'true');
        localStorage.setItem('workout_just_completed', 'true');
        localStorage.setItem('needRefreshHome', 'true');
        localStorage.setItem('refreshHomeTimestamp', Date.now().toString());
        
        console.log('🏠 Navigating to home with flags set');
        
        // Переходим на главную
        navigate('/home');
    };

    if (!workoutData) {
        return (
            <div className="workout-session-loading">
                <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                </div>
                <p>Загрузка тренировки...</p>
            </div>
        );
    }

    const currentExercise = workoutData.exercises[currentExerciseIndex];
    const hasGifError = gifError[currentExercise?.id];

    if (isWorkoutComplete) {
        const totalDurationMin = Math.floor((new Date() - startTime) / 60000);
        const totalCalories = Math.floor(completedExercises.length * 35);
        
        return (
            <div className="workout-complete-page">
                <div className="workout-complete-content">
                    <div className="complete-animation">
                        <span className="complete-icon">🏆</span>
                    </div>
                    <h1>Тренировка завершена!</h1>
                    <p className="complete-message">Отличная работа! Вы сделали еще один шаг к своей цели.</p>
                    
                    <div className="workout-stats-summary">
                        <div className="stat-item">
                            <span className="stat-label">Выполнено упражнений:</span>
                            <span className="stat-value">{completedExercises.length + 1} из {workoutData.exercises.length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Время тренировки:</span>
                            <span className="stat-value">{totalDurationMin} мин</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Сожжено калорий:</span>
                            <span className="stat-value">{totalCalories} ккал</span>
                        </div>
                    </div>
                    
                    <div className="completion-actions">
                        <button className="primary-button" onClick={finishWorkout}>
                            На главную
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="workout-session">
            <div className="workout-header-modern">
                <button className="close-workout-btn" onClick={handleClose}>
                    ✕
                </button>
                <div className="header-content-modern">
                    <h1>{workoutData.name}</h1>
                    <div className="workout-meta">
                        <span className="meta-badge">День {workoutData.day}</span>
                        <span className="meta-badge">{workoutData.exercises.length} упражнений</span>
                    </div>
                </div>
                <div className="progress-indicator">
                    <div className="progress-text">
                        <span>Прогресс тренировки</span>
                        <span>{currentExerciseIndex + 1} / {workoutData.exercises.length}</span>
                    </div>
                    <div className="progress-bar-modern">
                        <div 
                            className="progress-fill-modern" 
                            style={{ width: `${calculateProgress()}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="workout-content-modern">
                <div className="workout-main-grid">
                    <div className="gif-section">
                        <div className="exercise-gif-container-modern">
                            {showGif && !hasGifError && currentExercise?.gifUrl ? (
                                <img 
                                    src={currentExercise.gifUrl}
                                    alt={currentExercise.name}
                                    className="exercise-gif-modern"
                                    onLoad={() => handleGifLoad(currentExercise.id)}
                                    onError={() => handleGifError(currentExercise.id)}
                                />
                            ) : (
                                <div className="gif-placeholder-modern">
                                    <span className="placeholder-icon-modern">🏋️</span>
                                    <span className="placeholder-text-modern">{currentExercise?.name}</span>
                                    {hasGifError && (
                                        <span className="placeholder-hint-modern">
                                            GIF временно недоступен
                                        </span>
                                    )}
                                </div>
                            )}
                            <div className="gif-overlay-modern">
                                <span className="exercise-name-large-modern">{currentExercise?.name}</span>
                                <span className="muscle-group-badge-modern">{currentExercise?.muscleGroup || currentExercise?.primary_muscle}</span>
                            </div>
                        </div>
                    </div>

                    <div className="details-section">
                        <div className="exercise-details-panel-modern">
                            <div className="set-indicator-modern">
                                Подход {currentSet} из {currentExercise?.sets}
                            </div>
                            
                            <h3 className="exercise-title-modern">{currentExercise?.name}</h3>
                            <p className="exercise-description-modern">{currentExercise?.description}</p>
                            
                            <div className="stats-grid-modern">
                                <div className="stat-card-modern">
                                    <span className="stat-icon-modern">🔄</span>
                                    <div className="stat-content-modern">
                                        <span className="stat-label-modern">Повторения</span>
                                        <span className="stat-value-modern">{currentExercise?.reps}</span>
                                    </div>
                                </div>
                                <div className="stat-card-modern">
                                    <span className="stat-icon-modern">⏱️</span>
                                    <div className="stat-content-modern">
                                        <span className="stat-label-modern">Длительность</span>
                                        <span className="stat-value-modern">{currentExercise?.exercise_time || currentExercise?.duration} сек</span>
                                    </div>
                                </div>
                                <div className="stat-card-modern">
                                    <span className="stat-icon-modern">⏸️</span>
                                    <div className="stat-content-modern">
                                        <span className="stat-label-modern">Отдых</span>
                                        <span className="stat-value-modern">{currentExercise?.rest_time || currentExercise?.rest} сек</span>
                                    </div>
                                </div>
                            </div>

                            {currentExercise?.tips && currentExercise.tips.length > 0 && (
                                <div className="tips-modern">
                                    <h4>💡 Совет по выполнению</h4>
                                    <p>{currentExercise.tips[0]}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {timeLeft > 0 && (
                    <div className={`workout-timer ${isResting ? 'rest-timer' : 'exercise-timer'}`}>
                        <div className="timer-content">
                            <span className="timer-label">
                                {isResting ? '⏸️ Время отдыха' : '🏃 Выполняйте упражнение'}
                            </span>
                            <span className="timer-value">{formatTime(timeLeft)}</span>
                            <button className="skip-timer" onClick={handleNext}>
                                Пропустить
                            </button>
                        </div>
                    </div>
                )}

                <div className="workout-controls">
                    {!timeLeft && (
                        <>
                            <button 
                                className="btn-start-exercise"
                                onClick={() => startExercise(currentExercise?.exercise_time || currentExercise?.duration || 60)}
                            >
                                <span className="btn-icon">▶️</span>
                                Начать упражнение
                            </button>
                            {currentSet < (currentExercise?.sets || 1) && (
                                <button 
                                    className="btn-next-set"
                                    onClick={nextSet}
                                >
                                    <span className="btn-icon">✓</span>
                                    Завершить подход
                                </button>
                            )}
                        </>
                    )}
                    
                    {timeLeft > 0 && !isResting && (
                        <button 
                            className="btn-next-set"
                            onClick={nextSet}
                        >
                            <span className="btn-icon">✓</span>
                            {currentSet < (currentExercise?.sets || 1) ? 'Завершить подход' : 'Завершить упражнение'}
                        </button>
                    )}
                </div>

                {currentExerciseIndex < workoutData.exercises.length - 1 && (
                    <div className="next-exercise-preview-modern">
                        <div className="preview-header-modern">
                            <span className="preview-label-modern">Следующее упражнение</span>
                            <span className="preview-name-modern">
                                {workoutData.exercises[currentExerciseIndex + 1].name}
                            </span>
                        </div>
                        <div className="preview-details-modern">
                            <span>{workoutData.exercises[currentExerciseIndex + 1].muscleGroup || workoutData.exercises[currentExerciseIndex + 1].primary_muscle}</span>
                            <span>•</span>
                            <span>{workoutData.exercises[currentExerciseIndex + 1].sets} подхода</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkoutSession;