const Workout = require('../models/Workout');
const Program = require('../models/Program');

const workoutController = {
    // Получить историю тренировок
    getHistory: async (req, res) => {
        try {
            const { userId } = req.params;
            const { limit = 30 } = req.query;
            
            const history = await Workout.getHistory(userId, parseInt(limit));
            res.json(history);
        } catch (error) {
            console.error('Error getting workout history:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Получить тренировку по ID
    getWorkoutById: async (req, res) => {
        try {
            const { id, userId } = req.params;
            
            const workout = await Workout.getById(id, userId);
            
            if (!workout) {
                return res.status(404).json({ error: 'Workout not found' });
            }
            
            res.json(workout);
        } catch (error) {
            console.error('Error getting workout:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Создать запись о тренировке
    createWorkout: async (req, res) => {
        try {
            const workoutData = req.body;
            
            // Валидация
            if (!workoutData.user_id) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            
            if (!workoutData.date) {
                workoutData.date = new Date().toISOString().split('T')[0];
            }
            
            const workout = await Workout.create(workoutData);
            res.status(201).json(workout);
        } catch (error) {
            console.error('Error creating workout:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Получить статистику за период
    getStats: async (req, res) => {
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'startDate and endDate are required' });
            }
            
            const stats = await Workout.getStats(userId, startDate, endDate);
            res.json(stats);
        } catch (error) {
            console.error('Error getting workout stats:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Получить распределение по типам тренировок
    getTypeDistribution: async (req, res) => {
        try {
            const { userId } = req.params;
            const { days = 30 } = req.query;
            
            const distribution = await Workout.getTypeDistribution(userId, parseInt(days));
            res.json(distribution);
        } catch (error) {
            console.error('Error getting type distribution:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Получить недельную активность
    getWeeklyActivity: async (req, res) => {
        try {
            const { userId } = req.params;
            
            const activity = await Workout.getWeeklyActivity(userId);
            res.json(activity);
        } catch (error) {
            console.error('Error getting weekly activity:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = workoutController;