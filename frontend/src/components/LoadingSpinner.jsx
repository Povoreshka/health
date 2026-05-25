// src/components/LoadingSpinner.jsx
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Загрузка...' }) => {
    return (
        <div className="loading-spinner-container">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <p>{message}</p>
        </div>
    );
};

export default LoadingSpinner;