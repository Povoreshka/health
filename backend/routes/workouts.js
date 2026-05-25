const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');

// GET /api/workouts/history/:userId - получить историю тренировок
router.get('/history/:userId', workoutController.getHistory);

// GET /api/workouts/:id/:userId - получить тренировку по ID
router.get('/:id/:userId', workoutController.getWorkoutById);

// GET /api/workouts/stats/:userId - получить статистику за период
router.get('/stats/:userId', workoutController.getStats);

// GET /api/workouts/distribution/:userId - получить распределение по типам
router.get('/distribution/:userId', workoutController.getTypeDistribution);

// GET /api/workouts/weekly/:userId - получить недельную активность
router.get('/weekly/:userId', workoutController.getWeeklyActivity);

// POST /api/workouts - создать запись о тренировке
router.post('/', workoutController.createWorkout);

module.exports = router;