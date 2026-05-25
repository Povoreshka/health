import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './OnboardingStep1.css';

const OnboardingStep1 = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Проверяем, есть ли пользователь в контексте
        if (user && user.id) {
            // Если пользователь уже есть, заполняем форму его данными
            setFormData({
                name: user.name || '',
                age: user.age || '',
                gender: user.gender || ''
            });
        } else {
            // Проверяем localStorage на случай, если пользователь не в контексте
            const savedUser = localStorage.getItem('userData');
            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    setFormData({
                        name: userData.name || '',
                        age: userData.age || '',
                        gender: userData.gender || ''
                    });
                } catch (err) {
                    console.error('Error parsing saved user:', err);
                }
            }
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleNext = async () => {
        if (!formData.name || !formData.age || !formData.gender) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        setLoading(true);
        
        try {
            // Сохраняем данные в localStorage для совместимости
            const onboardingData = {
                name: formData.name,
                age: parseInt(formData.age),
                gender: formData.gender
            };
            localStorage.setItem('onboardingStep1', JSON.stringify(onboardingData));
            
            // Если пользователь авторизован, обновляем его данные через API
            const userId = localStorage.getItem('userId');
            if (userId) {
                await updateUser({
                    name: formData.name,
                    age: parseInt(formData.age),
                    gender: formData.gender
                });
            }
            
            navigate('/onboarding/2');
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Ошибка при сохранении данных');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/onboarding/0');
    };

    const isFormValid = () => {
        return formData.name && formData.age && formData.gender;
    };

    return (
        <div className="onboarding-step1">
            <div className="onboarding-wrapper">
                <div className="back-button" onClick={handleBack}>
                    ←
                </div>
                
                <div className="progress-container">
                    <div className="progress-step active">1</div>
                    <div className="progress-line"></div>
                    <div className="progress-step">2</div>
                    <div className="progress-line"></div>
                    <div className="progress-step">3</div>
                    <div className="progress-line"></div>
                    <div className="progress-step">4</div>
                    <div className="progress-line"></div>
                    <div className="progress-step">5</div>
                </div>
                
                <div className="onboarding-header">
                    <h1>Кто вы?</h1>
                    <p>Расскажите немного о себе</p>
                </div>
                
                <div className="form-container">
                    <div className="form-group">
                        <label>Имя</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ваше имя"
                            className="form-input"
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Возраст</label>
                        <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="Лет"
                            min="10"
                            max="100"
                            className="form-input"
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Пол</label>
                        <div className="gender-options">
                            <div 
                                className={`gender-option ${formData.gender === 'male' ? 'selected' : ''}`}
                                onClick={() => !loading && setFormData({...formData, gender: 'male'})}
                            >
                                <div className="gender-icon">👨</div>
                                <span>Мужской</span>
                            </div>
                            <div 
                                className={`gender-option ${formData.gender === 'female' ? 'selected' : ''}`}
                                onClick={() => !loading && setFormData({...formData, gender: 'female'})}
                            >
                                <div className="gender-icon">👩</div>
                                <span>Женский</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="button-container">
                    <button 
                        className={`next-button ${isFormValid() && !loading ? '' : 'disabled'}`}
                        onClick={handleNext}
                        disabled={!isFormValid() || loading}
                    >
                        {loading ? 'Сохранение...' : 'Далее'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingStep1;