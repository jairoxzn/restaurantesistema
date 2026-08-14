const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getAll, getById, create, update, remove, getLowStock } = require('../controllers/productController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');

router.get('/public', getAll);
router.get('/', auth, getAll);
router.get('/low-stock', auth, roleCheck('ADMIN'), getLowStock);
router.get('/:id', auth, getById);

router.post('/', auth, roleCheck('ADMIN'), upload.single('imagen'), [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('precio').isFloat({ min: 0 }).withMessage('Precio inválido'),
  body('stock').isInt({ min: 0 }).withMessage('Stock inválido'),
  body('categoria_id').isInt().withMessage('Categoría requerida')
], validate, create);

router.put('/:id', auth, roleCheck('ADMIN'), upload.single('imagen'), update);

router.delete('/:id', auth, roleCheck('ADMIN'), remove);

module.exports = router;
