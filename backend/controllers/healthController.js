const HealthEntry = require('../models/HealthEntry');

const healthController = {
    // Получить записи пользователя
    getByUserId: async (req, res) => {
        try {
            const { userId } = req.params;
            const { limit = 30 } = req.query;
            
            const entries = await HealthEntry.getByUserId(userId, parseInt(limit));
            res.json(entries);
        } catch (error) {
            console.error('Error getting health entries:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Получить запись по дате
    getByDate: async (req, res) => {
        try {
            const { userId, date } = req.params;
            
            const entry = await HealthEntry.getByDate(userId, date);
            
            if (!entry) {
                return res.status(404).json({ error: 'Entry not found' });
            }
            
            res.json(entry);
        } catch (error) {
            console.error('Error getting health entry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Создать запись
    create: async (req, res) => {
        try {
            const entryData = req.body;
            
            // Валидация
            if (!entryData.user_id) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            
            if (!entryData.date) {
                entryData.date = new Date().toISOString().split('T')[0];
            }
            
            const entry = await HealthEntry.create(entryData);
            res.status(201).json(entry);
        } catch (error) {
            console.error('Error creating health entry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Обновить запись
    update: async (req, res) => {
        try {
            const { id, userId } = req.params;
            const entryData = req.body;
            
            const entry = await HealthEntry.update(id, userId, entryData);
            
            if (!entry) {
                return res.status(404).json({ error: 'Entry not found' });
            }
            
            res.json(entry);
        } catch (error) {
            console.error('Error updating health entry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Удалить запись
    delete: async (req, res) => {
        try {
            const { id, userId } = req.params;
            
            const result = await HealthEntry.delete(id, userId);
            
            if (!result) {
                return res.status(404).json({ error: 'Entry not found' });
            }
            
            res.json({ message: 'Entry deleted successfully' });
        } catch (error) {
            console.error('Error deleting health entry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Получить прогресс по весу
    getWeightProgress: async (req, res) => {
        try {
            const { userId } = req.params;
            const { limit = 30 } = req.query;
            
            const progress = await HealthEntry.getWeightProgress(userId, parseInt(limit));
            res.json(progress);
        } catch (error) {
            console.error('Error getting weight progress:', error);
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
            
            const stats = await HealthEntry.getStats(userId, startDate, endDate);
            res.json(stats);
        } catch (error) {
            console.error('Error getting health stats:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = healthController;