const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const upload = require('../middlewares/upload');

// GET es público para que el menú digital y la app en general puedan usarlo
router.get('/', getSettings);

// PUT es solo para admin
router.put('/', auth, roleCheck('ADMIN'), upload.single('logo'), updateSettings);

module.exports = router;
