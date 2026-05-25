import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingStep2.css';

const OnboardingStep2 = () => {
    const [height, setHeight] = useState('170');
    const [weight, setWeight] = useState('70');
    
    const navigate = useNavigate();

    React.useEffect(() => {
        const step1Data = JSON.parse(localStorage.getItem('onboardingStep1') || '{}');
        if (!step1Data.name) {
            navigate('/onboarding/1');
        }
    }, [navigate]);

    const calculateBMI = () => {
        const heightNum = parseInt(height) || 0;
        const weightNum = parseInt(weight) || 0;
        
        if (heightNum <= 0 || weightNum <= 0) return '--';
        
        const heightInMeters = heightNum / 100;
        return (weightNum / (heightInMeters * heightInMeters)).toFixed(1);
    };

    const getBMICategory = () => {
        const bmiValue = calculateBMI();
        if (bmiValue === '--') return { 
            text: 'Введите данные', 
            color: '#666',
            bgColor: 'rgba(102, 102, 102, 0.1)'
        };
        
        const bmi = parseFloat(bmiValue);
        if (bmi < 18.5) return { 
            text: 'Недостаточный вес', 
            color: '#FF9800',
            bgColor: 'rgba(255, 152, 0, 0.1)'
        };
        if (bmi < 25) return { 
            text: 'Нормальный вес', 
            color: '#4CAF50',
            bgColor: 'rgba(76, 175, 80, 0.1)'
        };
        if (bmi < 30) return { 
            text: 'Избыточный вес', 
            color: '#FF9800',
            bgColor: 'rgba(255, 152, 0, 0.1)'
        };
        return { 
            text: 'Ожирение', 
            color: '#F44336',
            bgColor: 'rgba(244, 67, 54, 0.1)'
        };
    };

    const getBMIScalePosition = () => {
        const bmiValue = calculateBMI();
        if (bmiValue === '--') return 50;
        
        const bmi = parseFloat(bmiValue);
        
        if (bmi < 18.5) {
            return ((bmi - 15) / 3.5) * 25;
        } else if (bmi < 25) {
            return 25 + ((bmi - 18.5) / 6.5) * 25;
        } else if (bmi < 30) {
            return 50 + ((bmi - 25) / 5) * 25;
        } else {
            const position = 75 + ((bmi - 30) / 10) * 25;
            return Math.min(position, 95);
        }
    };

    const handleHeightChange = (e) => {
        let value = e.target.value;
        value = value.replace(/[^0-9]/g, '');
        if (value.length > 1 && value.startsWith('0')) {
            value = value.replace(/^0+/, '');
        }
        if (value.length > 3) {
            value = value.substring(0, 3);
        }
        setHeight(value);
    };

    const handleWeightChange = (e) => {
        let value = e.target.value;
        value = value.replace(/[^0-9]/g, '');
        if (value.length > 1 && value.startsWith('0')) {
            value = value.replace(/^0+/, '');
        }
        if (value.length > 3) {
            value = value.substring(0, 3);
        }
        setWeight(value);
    };

    const handleHeightBlur = () => {
        if (height === '') {
            setHeight('170');
        } else {
            const heightNum = parseInt(height);
            if (heightNum < 100) {
                setHeight('100');
            } else if (heightNum > 220) {
                setHeight('220');
            }
        }
    };

    const handleWeightBlur = () => {
        if (weight === '') {
            setWeight('70');
        } else {
            const weightNum = parseInt(weight);
            if (weightNum < 30) {
                setWeight('30');
            } else if (weightNum > 150) {
                setWeight('150');
            }
        }
    };

    const getHeightValue = () => {
        if (height === '') return 170;
        const heightNum = parseInt(height);
        return isNaN(heightNum) ? 170 : heightNum;
    };

    const getWeightValue = () => {
        if (weight === '') return 70;
        const weightNum = parseInt(weight);
        return isNaN(weightNum) ? 70 : weightNum;
    };

    const handleHeightIncrement = () => {
        const currentValue = getHeightValue();
        if (currentValue < 220) {
            setHeight((currentValue + 1).toString());
        }
    };

    const handleHeightDecrement = () => {
        const currentValue = getHeightValue();
        if (currentValue > 100) {
            setHeight((currentValue - 1).toString());
        }
    };

    const handleWeightIncrement = () => {
        const currentValue = getWeightValue();
        if (currentValue < 150) {
            setWeight((currentValue + 1).toString());
        }
    };

    const handleWeightDecrement = () => {
        const currentValue = getWeightValue();
        if (currentValue > 30) {
            setWeight((currentValue - 1).toString());
        }
    };

    const handleKeyDown = (e, type) => {
        if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' ||
            e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
            return;
        }
        if (!/[0-9]/.test(e.key) && e.key !== 'Enter') {
            e.preventDefault();
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (type === 'height') {
                handleHeightIncrement();
            } else {
                handleWeightIncrement();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (type === 'height') {
                handleHeightDecrement();
            } else {
                handleWeightDecrement();
            }
        }
    };

    // ГЛАВНАЯ ФУНКЦИЯ - СОХРАНЯЕМ В ОТДЕЛЬНЫЙ КЛЮЧ onboardingStep2
    const handleNext = () => {
        const finalHeight = getHeightValue();
        const finalWeight = getWeightValue();
        
        // СОХРАНЯЕМ В ОТДЕЛЬНЫЙ КЛЮЧ - НЕ ПЕРЕЗАПИСЫВАЕМ onboardingStep1!
        const step2Data = {
            height: finalHeight,
            weight: finalWeight,
            bmi: calculateBMI()
        };
        
        console.log('Saving step2 data to localStorage:', step2Data);
        localStorage.setItem('onboardingStep2', JSON.stringify(step2Data));
        
        navigate('/onboarding/3');
    };

    const handleBack = () => {
        navigate('/onboarding/1');
    };

    const bmiCategory = getBMICategory();
    const scalePosition = getBMIScalePosition();

    return (
        <div className="onboarding-step2">
            <div className="onboarding-wrapper">
                <div className="back-button" onClick={handleBack}>
                    ←
                </div>
                
                <div className="progress-container">
                    <div className="progress-step completed">1</div>
                    <div className="progress-line"></div>
                    <div className="progress-step active">2</div>
                    <div className="progress-line"></div>
                    <div className="progress-step">3</div>
                    <div className="progress-line"></div>
                    <div className="progress-step">4</div>
                    <div className="progress-line"></div>
                    <div className="progress-step">5</div>
                </div>
                
                <div className="onboarding-header">
                    <h1>Ваши параметры</h1>
                    <p>Укажите рост и вес для расчета ИМТ</p>
                </div>
                
                <div className="form-container">
                    <div className="parameters-row">
                        <div className="parameter-column">
                            <label className="section-label">РОСТ (СМ)</label>
                            <div className="value-input-container">
                                <div className="stepper-controls">
                                    <button 
                                        className="stepper-button minus"
                                        onClick={handleHeightDecrement}
                                        type="button"
                                        disabled={getHeightValue() <= 100}
                                    >
                                        −
                                    </button>
                                    <div className="value-input-display">
                                        <input
                                            type="text"
                                            value={height}
                                            onChange={handleHeightChange}
                                            onBlur={handleHeightBlur}
                                            onKeyDown={(e) => handleKeyDown(e, 'height')}
                                            className="value-input"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="170"
                                        />
                                        <span className="input-unit">см</span>
                                    </div>
                                    <button 
                                        className="stepper-button plus"
                                        onClick={handleHeightIncrement}
                                        type="button"
                                        disabled={getHeightValue() >= 220}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="input-range-hints">
                                    <span className="range-hint">100 см</span>
                                    <span className="range-hint">220 см</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="parameter-column">
                            <label className="section-label">ВЕС (КГ)</label>
                            <div className="value-input-container">
                                <div className="stepper-controls">
                                    <button 
                                        className="stepper-button minus"
                                        onClick={handleWeightDecrement}
                                        type="button"
                                        disabled={getWeightValue() <= 30}
                                    >
                                        −
                                    </button>
                                    <div className="value-input-display">
                                        <input
                                            type="text"
                                            value={weight}
                                            onChange={handleWeightChange}
                                            onBlur={handleWeightBlur}
                                            onKeyDown={(e) => handleKeyDown(e, 'weight')}
                                            className="value-input"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="70"
                                        />
                                        <span className="input-unit">кг</span>
                                    </div>
                                    <button 
                                        className="stepper-button plus"
                                        onClick={handleWeightIncrement}
                                        type="button"
                                        disabled={getWeightValue() >= 150}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="input-range-hints">
                                    <span className="range-hint">30 кг</span>
                                    <span className="range-hint">150 кг</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bmi-section">
                        <div className="bmi-card">
                            <div className="bmi-header">
                                <h3>Индекс массы тела (ИМТ)</h3>
                                <div className="bmi-value">
                                    <span className="value">
                                        {calculateBMI()}
                                    </span>
                                    <span className="unit">кг/м²</span>
                                </div>
                            </div>
                            <div className="bmi-category">
                                <span 
                                    className="category-text" 
                                    style={{ 
                                        color: bmiCategory.color,
                                        backgroundColor: bmiCategory.bgColor,
                                        border: `2px solid ${bmiCategory.color}`
                                    }}
                                >
                                    {bmiCategory.text}
                                </span>
                            </div>
                            <div className="bmi-scale">
                                <div className="scale-section underweight">
                                    <span className="scale-label">Недостаточный</span>
                                </div>
                                <div className="scale-section normal">
                                    <span className="scale-label">Норма</span>
                                </div>
                                <div className="scale-section overweight">
                                    <span className="scale-label">Избыточный</span>
                                </div>
                                <div className="scale-section obese">
                                    <span className="scale-label">Ожирение</span>
                                </div>
                                {height !== '' && weight !== '' && (
                                    <div 
                                        className="scale-indicator" 
                                        style={{ left: `${scalePosition}%` }}
                                    >
                                        <div className="indicator-line"></div>
                                        <div className="indicator-dot"></div>
                                        <div 
                                            className="indicator-value"
                                            style={{ color: bmiCategory.color }}
                                        >
                                            {calculateBMI()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="button-container">
                    <button 
                        className="next-button"
                        onClick={handleNext}
                        disabled={!height || !weight}
                    >
                        Далее
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingStep2;