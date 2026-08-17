const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/activityController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');

// Solo ADMIN: es un log de auditoría (accesos, IPs, acciones de todos los usuarios).
router.get('/', auth, roleCheck('ADMIN'), getAll);

module.exports = router;
