// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Импорты из папки pages
import Start from './pages/Start';
import HomePage from './pages/HomePage';
import Programs from './pages/Programs';
import ProgramDetail from './pages/ProgramDetails';
import WorkoutSession from './pages/WorkoutSession';
import CustomWorkoutSession from './pages/CustomWorkoutSession'; // ДОБАВИТЬ
import Health from './pages/Health';
import Nutrition from './pages/Nutrition';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import DbTest from './pages/DbTest';
import OnboardingStep0 from './pages/OnboardingStep0';
import OnboardingStep1 from './pages/OnboardingStep1';
import OnboardingStep2 from './pages/OnboardingStep2';
import OnboardingStep3 from './pages/OnboardingStep3';
import OnboardingStep4 from './pages/OnboardingStep4';
import OnboardingStep5 from './pages/OnboardingStep5';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Публичные маршруты */}
                    <Route path="/" element={<OnboardingStep0 />} />
                    <Route path="/start" element={<Start />} />
                    <Route path="/onboarding/0" element={<OnboardingStep0 />} />
                    <Route path="/onboarding/1" element={<OnboardingStep1 />} />
                    <Route path="/onboarding/2" element={<OnboardingStep2 />} />
                    <Route path="/onboarding/3" element={<OnboardingStep3 />} />
                    <Route path="/onboarding/4" element={<OnboardingStep4 />} />
                    <Route path="/onboarding/5" element={<OnboardingStep5 />} />
                    
                    {/* Защищенные маршруты (требуют авторизации) */}
                    <Route path="/home" element={
                        <ProtectedRoute>
                            <HomePage />
                        </ProtectedRoute>
                    } />
                    <Route path="/programs" element={
                        <ProtectedRoute>
                            <Programs />
                        </ProtectedRoute>
                    } />
                    <Route path="/programs/:id" element={
                        <ProtectedRoute>
                            <ProgramDetail />
                        </ProtectedRoute>
                    } />
                    <Route path="/workout/:type/:day" element={
                        <ProtectedRoute>
                            <WorkoutSession />
                        </ProtectedRoute>
                    } />
                    <Route path="/custom-workout/:id" element={
                        <ProtectedRoute>
                            <CustomWorkoutSession />
                        </ProtectedRoute>
                    } />
                    <Route path="/health" element={
                        <ProtectedRoute>
                            <Health />
                        </ProtectedRoute>
                    } />
                    <Route path="/nutrition" element={
                        <ProtectedRoute>
                            <Nutrition />
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/progress" element={
                        <ProtectedRoute>
                            <Progress />
                        </ProtectedRoute>
                    } />
                    
                    {/* Тестовый маршрут */}
                    <Route path="/db-test" element={<DbTest />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;