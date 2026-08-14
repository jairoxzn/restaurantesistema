const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getProductKardex, addMovement } = require('../controllers/kardexController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const validate = require('../middlewares/validate');

router.get('/:productId', auth, roleCheck('ADMIN'), getProductKardex);

router.post('/:productId', auth, roleCheck('ADMIN'), [
  body('tipo').isIn(['INGRESO', 'MERMA', 'AJUSTE']).withMessage('Tipo inválido'),
  body('cantidad').isNumeric().withMessage('Cantidad debe ser un número'),
  body('motivo').optional().isString()
], validate, addMovement);

module.exports = router;
