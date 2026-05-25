const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /api/users - получить всех пользователей
router.get('/', userController.getAllUsers);

// GET /api/users/:id - получить пользователя по ID
router.get('/:id', userController.getUserById);

// GET /api/users/:id/stats - получить полную статистику пользователя
router.get('/:id/stats', userController.getUserStats);

// POST /api/users - создать пользователя
router.post('/', userController.createUser);

// PUT /api/users/:id - обновить пользователя
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - удалить пользователя
router.delete('/:id', userController.deleteUser);

module.exports = router;