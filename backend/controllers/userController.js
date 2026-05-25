const User = require('../models/User');
const HealthEntry = require('../models/HealthEntry');
const Workout = require('../models/Workout');

const userController = {
    // Получить всех пользователей
    getAllUsers: async (req, res) => {
        try {
            const users = await User.getAll();
            res.json(users);
        } catch (error) {
            console.error('Error getting users:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Получить пользователя по ID
    getUserById: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.getById(id);
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Добавляем статистику
            const stats = await User.getStats(id);
            user.stats = stats;
            
            res.json(user);
        } catch (error) {
            console.error('Error getting user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Создать пользователя
    createUser: async (req, res) => {
        try {
            const userData = req.body;
            
            // Валидация
            if (!userData.name) {
                return res.status(400).json({ error: 'Name is required' });
            }
            
            const user = await User.create(userData);
            res.status(201).json(user);
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Обновить пользователя
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const userData = req.body;
            
            const user = await User.update(id, userData);
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json(user);
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Удалить пользователя
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await User.delete(id);
            
            if (!result) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Получить полную статистику пользователя
    getUserStats: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Проверяем существование пользователя
            const user = await User.getById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Получаем статистику
            const stats = await User.getStats(id);
            
            // Получаем последние записи здоровья
            const healthEntries = await HealthEntry.getByUserId(id, 7);
            
            // Получаем последние тренировки
            const recentWorkouts = await Workout.getHistory(id, 5);
            
            // Получаем недельную активность
            const weeklyActivity = await Workout.getWeeklyActivity(id);
            
            res.json({
                user,
                stats,
                recent_health: healthEntries,
                recent_workouts: recentWorkouts,
                weekly_activity: weeklyActivity
            });
        } catch (error) {
            console.error('Error getting user stats:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = userController;