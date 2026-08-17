const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/notificationController');
const auth = require('../middlewares/auth');

router.get('/', auth, getAll);

module.exports = router;
