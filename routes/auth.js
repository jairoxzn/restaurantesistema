const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, getMe } = require('../controllers/authController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
], validate, login);

router.get('/me', auth, getMe);

module.exports = router;
