const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getAll, create, update, remove } = require('../controllers/categoryController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const validate = require('../middlewares/validate');

router.get('/public', getAll);
router.get('/', auth, getAll);

router.post('/', auth, roleCheck('ADMIN'), [
  body('nombre').notEmpty().withMessage('Nombre de categoría requerido')
], validate, create);

router.put('/:id', auth, roleCheck('ADMIN'), [
  body('nombre').notEmpty().withMessage('Nombre de categoría requerido')
], validate, update);

router.delete('/:id', auth, roleCheck('ADMIN'), remove);

module.exports = router;
