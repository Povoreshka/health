const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// GET /api/health/:userId - получить все записи пользователя
router.get('/:userId', healthController.getByUserId);

// GET /api/health/:userId/date/:date - получить запись по дате
router.get('/:userId/date/:date', healthController.getByDate);

// GET /api/health/:userId/weight-progress - получить прогресс по весу
router.get('/:userId/weight-progress', healthController.getWeightProgress);

// GET /api/health/:userId/stats - получить статистику за период
router.get('/:userId/stats', healthController.getStats);

// POST /api/health - создать запись
router.post('/', healthController.create);

// PUT /api/health/:id/:userId - обновить запись
router.put('/:id/:userId', healthController.update);

// DELETE /api/health/:id/:userId - удалить запись
router.delete('/:id/:userId', healthController.delete);

module.exports = router;