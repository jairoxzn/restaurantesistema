const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAll, getById, buscarPorTelefono, create, update, remove, registrarPublico
} = require('../controllers/clienteController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const validate = require('../middlewares/validate');

// Público (menú QR / WhatsApp) — solo registra nombre+teléfono, no requiere login.
router.post('/publico', [
  body('nombre').trim().notEmpty().isLength({ max: 150 }).withMessage('Nombre requerido'),
  body('telefono').trim().notEmpty().isLength({ min: 6, max: 20 }).withMessage('Teléfono inválido'),
], validate, registrarPublico);

// Cualquier usuario logueado puede buscar (autocompletar en el POS).
router.get('/buscar', auth, buscarPorTelefono);

// Gestión completa: solo ADMIN.
router.get('/', auth, roleCheck('ADMIN'), getAll);
router.get('/:id', auth, roleCheck('ADMIN'), getById);

router.post('/', auth, roleCheck('ADMIN'), [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('telefono').trim().notEmpty().isLength({ min: 6, max: 20 }).withMessage('Teléfono inválido'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido'),
], validate, create);

router.put('/:id', auth, roleCheck('ADMIN'), [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('telefono').trim().notEmpty().isLength({ min: 6, max: 20 }).withMessage('Teléfono inválido'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido'),
], validate, update);

router.delete('/:id', auth, roleCheck('ADMIN'), remove);

module.exports = router;
