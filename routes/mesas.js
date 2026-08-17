const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getAll, create, update, remove, getCuenta, cobrar, suspender, reactivar } = require('../controllers/mesaController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const validate = require('../middlewares/validate');

router.get('/', auth, getAll);
router.get('/:id/cuenta', auth, getCuenta);

router.post('/', auth, roleCheck('ADMIN'), [
  body('nombre').notEmpty().withMessage('Nombre de mesa requerido'),
  body('capacidad').optional().isInt({ min: 1 }).withMessage('Capacidad inválida')
], validate, create);

router.put('/:id', auth, roleCheck('ADMIN'), [
  body('nombre').notEmpty().withMessage('Nombre de mesa requerido'),
  body('capacidad').optional().isInt({ min: 1 }).withMessage('Capacidad inválida')
], validate, update);

router.delete('/:id', auth, roleCheck('ADMIN'), remove);

router.post('/:id/suspender', auth, roleCheck('ADMIN'), suspender);
router.post('/:id/reactivar', auth, roleCheck('ADMIN'), reactivar);

router.post('/:id/cobrar', auth, [
  body('pagos').isArray({ min: 1 }).withMessage('Debe incluir al menos un método de pago'),
  body('pagos.*.metodo_pago').notEmpty().withMessage('Método de pago requerido'),
  body('pagos.*.monto').isFloat({ min: 0.01 }).withMessage('Monto inválido')
], validate, cobrar);

module.exports = router;
