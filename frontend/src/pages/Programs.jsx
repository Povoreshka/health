import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Programs.css';
import { 
    muscleGroups, 
    categories, 
    intensityColors,
    exerciseTypes
} from './programsData';

// API URL
const API_URL = process.env.REACT_APP_API_URL;

// Маппинг интенсивности из БД в русские названия
const intensityLabels = {
    'low': 'Низкая',
    'medium': 'Средняя',
    'high': 'Высокая',
    'very_high': 'Очень высокая',
    'extreme': 'Экстремальная'
};

// Маппинг интенсивности в цвета
const intensityColorMap = {
    'low': '#4CAF50',
    'medium': '#FF9800',
    'high': '#F44336',
    'very_high': '#9C27B0',
    'extreme': '#D32F2F'
};

// Получение цвета интенсивности
const getIntensityColor = (intensity) => {
    if (!intensity) return '#FF9800';
    if (intensityColors && intensityColors[intensity]) {
        return intensityColors[intensity];
    }
    return intensityColorMap[intensity] || '#FF9800';
};

// Получение текста интенсивности
const getIntensityLabel = (intensity) => {
    if (!intensity) return 'Средняя';
    const russianLabel = intensityLabels[intensity];
    if (russianLabel) return russianLabel;
    if (intensityColors && intensityColors[intensity]) return intensity;
    return intensityLabels[intensity] || intensity;
};

// Уровни подготовки для фильтрации
const experienceLevels = [
    { id: 'all', label: 'Все уровни', icon: '🌟' },
    { id: 'beginner', label: 'Новичок', icon: '🌱' },
    { id: 'intermediate', label: 'Продолжающий', icon: '📈' },
    { id: 'advanced', label: 'Продвинутый', icon: '🔥' },
    { id: 'professional', label: 'Профессионал', icon: '🏆' }
];

const Programs = () => {
    const [programs, setPrograms] = useState([]);
    const [customWorkoutsList, setCustomWorkoutsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [filteredExercises, setFilteredExercises] = useState([]);
    const [exercisesLoading, setExercisesLoading] = useState(false);
    const [exerciseFilters, setExerciseFilters] = useState({
        muscleGroup: 'all',
        minDifficulty: 1,
        maxDifficulty: 10,
        type: 'all',
        search: ''
    });
    const [customWorkout, setCustomWorkout] = useState({
        name: '',
        exercises: [],
        totalTime: 0,
        createdAt: null
    });
    const [showCustomWorkoutModal, setShowCustomWorkoutModal] = useState(false);
    const [savingWorkout, setSavingWorkout] = useState(false);
    
    const navigate = useNavigate();

    // Загрузка упражнений из БД
    const loadExercises = async () => {
        setExercisesLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/exercises`);
            if (!response.ok) throw new Error(`Failed to fetch exercises: ${response.status}`);
            const data = await response.json();
            console.log(`Loaded ${data?.length || 0} exercises from database`);
            
            if (data && Array.isArray(data)) {
                const formattedExercises = data.map(ex => ({
                    id: ex.id,
                    name: ex.name,
                    description: ex.description,
                    primaryMuscle: ex.primary_muscle,
                    muscleGroups: [ex.primary_muscle],
                    type: ex.type,
                    level: ex.level,
                    difficulty: ex.difficulty || 5,
                    caloriesPerMinute: ex.calories_per_minute || 5,
                    gifUrl: ex.gif_url,
                    equipment: ex.equipment || [],
                    benefits: ex.benefits || [],
                    instructions: ex.instructions || [],
                    tips: ex.tips || [],
                    commonMistakes: ex.common_mistakes || []
                }));
                setExercises(formattedExercises);
                setFilteredExercises(formattedExercises);
            } else {
                setExercises([]);
                setFilteredExercises([]);
            }
        } catch (error) {
            console.error('Error loading exercises from API:', error);
            setError('Не удалось загрузить упражнения из базы данных');
            setExercises([]);
            setFilteredExercises([]);
        } finally {
            setExercisesLoading(false);
        }
    };

    // Загрузка программ из БД
    const loadPrograms = async () => {
        setError(null);
        try {
            const response = await fetch(`${API_URL}/programs`);
            if (!response.ok) throw new Error(`Failed to fetch programs: ${response.status}`);
            const data = await response.json();
            
            console.log(`Loaded ${data?.length || 0} programs from database`);
            
            if (!data || !Array.isArray(data)) {
                console.warn('Invalid programs data received');
                setPrograms([]);
                return;
            }
            
            const savedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
            const savedProgramId = savedUserData.currentProgram?.id;
            
            const programsWithActive = data.map(program => ({
                ...program,
                active: savedProgramId === program.id
            }));
            
            const sortedPrograms = [
                ...programsWithActive.filter(p => p.active),
                ...programsWithActive.filter(p => !p.active).sort((a, b) => (a.id || 0) - (b.id || 0))
            ];
            
            setPrograms(sortedPrograms);
            
        } catch (error) {
            console.error('Error loading programs from API:', error);
            setError(`Не удалось загрузить программы: ${error.message}`);
            setPrograms([]);
        }
    };

    // Загрузка пользовательских тренировок
    const loadCustomWorkouts = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        
        try {
            const response = await fetch(`${API_URL}/custom-workouts/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setCustomWorkoutsList(data);
                console.log('Loaded custom workouts:', data.length);
            }
        } catch (error) {
            console.error('Error loading custom workouts:', error);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            setError(null);
            try {
                await Promise.all([loadPrograms(), loadExercises(), loadCustomWorkouts()]);
            } catch (error) {
                console.error('Initialization error:', error);
                setError('Ошибка загрузки данных');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Фильтрация упражнений
    useEffect(() => {
        if (!exercises || exercises.length === 0) return;
        
        let filtered = [...exercises];
        
        if (exerciseFilters.muscleGroup !== 'all') {
            filtered = filtered.filter(ex => 
                ex.primaryMuscle === exerciseFilters.muscleGroup || 
                ex.muscleGroups?.includes(exerciseFilters.muscleGroup)
            );
        }
        
        filtered = filtered.filter(ex => 
            ex.difficulty >= exerciseFilters.minDifficulty && 
            ex.difficulty <= exerciseFilters.maxDifficulty
        );
        
        if (exerciseFilters.type !== 'all') {
            filtered = filtered.filter(ex => ex.type === exerciseFilters.type);
        }
        
        if (exerciseFilters.search) {
            filtered = filtered.filter(ex => 
                ex.name.toLowerCase().includes(exerciseFilters.search.toLowerCase())
            );
        }
        
        setFilteredExercises(filtered);
    }, [exerciseFilters, exercises]);

    // Подсчет общего времени тренировки
    useEffect(() => {
        const totalSeconds = customWorkout.exercises.reduce((total, ex) => {
            const exerciseTime = (ex.exerciseTime || 45) * (ex.sets || 3);
            const restTime = (ex.restTime || 60) * ((ex.sets || 3) - 1);
            return total + exerciseTime + restTime;
        }, 0);
        
        setCustomWorkout(prev => ({
            ...prev,
            totalTime: Math.round(totalSeconds / 60)
        }));
    }, [customWorkout.exercises]);

    // Функции фильтрации программ
    const getFilteredByCategory = (category, programsList) => {
        if (!programsList || !Array.isArray(programsList)) return [];
        if (category === 'all') return programsList;
        return programsList.filter(program => 
            program.level === category || program.category === category
        );
    };

    const getFilteredByLevel = (level, programsList) => {
        if (!programsList || !Array.isArray(programsList)) return [];
        if (level === 'all') return programsList;
        return programsList.filter(program => program.level === level);
    };

    const getFilteredByMuscleGroups = (programsList, groups) => {
        if (!programsList || !Array.isArray(programsList)) return [];
        if (groups.length === 0) return programsList;
        return programsList.filter(program => 
            groups.some(group => program.muscleGroups?.includes(group))
        );
    };

    const filteredByCategory = getFilteredByCategory(selectedCategory, programs);
    const filteredByLevel = getFilteredByLevel(selectedLevel, filteredByCategory);
    const filteredPrograms = getFilteredByMuscleGroups(filteredByLevel, selectedMuscleGroups);

    const clearMuscleFilters = () => {
        setSelectedMuscleGroups([]);
    };

    const handleViewDetails = (programId) => {
        navigate(`/programs/${programId}`);
    };

    const handleStartCustomWorkout = (workout) => {
        // Сохраняем информацию о тренировке в localStorage и переходим
        localStorage.setItem('currentCustomWorkout', JSON.stringify(workout));
        navigate(`/custom-workout/${workout.id}`);
    };

    // Добавление/удаление упражнения из выбранных
    const toggleCustomExercise = (exercise) => {
        setCustomWorkout(prev => {
            const exists = prev.exercises.find(e => e.id === exercise.id);
            if (exists) {
                return {
                    ...prev,
                    exercises: prev.exercises.filter(e => e.id !== exercise.id)
                };
            } else {
                return {
                    ...prev,
                    exercises: [...prev.exercises, {
                        ...exercise,
                        id: exercise.id,
                        name: exercise.name,
                        description: exercise.description,
                        muscleGroup: exercise.primaryMuscle,
                        gif_url: exercise.gifUrl,
                        sets: 3,
                        reps: '10-12',
                        restTime: 60,
                        exerciseTime: 45
                    }]
                };
            }
        });
    };

    // Обновление параметров упражнения в своей тренировке
    const updateCustomExerciseParams = (exerciseId, field, value) => {
        setCustomWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.map(ex => 
                ex.id === exerciseId ? { ...ex, [field]: value } : ex
            )
        }));
    };

    // Сохранение своей тренировки
    const handleSaveCustomWorkout = async () => {
        if (!customWorkout.name.trim()) {
            alert('Пожалуйста, введите название тренировки');
            return;
        }

        if (customWorkout.exercises.length === 0) {
            alert('Добавьте хотя бы одно упражнение');
            return;
        }

        setSavingWorkout(true);
        
        try {
            const userId = localStorage.getItem('userId');
            
            if (!userId) {
                alert('Пожалуйста, войдите в аккаунт');
                setShowCustomWorkoutModal(false);
                navigate('/onboarding/0');
                return;
            }
            
            const workoutToSave = {
                user_id: parseInt(userId),
                name: customWorkout.name.trim(),
                exercises: customWorkout.exercises.map(ex => ({
                    exercise_id: String(ex.id),
                    gif_url: ex.gif_url,
                    sets: ex.sets || 3,
                    reps: ex.reps || '10-12',
                    rest_time: ex.restTime || 60,
                    exercise_time: ex.exerciseTime || 45
                })),
                total_time: customWorkout.totalTime
            };
            
            console.log('Sending workout to server:', workoutToSave);
            
            const response = await fetch(`${API_URL}/custom-workouts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workoutToSave)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save workout');
            }
            
            alert('✅ Тренировка успешно сохранена!');
            setShowCustomWorkoutModal(false);
            resetCustomWorkoutForm();
            loadCustomWorkouts(); // Обновляем список тренировок
            
        } catch (error) {
            console.error('Error saving workout:', error);
            alert('❌ Ошибка при сохранении тренировки: ' + error.message);
        } finally {
            setSavingWorkout(false);
        }
    };

    // Сброс формы своей тренировки
    const resetCustomWorkoutForm = () => {
        setCustomWorkout({
            name: '',
            exercises: [],
            totalTime: 0,
            createdAt: null
        });
        setExerciseFilters({
            muscleGroup: 'all',
            minDifficulty: 1,
            maxDifficulty: 10,
            type: 'all',
            search: ''
        });
    };

    if (loading || exercisesLoading) {
        return (
            <div className="programs-loading">
                <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                </div>
                <p>Загружаем лучшие программы для вас...</p>
            </div>
        );
    }

    if (error && programs.length === 0 && exercises.length === 0) {
        return (
            <div className="programs-error">
                <div className="error-icon">⚠️</div>
                <h2>Ошибка загрузки данных</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="retry-button">
                    Попробовать снова
                </button>
                <button onClick={() => navigate('/home')} className="back-home-button">
                    Вернуться на главную
                </button>
            </div>
        );
    }

    return (
        <div className="programs-page">
            <div className="programs-header">
    <button className="back-button" onClick={() => navigate('/home')}>
        <span className="back-arrow">←</span>
    </button>

    <h1>
        <span className="header-emoji">🎯</span>
        <span>Программы тренировок</span>
    </h1>

    <p>
        Выберите идеальную программу для достижения ваших целей
    </p>
</div>

            {/* Кнопка создания своей тренировки */}
            <div className="custom-workout-btn-container">
                <button 
                    className="custom-workout-btn"
                    onClick={() => setShowCustomWorkoutModal(true)}
                >
                    <span className="btn-icon">✏️</span>
                    <span>Создать свою тренировку</span>
                </button>
            </div>

            {/* Секция Мои тренировки */}
            {customWorkoutsList.length > 0 && (
                <div className="custom-workouts-section">
                    <h2>📝 Мои тренировки</h2>
                    <div className="programs-grid">
                        {customWorkoutsList.map((workout, index) => (
                            <div key={workout.id} className="program-card custom-workout-card">
                                <div className="program-badge" style={{ backgroundColor: '#FF9800' }}>
                                    ✏️
                                </div>
                                <div className="program-header">
                                    <h3>{workout.name}</h3>
                                    <p className="program-description">
                                        Пользовательская тренировка • {workout.exercises?.length || 0} упражнений
                                    </p>
                                    <div className="program-tags">
                                        <span className="duration-tag">⏱️ {workout.total_time || 0} мин</span>
                                        <span className="workouts-tag">
                                            📅 {new Date(workout.created_at).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                </div>
                                <div className="program-actions">
                                    <button 
                                        className="details-btn"
                                        onClick={() => handleStartCustomWorkout(workout)}
                                    >
                                        <span>Начать</span>
                                        <span className="arrow">→</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Фильтр по уровню подготовки */}
            <div className="level-filter">
                <h3>🎯 Уровень подготовки</h3>
                <div className="level-buttons">
                    {experienceLevels.map(level => (
                        <button
                            key={level.id}
                            className={`level-btn ${selectedLevel === level.id ? 'active' : ''}`}
                            onClick={() => setSelectedLevel(level.id)}
                        >
                            <span className="level-icon">{level.icon}</span>
                            <span className="level-label">{level.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            

            <div className="programs-info-bar">
                <div className="info-item">
                    <span className="info-icon">📊</span>
                    <span className="info-text">
                        Найдено программ: <strong>{filteredPrograms?.length || 0}</strong>
                    </span>
                </div>
                {selectedLevel !== 'all' && (
                    <div className="info-item">
                        <span className="info-icon">🎯</span>
                        <span className="info-text">
                            Уровень: {experienceLevels.find(l => l.id === selectedLevel)?.label}
                        </span>
                    </div>
                )}
            </div>

            <div className="programs-grid">
                {filteredPrograms && filteredPrograms.length > 0 ? (
                    filteredPrograms.map((program, index) => {
                        const programColor = program.color || '#4ECDC4';
                        const programIntensity = program.intensity || 'medium';
                        const intensityLabel = getIntensityLabel(programIntensity);
                        const intensityColor = getIntensityColor(programIntensity);
                        
                        const levelLabel = {
                            'beginner': '🌱 Новичок',
                            'intermediate': '📈 Продолжающий',
                            'advanced': '🔥 Продвинутый',
                            'professional': '🏆 Профессионал'
                        }[program.level] || program.level;
                        
                        const style = {
                            borderLeftColor: programColor,
                            '--index': index,
                            animationDelay: `${index * 0.05}s`
                        };
                        
                        return (
                            <div 
                                key={program.id || index} 
                                className={`program-card ${program.active ? 'active' : ''}`}
                                style={style}
                            >
                                <div className="program-badge" style={{ backgroundColor: programColor }}>
                                    {program.icon || '💪'}
                                </div>
                                
                                <div className="program-header">
                                    <div className="program-title-section">
                                        <h3>{program.title}</h3>
                                        <div className="program-level-badge">
                                            {levelLabel}
                                        </div>
                                    </div>
                                    
                                    <div className="program-description">
                                        {program.description}
                                    </div>
                                    
                                    <div className="program-tags">
                                        <span 
                                            className="intensity-tag"
                                            style={{ backgroundColor: intensityColor }}
                                        >
                                            {intensityLabel}
                                        </span>
                                        <span className="duration-tag">
                                            ⏱️ {program.duration || '4 недели'}
                                        </span>
                                        <span className="workouts-tag">
                                            💪 {program.workoutsPerWeek || 3}/нед
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="program-actions">
                                    <button 
                                        className="details-btn"
                                        onClick={() => handleViewDetails(program.id)}
                                    >
                                        <span>Подробнее</span>
                                        <span className="arrow">→</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-results">
                        <div className="no-results-icon">🤔</div>
                        <h3>Программы не найдены</h3>
                        <p>Попробуйте изменить фильтры или выбрать другой уровень</p>
                        <button className="reset-filters" onClick={() => {
                            setSelectedLevel('all');
                            setSelectedCategory('all');
                            clearMuscleFilters();
                        }}>
                            Сбросить все фильтры
                        </button>
                    </div>
                )}
            </div>

            {/* Модальное окно создания своей тренировки */}
            {showCustomWorkoutModal && (
                <div className="modal-overlay" onClick={() => setShowCustomWorkoutModal(false)}>
                    <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>✏️ Создание своей тренировки</h2>
                            <button className="close-modal" onClick={() => setShowCustomWorkoutModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="workout-name-section">
                                <label>Название тренировки *</label>
                                <input
                                    type="text"
                                    value={customWorkout.name}
                                    onChange={(e) => setCustomWorkout({...customWorkout, name: e.target.value})}
                                    placeholder="Например: Моя утренняя тренировка"
                                    className="workout-name-input"
                                />
                            </div>

                            <div className="exercise-filters">
                                <h3>Фильтры упражнений</h3>
                                <div className="filters-row">
                                    <div className="filter-group">
                                        <label>Группа мышц</label>
                                        <select
                                            value={exerciseFilters.muscleGroup}
                                            onChange={(e) => setExerciseFilters({...exerciseFilters, muscleGroup: e.target.value})}
                                        >
                                            <option value="all">Все группы</option>
                                            {muscleGroups && muscleGroups.map(group => (
                                                <option key={group.id} value={group.id}>{group.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="filter-group">
                                        <label>Тип упражнения</label>
                                        <select
                                            value={exerciseFilters.type}
                                            onChange={(e) => setExerciseFilters({...exerciseFilters, type: e.target.value})}
                                        >
                                            <option value="all">Все типы</option>
                                            {exerciseTypes && Object.entries(exerciseTypes).map(([key, value]) => (
                                                <option key={key} value={value}>{value}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="filter-group">
                                        <label>Поиск</label>
                                        <input
                                            type="text"
                                            value={exerciseFilters.search}
                                            onChange={(e) => setExerciseFilters({...exerciseFilters, search: e.target.value})}
                                            placeholder="Введите название..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="exercises-list">
                                <h3>Доступные упражнения ({filteredExercises.length})</h3>
                                <div className="exercises-grid-custom">
                                    {filteredExercises.map(exercise => (
                                        <div
                                            key={exercise.id}
                                            className={`exercise-item ${customWorkout.exercises.find(e => e.id === exercise.id) ? 'selected' : ''}`}
                                            onClick={() => toggleCustomExercise(exercise)}
                                        >
                                            <div className="exercise-info-custom">
                                                <h4>{exercise.name}</h4>
                                                <p>{exercise.description?.substring(0, 80)}...</p>
                                                <div className="exercise-meta">
                                                    <span>💪 {muscleGroups?.find(m => m.id === exercise.primaryMuscle)?.label || exercise.primaryMuscle}</span>
                                                    <span>⚡ {exercise.caloriesPerMinute} ккал/мин</span>
                                                    <span className={`difficulty-${exercise.difficulty}`}>
                                                        🎯 Сложность: {exercise.difficulty}/10
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {customWorkout.exercises.length > 0 && (
                                <div className="selected-exercises">
                                    <h3>Ваша тренировка ({customWorkout.exercises.length} упражнений)</h3>
                                    <div className="selected-exercises-list">
                                        {customWorkout.exercises.map((exercise, idx) => (
                                            <div key={exercise.id} className="selected-exercise-item">
                                                <div className="exercise-order">{idx + 1}</div>
                                                <div className="exercise-details">
                                                    <h4>{exercise.name}</h4>
                                                    <div className="exercise-params">
                                                        <div className="param">
                                                            <label>Подходы</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="10"
                                                                value={exercise.sets}
                                                                onChange={(e) => updateCustomExerciseParams(exercise.id, 'sets', parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                        <div className="param">
                                                            <label>Повторения</label>
                                                            <input
                                                                type="text"
                                                                value={exercise.reps}
                                                                onChange={(e) => updateCustomExerciseParams(exercise.id, 'reps', e.target.value)}
                                                                placeholder="10-12"
                                                            />
                                                        </div>
                                                        <div className="param">
                                                            <label>Время (сек)</label>
                                                            <input
                                                                type="number"
                                                                min="10"
                                                                max="300"
                                                                value={exercise.exerciseTime}
                                                                onChange={(e) => updateCustomExerciseParams(exercise.id, 'exerciseTime', parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                        <div className="param">
                                                            <label>Отдых (сек)</label>
                                                            <input
                                                                type="number"
                                                                min="10"
                                                                max="300"
                                                                value={exercise.restTime}
                                                                onChange={(e) => updateCustomExerciseParams(exercise.id, 'restTime', parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    className="remove-exercise"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleCustomExercise(exercise);
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="workout-total-time">
                                        ⏱️ Общее время тренировки: ~{customWorkout.totalTime} минут
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowCustomWorkoutModal(false)}>
                                Отмена
                            </button>
                            <button 
                                className="save-btn" 
                                onClick={handleSaveCustomWorkout}
                                disabled={savingWorkout || !customWorkout.name.trim() || customWorkout.exercises.length === 0}
                            >
                                {savingWorkout ? 'Сохранение...' : '💾 Сохранить тренировку'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Programs;