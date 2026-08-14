const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getEstado, abrirCaja, cerrarCaja, agregarGasto, getGastos, getHistorialCajas } = require('../controllers/cajaController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.get('/estado', auth, getEstado);
router.get('/gastos', auth, getGastos);
router.get('/historial', auth, getHistorialCajas);

router.post('/abrir', auth, [
  body('monto_apertura').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Monto de apertura inválido')
], validate, abrirCaja);

router.put('/cerrar/:id', auth, [
  body('monto_declarado').optional({ nullable: true }),
  body('desglose_declarado').optional({ nullable: true })
], validate, cerrarCaja);

router.post('/gastos', auth, [
  body('concepto').notEmpty().withMessage('El concepto es requerido'),
  body('monto').isFloat({ min: 0.01 }).withMessage('Monto inválido')
], validate, agregarGasto);

module.exports = router;
