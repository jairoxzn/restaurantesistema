const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { create, getAll, getById } = require('../controllers/saleController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.get('/', auth, getAll);
router.get('/:id', auth, getById);

router.post('/', auth, [
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('items.*.producto_id').notEmpty().withMessage('ID de producto inválido'),
  body('items.*.cantidad').notEmpty().withMessage('Cantidad inválida'),
  body('items.*.precio_unitario').notEmpty().withMessage('Precio unitario inválido'),
  body('mesa_id').optional({ nullable: true }),
  body('metodo_pago').optional({ nullable: true })
], validate, create);

module.exports = router;
