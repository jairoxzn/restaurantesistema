const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getAll, create, update, remove } = require('../controllers/userController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const validate = require('../middlewares/validate');

router.get('/', auth, roleCheck('ADMIN'), getAll);

router.post('/', auth, roleCheck('ADMIN'), [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener mínimo 6 caracteres'),
  body('rol').isIn(['ADMIN', 'EMPLEADO']).withMessage('Rol inválido')
], validate, create);

router.put('/:id', auth, roleCheck('ADMIN'), [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('rol').isIn(['ADMIN', 'EMPLEADO']).withMessage('Rol inválido')
], validate, update);

router.delete('/:id', auth, roleCheck('ADMIN'), remove);

module.exports = router;
