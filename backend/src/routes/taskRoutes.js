const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Mapeamento de Rotas -> Controllers
// Rota de estatísticas colocada antes de :id para evitar conflito de roteamento
router.get('/stats', taskController.getDashboardStats);
router.get('/', taskController.getAll);
router.get('/:id', taskController.getById);
router.post('/', taskController.create);
router.put('/:id', taskController.update);
router.delete('/:id', taskController.delete);

module.exports = router;
