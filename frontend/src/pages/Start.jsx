// src/pages/Start.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Start.css';

const Start = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Если пользователь уже авторизован, перенаправляем на home
    const userData = localStorage.getItem('userData');
    if (userData) {
      navigate('/home');
    }
  }, [navigate]);

  return (
    <div className="start-container">
      <div className="start-content">
        <div className="start-logo">
          <div className={`logo-icon ${mounted ? 'animate' : ''}`}>
            <div className="emoji-container">
              <span className="emoji">🏋️</span>
              <span className="emoji-bg"></span>
            </div>
          </div>
          <h1>MyWill</h1>
        </div>
        
        <div className="start-text">
          <p className="tagline">Персональный фитнес-ассистент</p>
          <p className="description">
            Создайте индивидуальную программу, отслеживайте прогресс и достигайте целей
          </p>
        </div>
        
        <div className="start-features">
          <div className="feature">
            <div className="feature-icon">
              <span className="animated-emoji stats">📊</span>
            </div>
            <h3>Статистика</h3>
            <p>Наглядные графики прогресса</p>
          </div>
          
          <div className="feature">
            <div className="feature-icon">
              <span className="animated-emoji target">🎯</span>
            </div>
            <h3>Программы</h3>
            <p>Индивидуальные тренировки</p>
          </div>
          
          <div className="feature">
            <div className="feature-icon">
              <span className="animated-emoji heart">❤️</span>
            </div>
            <h3>Здоровье</h3>
            <p>Мониторинг показателей</p>
          </div>
        </div>
        
        <button 
          className="start-button"
          onClick={() => navigate("/onboarding/0")}
        >
          Начать
        </button>
        
        <p className="login-prompt">
          Уже есть аккаунт? <span onClick={() => navigate("/onboarding/0")} className="login-link">Войти</span>
        </p>

        {/* Анимированные спортивные смайлики на фоне */}
        <div className="background-emojis">
          <div className="floating-emoji">💪</div>
          <div className="floating-emoji">🏃</div>
          <div className="floating-emoji">🚴</div>
          <div className="floating-emoji">🧘</div>
          <div className="floating-emoji">🥇</div>
          <div className="floating-emoji">⚡</div>
          <div className="floating-emoji">🔥</div>
          <div className="floating-emoji">🏅</div>
        </div>
      </div>
    </div>
  );
};

export default Start;