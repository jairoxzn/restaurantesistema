const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, register, getMe } = require('../controllers/authController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
], validate, login);

router.post('/register', [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener mínimo 6 caracteres')
], validate, register);

router.get('/me', auth, getMe);

module.exports = router;
