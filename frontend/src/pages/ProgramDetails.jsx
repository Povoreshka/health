import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ProgramDetail.css';

export const intensityColors = {
    'Низкая': '#4CAF50',
    'Средняя': '#FF9800',
    'Высокая': '#F44336',
    'Очень высокая': '#9C27B0',
    'Экстремальная': '#D32F2F'
};

const API_URL = 'http://localhost:5000/api';

const ProgramDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [isWorkoutMode, setIsWorkoutMode] = useState(false);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [gifError, setGifError] = useState({});
    const [saving, setSaving] = useState(false);
    
    const completedSetsRef = useRef({});
    const exerciseCompletionsRef = useRef([]);
    
    const [progressUpdate, setProgressUpdate] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [completedSetsForCurrent, setCompletedSetsForCurrent] = useState(0);

    const timerRef = useRef(null);
    const isMounted = useRef(true);
    const currentExerciseIndexRef = useRef(0);
    const currentSetRef = useRef(1);

    const forceUpdateProgress = useCallback(() => {
        const exerciseIndex = currentExerciseIndexRef.current;
        const currentCompletedSets = completedSetsRef.current[exerciseIndex] || 0;
        const completedExercisesCount = exerciseCompletionsRef.current.length;
        
        setCompletedCount(completedExercisesCount);
        setCompletedSetsForCurrent(currentCompletedSets);
        setProgressUpdate(prev => prev + 1);
        
        console.log('Progress updated:', {
            completedExercises: completedExercisesCount,
            completedSetsForCurrent: currentCompletedSets,
            currentSet: currentSetRef.current,
            exerciseIndex: exerciseIndex
        });
    }, []);

    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsTimerActive(false);
    }, []);

    const exitWorkout = useCallback(async (isComplete = false) => {
        stopTimer();
        
        if (isComplete && program && program.exercises && program.exercises.length > 0) {
            const userId = localStorage.getItem('userId');
            if (userId) {
                setSaving(true);
                try {
                    const totalDuration = program.exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);
                    const totalCalories = Math.round(totalDuration / 60 * 8);
                    const completedExercises = exerciseCompletionsRef.current.length;
                    const totalExercises = program.exercises.length;
                    
                    const workoutData = {
                        user_id: parseInt(userId),
                        workout_name: program.title,
                        duration: totalDuration,
                        date: new Date().toISOString().split('T')[0],
                        type: program.title.toLowerCase().includes('кардио') ? 'cardio' : 'strength',
                        exercises_completed: completedExercises,
                        total_exercises: totalExercises,
                        calories_burned: totalCalories
                    };
                    
                    console.log('Saving workout result:', workoutData);
                    
                    const response = await fetch(`${API_URL}/workouts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(workoutData)
                    });
                    
                    if (response.ok) {
                        const today = new Date().toISOString().split('T')[0];
                        localStorage.setItem(`workout_completed_${today}`, 'true');
                        alert(`🎉 Поздравляем! Тренировка "${program.title}" завершена!\n\n✅ Выполнено упражнений: ${completedExercises}/${totalExercises}\n🔥 Сожжено калорий: ${totalCalories} ккал`);
                    } else {
                        alert('🎉 Поздравляем! Тренировка завершена!');
                    }
                } catch (error) {
                    console.error('Error saving workout:', error);
                    alert('🎉 Поздравляем! Тренировка завершена!');
                } finally {
                    setSaving(false);
                }
            } else {
                alert('🎉 Поздравляем! Тренировка завершена!');
            }
        }
        
        setIsWorkoutMode(false);
        setCurrentExerciseIndex(0);
        setCurrentSet(1);
        setTimeLeft(0);
        setIsResting(false);
        setIsTimerActive(false);
        setGifError({});
        completedSetsRef.current = {};
        exerciseCompletionsRef.current = [];
        setCompletedCount(0);
        setCompletedSetsForCurrent(0);
        
        sessionStorage.removeItem('workoutStartTime');
        navigate('/home');
    }, [program, navigate, stopTimer]);

    // Функция для перехода к следующему упражнению
    const goToNextExercise = useCallback(() => {
        const exerciseIndex = currentExerciseIndexRef.current;
        const currentExercise = program?.exercises[exerciseIndex];
        
        if (currentExercise) {
            console.log(`🎉 Упражнение "${currentExercise.name}" полностью завершено!`);
            
            if (!exerciseCompletionsRef.current.includes(exerciseIndex)) {
                exerciseCompletionsRef.current = [...exerciseCompletionsRef.current, exerciseIndex];
            }
            
            forceUpdateProgress();
            
            // Переходим к следующему упражнению
            if (exerciseIndex < program.exercises.length - 1) {
                const newIndex = exerciseIndex + 1;
                currentExerciseIndexRef.current = newIndex;
                currentSetRef.current = 1;
                setCurrentExerciseIndex(newIndex);
                setCurrentSet(1);
                forceUpdateProgress();
                console.log(`➡️ Переход к упражнению ${newIndex + 1}: ${program.exercises[newIndex].name}`);
            } else {
                console.log('🏆 Тренировка полностью завершена!');
                exitWorkout(true);
            }
        }
    }, [program, forceUpdateProgress, exitWorkout]);

    // Запуск таймера (ОСНОВНАЯ ЛОГИКА)
    const startTimer = useCallback((duration, isRestingPhase) => {
        stopTimer();
        
        setTimeLeft(duration);
        setIsResting(isRestingPhase);
        setIsTimerActive(true);
        
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    stopTimer();
                    
                    if (isRestingPhase) {
                        // === ОТДЫХ ЗАКОНЧИЛСЯ ===
                        console.log('⏰ Отдых закончился');
                        const exerciseIndex = currentExerciseIndexRef.current;
                        const currentExercise = program?.exercises[exerciseIndex];
                        const setNum = currentSetRef.current;
                        
                        if (currentExercise && setNum < currentExercise.sets) {
                            // Увеличиваем номер подхода и запускаем следующий подход
                            const newSet = setNum + 1;
                            currentSetRef.current = newSet;
                            setCurrentSet(newSet);
                            forceUpdateProgress();
                            console.log(`🔄 Начинаем подход ${newSet}/${currentExercise.sets}`);
                            startTimer(currentExercise.duration, false);
                        } else if (currentExercise && setNum === currentExercise.sets) {
                            // Отдых после последнего подхода - переходим к следующему упражнению
                            console.log(`✅ Отдых после последнего подхода, переходим к следующему упражнению`);
                            goToNextExercise();
                        }
                    } else {
                        // === УПРАЖНЕНИЕ ЗАКОНЧИЛОСЬ ===
                        console.log('⏰ Упражнение закончилось');
                        const exerciseIndex = currentExerciseIndexRef.current;
                        const currentExercise = program?.exercises[exerciseIndex];
                        const setNum = currentSetRef.current;
                        
                        if (currentExercise) {
                            // Обновляем завершенные подходы
                            const currentCompleted = completedSetsRef.current[exerciseIndex] || 0;
                            const newCompleted = Math.max(currentCompleted, setNum);
                            completedSetsRef.current[exerciseIndex] = newCompleted;
                            forceUpdateProgress();
                            
                            if (setNum < currentExercise.sets) {
                                // Запускаем отдых перед следующим подходом
                                console.log(`🔄 Запускаем отдых перед подходом ${setNum + 1}/${currentExercise.sets}`);
                                startTimer(currentExercise.rest, true);
                            } else if (setNum === currentExercise.sets) {
                                // Это был последний подход, переходим к следующему упражнению
                                console.log(`✅ Последний подход завершен, переходим к следующему упражнению`);
                                goToNextExercise();
                            }
                        }
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [program, stopTimer, forceUpdateProgress, goToNextExercise]);

    // Пропустить таймер
    const skipTimer = useCallback(() => {
        stopTimer();
        
        if (isResting) {
            // Пропускаем отдых
            console.log('⏭️ Пропускаем отдых');
            const exerciseIndex = currentExerciseIndexRef.current;
            const currentExercise = program?.exercises[exerciseIndex];
            const setNum = currentSetRef.current;
            
            if (currentExercise && setNum < currentExercise.sets) {
                const newSet = setNum + 1;
                currentSetRef.current = newSet;
                setCurrentSet(newSet);
                forceUpdateProgress();
                startTimer(currentExercise.duration, false);
            } else if (currentExercise && setNum === currentExercise.sets) {
                goToNextExercise();
            }
        } else {
            // Пропускаем упражнение - сразу запускаем отдых
            console.log('⏭️ Пропускаем упражнение');
            const exerciseIndex = currentExerciseIndexRef.current;
            const currentExercise = program?.exercises[exerciseIndex];
            const setNum = currentSetRef.current;
            
            if (currentExercise) {
                const currentCompleted = completedSetsRef.current[exerciseIndex] || 0;
                const newCompleted = Math.max(currentCompleted, setNum);
                completedSetsRef.current[exerciseIndex] = newCompleted;
                forceUpdateProgress();
                
                if (setNum < currentExercise.sets) {
                    startTimer(currentExercise.rest, true);
                } else if (setNum === currentExercise.sets) {
                    goToNextExercise();
                }
            }
        }
    }, [isResting, program, stopTimer, forceUpdateProgress, startTimer, goToNextExercise]);

    // Полный пропуск упражнения
    const skipExercise = useCallback(() => {
        stopTimer();
        
        if (!program || !isMounted.current) return;
        
        if (window.confirm(`Пропустить упражнение "${program.exercises[currentExerciseIndex]?.name}"?`)) {
            goToNextExercise();
        }
    }, [program, currentExerciseIndex, stopTimer, goToNextExercise]);

    const handleGifError = useCallback((exerciseId) => {
        if (isMounted.current) {
            setGifError(prev => ({ ...prev, [exerciseId]: true }));
        }
    }, []);

    const startWorkout = useCallback(() => {
        if (program && program.exercises && program.exercises.length > 0) {
            sessionStorage.setItem('workoutStartTime', Date.now().toString());
            sessionStorage.removeItem('workoutDuration');
            
            currentExerciseIndexRef.current = 0;
            currentSetRef.current = 1;
            completedSetsRef.current = {};
            exerciseCompletionsRef.current = [];
            
            setIsWorkoutMode(true);
            setCurrentExerciseIndex(0);
            setCurrentSet(1);
            setTimeLeft(0);
            setIsResting(false);
            setIsTimerActive(false);
            setGifError({});
            setCompletedCount(0);
            setCompletedSetsForCurrent(0);
            setProgressUpdate(0);
            stopTimer();
        }
    }, [program, stopTimer]);

    const goToPrograms = useCallback(() => {
        navigate('/programs');
    }, [navigate]);

    const startCurrentExercise = useCallback(() => {
        const currentExercise = program?.exercises[currentExerciseIndex];
        if (currentExercise) {
            startTimer(currentExercise.duration, false);
        }
    }, [program, currentExerciseIndex, startTimer]);

    useEffect(() => {
        currentExerciseIndexRef.current = currentExerciseIndex;
        currentSetRef.current = currentSet;
        forceUpdateProgress();
    }, [currentExerciseIndex, currentSet, forceUpdateProgress]);

    // Загрузка программы
    useEffect(() => {
        const loadProgramData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const programResponse = await fetch(`${API_URL}/programs/${id}`);
                if (!programResponse.ok) throw new Error('Program not found');
                const programData = await programResponse.json();
                
                const exercisesResponse = await fetch(`${API_URL}/programs/${id}/exercises`);
                if (!exercisesResponse.ok) throw new Error('Exercises not found');
                const exercisesData = await exercisesResponse.json();
                
                const formattedExercises = exercisesData.map(ex => ({
                    id: ex.id,
                    name: ex.name,
                    description: ex.description || 'Описание упражнения',
                    muscleGroup: ex.muscleGroup || 'Общее',
                    sets: ex.sets || 3,
                    reps: ex.reps || '12',
                    rest: ex.rest || 60,
                    duration: ex.duration || 120,
                    tips: ex.tips || ['Следуйте технике выполнения'],
                    gifUrl: ex.gifUrl || null
                }));
                
                const fullProgram = {
                    id: programData.id,
                    title: programData.title,
                    description: programData.description,
                    icon: programData.icon || '💪',
                    color: programData.color || '#4ECDC4',
                    level: programData.level,
                    duration: programData.duration,
                    workoutsPerWeek: programData.workouts_per_week || programData.workoutsPerWeek,
                    exercises: formattedExercises
                };
                
                setProgram(fullProgram);
                setLoading(false);
                
            } catch (err) {
                console.error('Error loading program:', err);
                setError(err.message);
                setLoading(false);
            }
        };
        
        if (id) {
            loadProgramData();
        }
        
        return () => {
            isMounted.current = false;
            stopTimer();
        };
    }, [id, stopTimer]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    if (loading) {
        return (
            <div className="programs-loading">
                <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                </div>
                <p>Загружаем программу...</p>
            </div>
        );
    }

    if (error || !program) {
        return (
            <div className="program-detail-page">
                <div className="program-detail-header">
                    <button className="back-button" onClick={goToPrograms}>
                        <span className="back-arrow">←</span>
                    </button>
                    <h1>Программа не найдена</h1>
                    <p>{error || 'Проверьте ID программы'}</p>
                </div>
            </div>
        );
    }

    // РЕЖИМ ТРЕНИРОВКИ
    if (isWorkoutMode) {
        const currentExercise = program.exercises[currentExerciseIndex];
        if (!currentExercise) {
            return (
                <div className="workout-mode-overlay">
                    <div className="workout-container">
                        <button className="close-workout" onClick={() => exitWorkout(false)}>✕</button>
                        <p>Упражнение не найдено</p>
                    </div>
                </div>
            );
        }
        
        const hasGifError = gifError[currentExercise.id];
        const totalExercises = program.exercises.length;
        
        let totalSets = 0;
        let completedTotalSets = 0;
        program.exercises.forEach((ex, idx) => {
            const sets = ex.sets;
            totalSets += sets;
            if (idx < currentExerciseIndex) {
                completedTotalSets += sets;
            } else if (idx === currentExerciseIndex) {
                completedTotalSets += completedSetsForCurrent;
            }
        });
        const overallProgressPercent = totalSets > 0 ? Math.round((completedTotalSets / totalSets) * 100) : 0;
        const currentExerciseProgressPercent = currentExercise.sets > 0 ? Math.round((completedSetsForCurrent / currentExercise.sets) * 100) : 0;

        return (
            <div className="workout-mode-overlay">
                <div className="workout-container">
                    <button className="close-workout" onClick={() => exitWorkout(false)}>✕</button>
                    
                    <button 
                        className="complete-workout-btn"
                        onClick={() => {
                            if (window.confirm('Завершить тренировку досрочно?')) {
                                exitWorkout(true);
                            }
                        }}
                        disabled={saving}
                    >
                        {saving ? '⏳' : '✓'}
                    </button>
                    
                    <div className="workout-header">
                        <h2>{program.title}</h2>
                        
                        {/* <div className="overall-progress-container">
                            <div className="progress-labels">
                                <span>🏆 Общий прогресс тренировки</span>
                                <span>{overallProgressPercent}%</span>
                            </div>
                            <div className="overall-progress-bar">
                                <div 
                                    className="overall-progress-fill"
                                    style={{ width: `${overallProgressPercent}%` }}
                                ></div>
                            </div>
                        </div> */}
                        
                        <div className="workout-progress-info">
                            <div className="progress-badge green">
                                📋 Упражнения: {completedCount}/{totalExercises}
                            </div>
                            <div className="progress-badge orange">
                                💪 Текущее: {currentExercise.name}
                            </div>
                            <div className="progress-badge blue">
                                🔄 Подход {currentSet}/{currentExercise.sets}
                            </div>
                        </div>
                        
                        {/* <div className="current-exercise-progress">
                            <div className="progress-labels">
                                <span>📊 Прогресс упражнения</span>
                                <span>{completedSetsForCurrent}/{currentExercise.sets} подходов ({currentExerciseProgressPercent}%)</span>
                            </div>
                            <div className="current-progress-bar">
                                <div 
                                    className="current-progress-fill"
                                    style={{ width: `${currentExerciseProgressPercent}%` }}
                                ></div>
                            </div>
                        </div> */}
                    </div>

                    <div className="workout-main">
                        <div className="exercise-gif-container">
                            {!hasGifError && currentExercise.gifUrl ? (
                                <img 
                                    src={currentExercise.gifUrl}
                                    alt={currentExercise.name}
                                    className="exercise-gif"
                                    onError={() => handleGifError(currentExercise.id)}
                                />
                            ) : (
                                <div className="gif-placeholder">
                                    <span className="placeholder-icon">🏋️</span>
                                    <span className="placeholder-text">{currentExercise.name}</span>
                                </div>
                            )}
                            <div className="gif-overlay">
                                <span className="exercise-name-large">{currentExercise.name}</span>
                                <span className="muscle-group-badge">{currentExercise.muscleGroup}</span>
                            </div>
                        </div>

                        {/* Добавляем класс hidden-on-mobile-when-timer-active для управления видимостью */}
                        <div className={`exercise-details-panel ${isTimerActive ? 'timer-active' : ''}`}>
                            <h3>{currentExercise.name}</h3>
                            <p className="description">{currentExercise.description}</p>
                            
                            <div className="stats-grid-compact">
                                <div className="stat-item-compact">
                                    <span className="stat-icon">🔄</span>
                                    <div>
                                        <small>Повторения</small>
                                        <strong>{currentExercise.reps}</strong>
                                    </div>
                                </div>
                                <div className="stat-item-compact">
                                    <span className="stat-icon">⏱️</span>
                                    <div>
                                        <small>Длительность</small>
                                        <strong>{Math.floor(currentExercise.duration / 60)}:{String(currentExercise.duration % 60).padStart(2, '0')}</strong>
                                    </div>
                                </div>
                                <div className="stat-item-compact">
                                    <span className="stat-icon">⏸️</span>
                                    <div>
                                        <small>Отдых</small>
                                        <strong>{currentExercise.rest} сек</strong>
                                    </div>
                                </div>
                            </div>

                            {currentExercise.tips && currentExercise.tips.length > 0 && (
                                <div className="tips-mini">
                                    <h4>💡 Совет</h4>
                                    <p>{currentExercise.tips[0]}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {isTimerActive && timeLeft > 0 ? (
                        <div className={`workout-timer ${isResting ? 'rest-timer' : 'exercise-timer'}`}>
                            <div className="timer-content">
                                <span className="timer-label">
                                    {isResting ? '⏸️ Время отдыха' : '🏃 Выполняйте упражнение'}
                                </span>
                                <span className="timer-value">{formatTime(timeLeft)}</span>
                                <button className="skip-timer" onClick={skipTimer}>
                                    Пропустить
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="workout-controls">
                            {!isResting && !isTimerActive && (
                                <button 
                                    className="btn-start-exercise"
                                    onClick={startCurrentExercise}
                                >
                                    <span className="btn-icon">▶️</span>
                                    Начать упражнение
                                </button>
                            )}
                            
                            <button 
                                className="btn-skip-exercise"
                                onClick={skipExercise}
                            >
                                <span className="btn-icon">⏭️</span>
                                Пропустить упражнение
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // СТАНДАРТНЫЙ РЕНДЕРИНГ
    return (
        <div className="program-detail-page">
            <div className="program-detail-header programs-header">
                <button className="back-button" onClick={goToPrograms}>
                    <span className="back-arrow">←</span>
                </button>

                <div className="header-content">
                    <h1>
                        <span className="program-emoji">{program.icon}</span>
                        <span className="program-title">{program.title}</span>
                    </h1>
                    <p>{program.description}</p>
                </div>
            </div>

            <div className="program-detail-content">
                <div className="program-overview-card" style={{ borderLeftColor: program.color }}>
                    <div className="overview-header">
                        <div className="program-icon-large" style={{ backgroundColor: program.color + '20' }}>
                            {program.icon}
                        </div>
                        <div className="overview-info">
                            <h2>Обзор программы</h2>
                            <div className="overview-stats">
                                <div className="stat">
                                    <span className="stat-label">Уровень:</span>
                                    <span className="stat-value">
                                        {program.level === 'beginner' ? 'Новичок' : 
                                         program.level === 'intermediate' ? 'Продолжающий' : 
                                         program.level === 'advanced' ? 'Продвинутый' : 'Профессионал'}
                                    </span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Длительность:</span>
                                    <span className="stat-value">{program.duration}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Тренировок в неделю:</span>
                                    <span className="stat-value">{program.workoutsPerWeek}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Упражнений:</span>
                                    <span className="stat-value">{program.exercises?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="exercises-section">
                    <div className="section-title">
                        <h2>🏋️ Упражнения программы</h2>
                        <p>Всего упражнений: {program.exercises?.length || 0}</p>
                    </div>

                    {program.exercises.map((exercise, index) => (
                        <div key={exercise.id || index} className="exercise-card-detailed">
                            <div className="exercise-number">
                                <span>#{index + 1}</span>
                            </div>
                            
                            <div className="exercise-main">
                                <div className="exercise-header-detailed">
                                    <h3>{exercise.name}</h3>
                                    <span className="exercise-muscle-badge">
                                        {exercise.muscleGroup}
                                    </span>
                                </div>
                                
                                <div className="exercise-description-detailed">
                                    {exercise.description}
                                </div>
                                
                                {exercise.tips && exercise.tips.length > 0 && (
                                    <div className="exercise-tips-detailed">
                                        <h4>💡 Советы по выполнению:</h4>
                                        <ul>
                                            {exercise.tips.map((tip, tipIndex) => (
                                                <li key={tipIndex}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                <div className="exercise-stats">
                                    <div className="stat-card">
                                        <div className="stat-icon">🔄</div>
                                        <div className="stat-content">
                                            <div className="stat-label">Подходы</div>
                                            <div className="stat-value">{exercise.sets}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="stat-card">
                                        <div className="stat-icon">🔁</div>
                                        <div className="stat-content">
                                            <div className="stat-label">Повторения</div>
                                            <div className="stat-value">{exercise.reps}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="stat-card">
                                        <div className="stat-icon">⏱️</div>
                                        <div className="stat-content">
                                            <div className="stat-label">Время</div>
                                            <div className="stat-value">{Math.floor(exercise.duration / 60)}:{String(exercise.duration % 60).padStart(2, '0')}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="stat-card">
                                        <div className="stat-icon">⏸️</div>
                                        <div className="stat-content">
                                            <div className="stat-label">Отдых</div>
                                            <div className="stat-value">{exercise.rest} сек</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {program.exercises && program.exercises.length > 0 && (
                <div className="start-workout-fab" onClick={startWorkout}>
                    <span className="start-icon">▶️</span>
                    <span>Начать тренировку</span>
                </div>
            )}
        </div>
    );
};

export default ProgramDetail;