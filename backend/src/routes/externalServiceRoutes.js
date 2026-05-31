const express = require('express');
const router = express.Router();
const externalServiceController = require('../controllers/externalServiceController');

// Define a rota do serviço web simulado
router.get('/productivity-tip', externalServiceController.getTip);

module.exports = router;
