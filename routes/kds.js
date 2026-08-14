const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getActiveOrders, updateOrderStatus } = require('../controllers/kdsController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.get('/orders', auth, getActiveOrders);

router.put('/orders/:id/status', auth, [
  body('estado').isIn(['PENDIENTE', 'PREPARANDO', 'LISTO', 'ENTREGADO']).withMessage('Estado inválido')
], validate, updateOrderStatus);

module.exports = router;
