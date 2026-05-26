// src/pages/CustomWorkoutSession.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './WorkoutSession.css';

const API_URL = process.env.REACT_APP_API_URL;

const CustomWorkoutSession = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [workout, setWorkout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);
    const [timer, setTimer] = useState(null);
    const [gifError, setGifError] = useState({});

    useEffect(() => {
        loadCustomWorkout();
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [id]);

    const loadCustomWorkout = async () => {
        try {
            const userId = localStorage.getItem('userId');
            const response = await fetch(`${API_URL}/custom-workouts/${userId}`);
            if (response.ok) {
                const workouts = await response.json();
                const foundWorkout = workouts.find(w => w.id === parseInt(id));
                setWorkout(foundWorkout);
                console.log('Loaded custom workout:', foundWorkout);
            }
        } catch (error) {
            console.error('Error loading custom workout:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (timeLeft > 0) {
            const interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        if (isResting) {
                            handleNextSet();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            setTimer(interval);
            return () => clearInterval(interval);
        }
    }, [timeLeft, isResting]);

    const startExercise = () => {
        if (!workout) return;
        const currentExercise = workout.exercises[currentExerciseIndex];
        setIsResting(false);
        setTimeLeft(currentExercise.exercise_time || 60);
    };

    const startRest = () => {
        if (!workout) return;
        const currentExercise = workout.exercises[currentExerciseIndex];
        setIsResting(true);
        setTimeLeft(currentExercise.rest_time || 60);
    };

    const handleNextSet = () => {
        if (!workout) return;
        const currentExercise = workout.exercises[currentExerciseIndex];
        
        if (currentSet < currentExercise.sets) {
            setCurrentSet(prev => prev + 1);
            startRest();
        } else {
            if (currentExerciseIndex < workout.exercises.length - 1) {
                setCurrentExerciseIndex(prev => prev + 1);
                setCurrentSet(1);
                setTimeLeft(0);
                setIsResting(false);
            } else {
                setIsWorkoutComplete(true);
            }
        }
    };

    const skipTimer = () => {
        setTimeLeft(0);
        if (isResting) {
            handleNextSet();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const finishWorkout = async () => {
    try {
        const userId = localStorage.getItem('userId');
        const totalSeconds = workout.total_time * 60;
        
        const workoutData = {
            user_id: parseInt(userId),
            workout_name: workout.name,
            duration: totalSeconds,
            date: new Date().toISOString().split('T')[0],
            type: 'custom',
            day_of_week: new Date().getDay(),
            exercises_completed: workout.exercises.length,
            total_exercises: workout.exercises.length,
            calories_burned: Math.round(workout.total_time * 8),
            avg_heart_rate: 130
        };
        
        const response = await fetch(`${API_URL}/workouts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workoutData)
        });
        
        if (response.ok) {
            alert('🎉 Поздравляем! Тренировка завершена и сохранена!');
            navigate('/programs');
        } else {
            alert('Тренировка завершена!');
            navigate('/programs');
        }
    } catch (error) {
        console.error('Error saving workout:', error);
        alert('Тренировка завершена!');
        navigate('/programs');
    }
};

    const handleGifError = (exerciseId) => {
        setGifError(prev => ({
            ...prev,
            [exerciseId]: true
        }));
    };

    const handleGifLoad = (exerciseId) => {
        setGifError(prev => ({
            ...prev,
            [exerciseId]: false
        }));
    };

    if (loading) {
        return (
            <div className="workout-session-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка тренировки...</p>
            </div>
        );
    }

    if (!workout) {
        return (
            <div className="workout-session-loading">
                <p>Тренировка не найдена</p>
                <button onClick={() => navigate('/programs')}>Вернуться к программам</button>
            </div>
        );
    }

    if (isWorkoutComplete) {
        return (
            <div className="workout-complete-page">
                <div className="workout-complete-content">
                    <div className="complete-animation">
                        <span className="complete-icon">🏆</span>
                    </div>
                    <h1>Тренировка завершена!</h1>
                    <p className="complete-message">Отличная работа! Вы завершили {workout.name}!</p>
                    <div className="workout-stats-summary">
                        <div className="stat-item">
                            <span className="stat-label">Выполнено упражнений:</span>
                            <span className="stat-value">{workout.exercises.length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Время тренировки:</span>
                            <span className="stat-value">{workout.total_time} мин</span>
                        </div>
                    </div>
                    <div className="completion-actions">
                        <button className="primary-button" onClick={finishWorkout}>
                            Завершить
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentExercise = workout.exercises[currentExerciseIndex];
    const hasGifError = gifError[currentExercise.id];

    return (
        <div className="workout-session">
            <div className="workout-header-modern">
                <button className="close-workout-btn" onClick={() => navigate('/programs')}>✕</button>
                <div className="header-content-modern">
                    <h1>{workout.name}</h1>
                    <div className="workout-meta">
                        <span className="meta-badge">{workout.exercises.length} упражнений</span>
                        <span className="meta-badge">Упражнение {currentExerciseIndex + 1} / {workout.exercises.length}</span>
                        <span className="meta-badge">Подход {currentSet} / {currentExercise.sets}</span>
                    </div>
                </div>
                <div className="progress-indicator">
                    <div className="progress-text">
                        <span>Прогресс тренировки</span>
                        <span>{Math.round((currentExerciseIndex / workout.exercises.length) * 100)}%</span>
                    </div>
                    <div className="progress-bar-modern">
                        <div className="progress-fill-modern" style={{ width: `${(currentExerciseIndex / workout.exercises.length) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="workout-content-modern">
                <div className="workout-main-grid">
                    {/* Левая колонка - GIF */}
                    <div className="gif-section">
                        <div className="exercise-gif-container-modern">
                            {!hasGifError && currentExercise.gif_url ? (
                                <img 
                                    src={currentExercise.gif_url}
                                    alt={currentExercise.name}
                                    className="exercise-gif-modern"
                                    onLoad={() => handleGifLoad(currentExercise.id)}
                                    onError={() => handleGifError(currentExercise.id)}
                                />
                            ) : (
                                <div className="gif-placeholder-modern">
                                    <span className="placeholder-icon-modern">🏋️</span>
                                    <span className="placeholder-text-modern">{currentExercise.name}</span>
                                    {hasGifError && (
                                        <span className="placeholder-hint-modern">
                                            GIF временно недоступен
                                        </span>
                                    )}
                                </div>
                            )}
                            <div className="gif-overlay-modern">
                                <span className="exercise-name-large-modern">{currentExercise.name}</span>
                                <span className="muscle-group-badge-modern">{currentExercise.primary_muscle || currentExercise.muscleGroup}</span>
                            </div>
                        </div>
                    </div>

                    {/* Правая колонка - Детали */}
                    <div className="details-section">
                        <div className="exercise-details-panel-modern">
                            <div className="set-indicator-modern">
                                Подход {currentSet} из {currentExercise.sets}
                            </div>
                            <h3 className="exercise-title-modern">{currentExercise.name}</h3>
                            <p className="exercise-description-modern">{currentExercise.description || 'Упражнение для развития мышц'}</p>
                            <div className="stats-grid-modern">
                                <div className="stat-card-modern">
                                    <span className="stat-icon-modern">🔄</span>
                                    <div className="stat-content-modern">
                                        <span className="stat-label-modern">Повторения</span>
                                        <span className="stat-value-modern">{currentExercise.reps}</span>
                                    </div>
                                </div>
                                <div className="stat-card-modern">
                                    <span className="stat-icon-modern">⏱️</span>
                                    <div className="stat-content-modern">
                                        <span className="stat-label-modern">Длительность</span>
                                        <span className="stat-value-modern">{currentExercise.exercise_time} сек</span>
                                    </div>
                                </div>
                                <div className="stat-card-modern">
                                    <span className="stat-icon-modern">⏸️</span>
                                    <div className="stat-content-modern">
                                        <span className="stat-label-modern">Отдых</span>
                                        <span className="stat-value-modern">{currentExercise.rest_time} сек</span>
                                    </div>
                                </div>
                            </div>

                            {currentExercise.tips && currentExercise.tips.length > 0 && (
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
                            <button className="skip-timer" onClick={skipTimer}>Пропустить</button>
                        </div>
                    </div>
                )}

                <div className="workout-controls">
                    {!timeLeft && (
                        <>
                            <button className="btn-start-exercise" onClick={startExercise}>
                                <span className="btn-icon">▶️</span>
                                Начать упражнение
                            </button>
                            {currentSet < currentExercise.sets && (
                                <button className="btn-next-set" onClick={handleNextSet}>
                                    <span className="btn-icon">✓</span>
                                    Завершить подход
                                </button>
                            )}
                        </>
                    )}
                </div>

                {currentExerciseIndex < workout.exercises.length - 1 && (
                    <div className="next-exercise-preview-modern">
                        <div className="preview-header-modern">
                            <span className="preview-label-modern">Следующее упражнение</span>
                            <span className="preview-name-modern">
                                {workout.exercises[currentExerciseIndex + 1].name}
                            </span>
                        </div>
                        <div className="preview-details-modern">
                            <span>{workout.exercises[currentExerciseIndex + 1].primary_muscle || workout.exercises[currentExerciseIndex + 1].muscleGroup}</span>
                            <span>•</span>
                            <span>{workout.exercises[currentExerciseIndex + 1].sets} подхода</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomWorkoutSession;