const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');

// GET /api/programs - получить все программы
router.get('/', programController.getAll);

// GET /api/programs/:id - получить программу по ID
router.get('/:id', programController.getById);

// GET /api/programs/level/:level - получить программы по уровню
router.get('/level/:level', programController.getByLevel);

// GET /api/programs/category/:category - получить программы по категории
router.get('/category/:category', programController.getByCategory);

// GET /api/programs/user/:userId/active - получить активную программу пользователя
router.get('/user/:userId/active', programController.getUserActiveProgram);

// POST /api/programs/user/:userId/active - установить активную программу
router.post('/user/:userId/active', programController.setUserActiveProgram);

// PUT /api/programs/user/:userId/active/:programId/progress - обновить прогресс
router.put('/user/:userId/active/:programId/progress', programController.updateProgress);

module.exports = router;