import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingStep4.css';

const OnboardingStep4 = () => {
    const [experience, setExperience] = useState('');
    
    const navigate = useNavigate();

    React.useEffect(() => {
        const step1Data = JSON.parse(localStorage.getItem('onboardingStep1') || '{}');
        if (!step1Data.name) {
            navigate('/onboarding/1');
        }
    }, [navigate]);

    const experienceLevels = [
        { id: 'beginner', label: 'Новичок', desc: 'Первый опыт или возвращение после перерыва', icon: '👶' },
        { id: 'intermediate', label: 'Средний', desc: 'Занимаюсь несколько месяцев', icon: '👍' },
        { id: 'advanced', label: 'Продвинутый', desc: 'Регулярные тренировки более года', icon: '🏆' },
        { id: 'professional', label: 'Профессионал', desc: 'Спортсмен с большим опытом', icon: '💪' },
    ];

    // ИСПРАВЛЕНО: Сохраняем experience в отдельный ключ onboardingStep4
    const handleNext = () => {
        // НЕ ПЕРЕЗАПИСЫВАЕМ onboardingStep1!
        const step4Data = {
            experience: experience
        };
        
        console.log('Saving experience to onboardingStep4:', step4Data);
        localStorage.setItem('onboardingStep4', JSON.stringify(step4Data));
        navigate('/onboarding/5');
    };

    const handleBack = () => {
        navigate('/onboarding/3');
    };

    return (
        <div className="onboarding-step4">
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
                    <div className="progress-step active">4</div>
                    <div className="progress-line"></div>
                    <div className="progress-step">5</div>
                </div>
                
                <div className="onboarding-header">
                    <h1>Ваш уровень подготовки</h1>
                    <p>Это поможет настроить интенсивность тренировок</p>
                </div>
                
                <div className="form-container">
                    <div className="form-section">
                        <label>Выберите ваш текущий уровень</label>
                        <p className="section-description">Мы подберем нагрузку соответственно вашему опыту</p>
                        
                        <div className="experience-cards">
                            {experienceLevels.map(level => (
                                <div 
                                    key={level.id}
                                    className={`experience-card ${experience === level.id ? 'selected' : ''}`}
                                    onClick={() => setExperience(level.id)}
                                >
                                    <div className="experience-icon">{level.icon}</div>
                                    <div className="experience-content">
                                        <h4>{level.label}</h4>
                                        <p>{level.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="button-container">
                    <button 
                        className={`next-button ${experience ? '' : 'disabled'}`}
                        onClick={handleNext}
                        disabled={!experience}
                    >
                        Продолжить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingStep4;