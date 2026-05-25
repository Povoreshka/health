// src/components/charts/ProgressChart.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { progressAPI } from '../../api/progress.api';

const ProgressChart = ({ type, timeRange }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem('userId') || 1;

    const loadProgressData = async () => {
        setLoading(true);
        try {
            let result = [];
            if (type === 'weight') {
                result = await progressAPI.getWeightProgress(userId);
            } else {
                result = await progressAPI.getWorkoutProgress(userId, timeRange);
            }
            setData(result);
        } catch (error) {
            console.error('Error loading progress data:', error);
            // Демо данные для отображения
            if (type === 'weight') {
                setData([
                    { date: '2024-01-01', value: 75 },
                    { date: '2024-01-08', value: 74.5 },
                    { date: '2024-01-15', value: 74 },
                    { date: '2024-01-22', value: 73.5 },
                    { date: '2024-01-29', value: 73 }
                ]);
            } else {
                setData([
                    { date: '2024-01-01', value: 45 },
                    { date: '2024-01-08', value: 52 },
                    { date: '2024-01-15', value: 48 },
                    { date: '2024-01-22', value: 55 },
                    { date: '2024-01-29', value: 60 }
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProgressData();
    }, [type, timeRange]); // Добавили loadProgressData в зависимости

    if (loading) {
        return <div className="chart-loading">Загрузка...</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#667eea" strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default ProgressChart;