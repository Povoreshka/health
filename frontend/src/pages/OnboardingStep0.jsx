import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './OnboardingStep0.css';

const API_URL = 'http://localhost:5000/api';

const OnboardingStep0 = () => {
    const navigate = useNavigate();
    const { register, login, loading: authLoading, setUser } = useAuth();
    const [isLogin, setIsLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetStep, setResetStep] = useState('email'); // 'email', 'code', 'password'
    const [resetData, setResetData] = useState({
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [resetMessage, setResetMessage] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleResetChange = (e) => {
        setResetData({
            ...resetData,
            [e.target.name]: e.target.value
        });
        setResetMessage('');
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.password || !formData.name) {
            setError('Пожалуйста, заполните все поля');
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        
        if (formData.password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }
        
        setLoading(true);
        
        try {
            const result = await register(formData.email, formData.password, formData.name);
            
            if (result.success) {
                localStorage.setItem('userEmail', formData.email);
                localStorage.setItem('userId', result.data.id);
                localStorage.setItem('userData', JSON.stringify(result.data));
                
                if (setUser) {
                    setUser(result.data);
                }
                
                navigate('/onboarding/1');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Ошибка при регистрации. Попробуйте еще раз.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.password) {
            setError('Пожалуйста, заполните email и пароль');
            return;
        }
        
        setLoading(true);
        
        try {
            const result = await login(formData.email, formData.password);
            
            if (result.success) {
                localStorage.setItem('userEmail', formData.email);
                localStorage.setItem('userId', result.data.id);
                localStorage.setItem('userData', JSON.stringify(result.data));
                
                if (setUser) {
                    setUser(result.data);
                }
                
                const hasCompletedOnboarding = result.data.height && 
                                               result.data.height !== null &&
                                               result.data.weight && 
                                               result.data.weight !== null &&
                                               result.data.experience && 
                                               result.data.experience !== null;
                
                if (hasCompletedOnboarding) {
                    navigate('/home');
                } else {
                    navigate('/onboarding/1');
                }
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Ошибка при входе. Попробуйте еще раз.');
        } finally {
            setLoading(false);
        }
    };

    // Функция для отправки кода восстановления
    const handleSendResetCode = async () => {
        if (!resetData.email) {
            setResetMessage('Введите email');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetData.email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setResetMessage(data.message || 'Код отправлен на email');
                setResetStep('code');
                
                // Автозаполнение кода в режиме разработки
                if (data.code) {
                    setResetData(prev => ({ ...prev, code: data.code }));
                    setResetMessage(`Код для разработки: ${data.code}. Введите его в поле ниже.`);
                }
                
                // Запускаем таймер
                setCountdown(60);
                const timer = setInterval(() => {
                    setCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setResetMessage(data.error || 'Ошибка отправки кода');
            }
        } catch (err) {
            setResetMessage('Ошибка соединения с сервером');
        } finally {
            setLoading(false);
        }
    };

    // Функция для проверки кода
    const handleVerifyCode = async () => {
        if (!resetData.code) {
            setResetMessage('Введите код восстановления');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: resetData.email, 
                    code: resetData.code 
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setResetMessage('Код подтвержден! Введите новый пароль.');
                setResetStep('password');
            } else {
                setResetMessage(data.error || 'Неверный код');
            }
        } catch (err) {
            setResetMessage('Ошибка соединения с сервером');
        } finally {
            setLoading(false);
        }
    };

    // Функция для сброса пароля
    const handleResetPassword = async () => {
        if (!resetData.newPassword || !resetData.confirmPassword) {
            setResetMessage('Заполните оба поля');
            return;
        }
        
        if (resetData.newPassword !== resetData.confirmPassword) {
            setResetMessage('Пароли не совпадают');
            return;
        }
        
        if (resetData.newPassword.length < 6) {
            setResetMessage('Пароль должен содержать минимум 6 символов');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: resetData.email, 
                    code: resetData.code,
                    newPassword: resetData.newPassword
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setResetMessage('✅ Пароль успешно изменен! Теперь вы можете войти.');
                setResetMessage('✅ Пароль изменен! Закройте окно и войдите с новым паролем.');
                
                setTimeout(() => {
                    setShowResetModal(false);
                    setResetStep('email');
                    setResetData({
                        email: '',
                        code: '',
                        newPassword: '',
                        confirmPassword: ''
                    });
                    setFormData(prev => ({ ...prev, password: '' }));
                }, 2000);
            } else {
                setResetMessage(data.error || 'Ошибка сброса пароля');
            }
        } catch (err) {
            setResetMessage('Ошибка соединения с сервером');
        } finally {
            setLoading(false);
        }
    };

    const isLoading = loading || authLoading;

    return (
        <div className="onboarding-step0">
            <div className="onboarding-wrapper">
                <div className="logo-container">
                    <div className="logo-icon">
                        <span className="emoji">🏋️</span>
                    </div>
                    <h1>MyWill</h1>
                    <p>Персональный фитнес-ассистент</p>
                </div>

                <div className="auth-card">
                    <div className="auth-tabs">
                        <button 
                            className={`tab-btn ${!isLogin ? 'active' : ''}`}
                            onClick={() => {
                                setIsLogin(false);
                                setError('');
                                setFormData({ email: '', password: '', name: '', confirmPassword: '' });
                            }}
                        >
                            Регистрация
                        </button>
                        <button 
                            className={`tab-btn ${isLogin ? 'active' : ''}`}
                            onClick={() => {
                                setIsLogin(true);
                                setError('');
                                setFormData({ email: '', password: '', name: '', confirmPassword: '' });
                            }}
                        >
                            Вход
                        </button>
                    </div>

                    <div className="auth-form">
                        {error && (
                            <div className="error-message">
                                <span className="error-icon">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={isLogin ? handleLogin : handleRegister}>
                            <div className="form-group">
                                <label>Email</label>
                                <div className="input-icon">
                                    <span className="icon">📧</span>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="your@email.com"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {!isLogin && (
                                <div className="form-group">
                                    <label>Имя</label>
                                    <div className="input-icon">
                                        <span className="icon">👤</span>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Ваше имя"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Пароль</label>
                                <div className="input-icon">
                                    <span className="icon">🔒</span>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder={isLogin ? "Введите пароль" : "Придумайте пароль (мин. 6 символов)"}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {!isLogin && (
                                <div className="form-group">
                                    <label>Подтверждение пароля</label>
                                    <div className="input-icon">
                                        <span className="icon">✓</span>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Повторите пароль"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className={`auth-button ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-small"></span>
                                        {isLogin ? 'Вход...' : 'Регистрация...'}
                                    </>
                                ) : (
                                    isLogin ? 'Войти' : 'Зарегистрироваться'
                                )}
                            </button>
                        </form>

                        {isLogin && (
                            <div className="forgot-password">
                                <button 
                                    className="forgot-password-btn"
                                    onClick={() => setShowResetModal(true)}
                                >
                                    Забыли пароль?
                                </button>
                            </div>
                        )}

                        <div className="auth-footer">
                            <p>
                                {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                                <button 
                                    className="switch-mode-btn"
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setError('');
                                        setFormData({ email: '', password: '', name: '', confirmPassword: '' });
                                    }}
                                >
                                    {isLogin ? 'Зарегистрироваться' : 'Войти'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Модальное окно восстановления пароля */}
            {showResetModal && (
                <div className="reset-modal-overlay" onClick={() => setShowResetModal(false)}>
                    <div className="reset-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowResetModal(false)}>×</button>
                        
                        <div className="reset-modal-header">
                            <span className="reset-icon">🔐</span>
                            <h2>Восстановление пароля</h2>
                        </div>

                        <div className="reset-modal-body">
                            {resetMessage && (
                                <div className={`reset-message ${resetMessage.includes('✅') ? 'success' : 'error'}`}>
                                    {resetMessage}
                                </div>
                            )}

                            {resetStep === 'email' && (
                                <>
                                    <p>Введите email, указанный при регистрации. Мы отправим код для сброса пароля.</p>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={resetData.email}
                                            onChange={handleResetChange}
                                            placeholder="your@email.com"
                                            className="reset-input"
                                        />
                                    </div>
                                    <button 
                                        className="reset-button"
                                        onClick={handleSendResetCode}
                                        disabled={loading}
                                    >
                                        {loading ? 'Отправка...' : 'Отправить код'}
                                    </button>
                                </>
                            )}

                            {resetStep === 'code' && (
                                <>
                                    <p>Введите код из письма. Код действителен 15 минут.</p>
                                    <div className="form-group">
                                        <label>Код восстановления</label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={resetData.code}
                                            onChange={handleResetChange}
                                            placeholder="Введите 6-значный код"
                                            className="reset-input"
                                            maxLength="6"
                                        />
                                    </div>
                                    {countdown > 0 && (
                                        <p className="countdown-text">Повторно отправить код можно через {countdown} сек</p>
                                    )}
                                    <div className="reset-buttons">
                                        <button 
                                            className="reset-button"
                                            onClick={handleVerifyCode}
                                            disabled={loading}
                                        >
                                            {loading ? 'Проверка...' : 'Подтвердить код'}
                                        </button>
                                        {countdown === 0 && (
                                            <button 
                                                className="reset-button secondary"
                                                onClick={handleSendResetCode}
                                            >
                                                Отправить код снова
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}

                            {resetStep === 'password' && (
                                <>
                                    <p>Придумайте новый пароль.</p>
                                    <div className="form-group">
                                        <label>Новый пароль</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={resetData.newPassword}
                                            onChange={handleResetChange}
                                            placeholder="Минимум 6 символов"
                                            className="reset-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Подтверждение пароля</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={resetData.confirmPassword}
                                            onChange={handleResetChange}
                                            placeholder="Повторите пароль"
                                            className="reset-input"
                                        />
                                    </div>
                                    <button 
                                        className="reset-button"
                                        onClick={handleResetPassword}
                                        disabled={loading}
                                    >
                                        {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Анимированные смайлики на фоне */}
            <div className="background-emojis">
                <div className="floating-emoji">💪</div>
                <div className="floating-emoji">🏃</div>
                <div className="floating-emoji">🧘</div>
                <div className="floating-emoji">🥇</div>
                <div className="floating-emoji">⚡</div>
                <div className="floating-emoji">🔥</div>
                <div className="floating-emoji">🏆</div>
                <div className="floating-emoji">💧</div>
            </div>
        </div>
    );
};

export default OnboardingStep0;