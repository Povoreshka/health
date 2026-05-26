import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingStep5.css';

const OnboardingStep5 = () => {
    const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            navigate('/onboarding/0');
        }
    }, [navigate]);

    const weeklyFrequency = [
        { value: 1, label: '1 раз', desc: 'Для поддержания формы' },
        { value: 2, label: '2 раза', desc: 'Базовый уровень' },
        { value: 3, label: '3 раза', desc: 'Оптимально для прогресса' },
        { value: 4, label: '4 раза', desc: 'Активный режим' },
        { value: 5, label: '5 раз', desc: 'Интенсивные тренировки' },
        { value: 6, label: '6 раз', desc: 'Профессиональный подход' },
        { value: 7, label: '7 раз', desc: 'Максимальная нагрузка' },
    ];

    const handleComplete = async () => {
        try {
            setLoading(true);
            
            // Получаем все данные из онбординга
            const step1Data = JSON.parse(localStorage.getItem('onboardingStep1') || '{}');
            const step2Data = JSON.parse(localStorage.getItem('onboardingStep2') || '{}');
            const step3Data = JSON.parse(localStorage.getItem('onboardingStep3') || '{}');
            const step4Data = JSON.parse(localStorage.getItem('onboardingStep4') || '{}');
            
            const userId = localStorage.getItem('userId');
            const userEmail = localStorage.getItem('userEmail');
            
            console.log('=== ALL ONBOARDING DATA ===');
            console.log('Step1 (name, age, gender):', step1Data);
            console.log('Step2 (height, weight):', step2Data);
            console.log('Step3 (goals):', step3Data);
            console.log('Step4 (experience):', step4Data);
            console.log('Workouts per week:', workoutsPerWeek);
            console.log('User ID:', userId);
            console.log('User Email:', userEmail);
            
            if (!userId) {
                alert('Ошибка: пользователь не найден');
                navigate('/onboarding/0');
                return;
            }
            
            // Проверяем наличие goals
            const goals = step3Data.goals || [];
            console.log('Goals to save:', goals);
            
            // Подготавливаем данные для обновления
            const updateData = {
                name: step1Data.name,
                age: parseInt(step1Data.age) || null,
                gender: step1Data.gender,
                height: parseFloat(step2Data.height) || null,
                weight: parseFloat(step2Data.weight) || null,
                goals: goals,  // Массив целей
                experience: step4Data.experience,
                workouts_per_week: workoutsPerWeek,
                email: userEmail || null
            };
            
            console.log('Sending update data to server:', JSON.stringify(updateData, null, 2));
            
            // Отправляем запрос на обновление пользователя
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update user');
            }
            
            const result = await response.json();
            console.log('Update response:', result);
            
            // Получаем обновленные данные пользователя из БД для проверки
            const userResponse = await fetch(`${API_URL}/users/${userId}`);
            const updatedUser = await userResponse.json();
            console.log('Updated user from DB:', updatedUser);
            console.log('Goals in DB:', updatedUser.goals);
            console.log('BMI in DB:', updatedUser.bmi);
            
            // Обновляем localStorage
            const userData = {
                ...updateData,
                id: userId,
                bmi: updatedUser.bmi,
                workoutsPerWeek: workoutsPerWeek,
                email: userEmail,
                createdAt: new Date().toISOString(),
                workouts_count: 0,
                total_minutes: 0,
                streak: 0
            };
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Очищаем временные данные
            localStorage.removeItem('onboardingStep1');
            localStorage.removeItem('onboardingStep2');
            localStorage.removeItem('onboardingStep3');
            localStorage.removeItem('onboardingStep4');
            
            // Переходим на главную
            navigate('/home');
            
        } catch (error) {
            console.error('Error saving onboarding data:', error);
            alert('Ошибка при сохранении данных: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/onboarding/4');
    };

    return (
        <div className="onboarding-step5">
            <div className="onboarding-wrapper">
                <div className="back-button" onClick={handleBack}>
                    ←
                </div>
                
                <div className="progress-container">
                    <div className="progress-step completed">1</div>
                    <div className="progress-line"></div>
                    <div className="progress-step completed">2</div>
                    <div className="progress-line"></div>
                    <div className="progress-step completed">3</div>
                    <div className="progress-line"></div>
                    <div className="progress-step completed">4</div>
                    <div className="progress-line"></div>
                    <div className="progress-step active">5</div>
                </div>
                
                <div className="onboarding-header">
                    <h1>Количество тренировок</h1>
                    <p>Сколько раз в неделю планируете заниматься?</p>
                </div>
                
                <div className="form-container">
                    <div className="form-section">
                        <div className="frequency-selector">
                            <div className="frequency-value">
                                <span className="value">{workoutsPerWeek}</span>
                                <span className="label">раз в неделю</span>
                            </div>
                            
                            <div className="frequency-slider">
                                <input
                                    type="range"
                                    min="1"
                                    max="7"
                                    value={workoutsPerWeek}
                                    onChange={(e) => setWorkoutsPerWeek(parseInt(e.target.value))}
                                    className="slider-input"
                                />
                                <div className="slider-ticks">
                                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                        <div 
                                            key={num} 
                                            className={`tick ${num <= workoutsPerWeek ? 'active' : ''}`}
                                            onClick={() => setWorkoutsPerWeek(num)}
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            <div className="frequency-options">
                                {weeklyFrequency.map(option => (
                                    <div 
                                        key={option.value}
                                        className={`frequency-option ${workoutsPerWeek === option.value ? 'active' : ''}`}
                                        onClick={() => setWorkoutsPerWeek(option.value)}
                                    >
                                        <div className="option-value">{option.label}</div>
                                        <div className="option-desc">{option.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="button-container">
                    <button 
                        className={`complete-button ${loading ? 'loading' : ''}`}
                        onClick={handleComplete}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading-spinner"></span>
                                Завершаем настройку...
                            </>
                        ) : (
                            'Завершить настройку'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingStep5;