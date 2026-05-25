const Program = require('../models/Program');

const programController = {
    // Получить все программы
    getAll: async (req, res) => {
        try {
            const programs = await Program.getAll();
            res.json(programs);
        } catch (error) {
            console.error('Error getting programs:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Получить программу по ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const program = await Program.getById(id);
            
            if (!program) {
                return res.status(404).json({ error: 'Program not found' });
            }
            
            res.json(program);
        } catch (error) {
            console.error('Error getting program:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Получить активную программу пользователя
    getUserActiveProgram: async (req, res) => {
        try {
            const { userId } = req.params;
            const program = await Program.getUserActiveProgram(userId);
            
            if (!program) {
                return res.status(404).json({ error: 'No active program found' });
            }
            
            res.json(program);
        } catch (error) {
            console.error('Error getting user active program:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Установить активную программу
    setUserActiveProgram: async (req, res) => {
        try {
            const { userId } = req.params;
            const { programId, selectedMuscleGroups } = req.body;
            
            if (!programId) {
                return res.status(400).json({ error: 'Program ID is required' });
            }
            
            const result = await Program.setUserActiveProgram(userId, programId, selectedMuscleGroups);
            res.json(result);
        } catch (error) {
            console.error('Error setting user active program:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Обновить прогресс
    updateProgress: async (req, res) => {
        try {
            const { userId, programId } = req.params;
            const { progress } = req.body;
            
            if (progress === undefined) {
                return res.status(400).json({ error: 'Progress value is required' });
            }
            
            const result = await Program.updateProgress(userId, programId, progress);
            
            if (!result) {
                return res.status(404).json({ error: 'Active program not found' });
            }
            
            res.json(result);
        } catch (error) {
            console.error('Error updating program progress:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Получить программы по уровню
    getByLevel: async (req, res) => {
        try {
            const { level } = req.params;
            const programs = await Program.getByLevel(level);
            res.json(programs);
        } catch (error) {
            console.error('Error getting programs by level:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Получить программы по категории
    getByCategory: async (req, res) => {
        try {
            const { category } = req.params;
            const programs = await Program.getByCategory(category);
            res.json(programs);
        } catch (error) {
            console.error('Error getting programs by category:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = programController;