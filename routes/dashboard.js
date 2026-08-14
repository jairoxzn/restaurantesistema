const express = require('express');
const router = express.Router();
const { getStats, getTopProducts, getSalesChart } = require('../controllers/dashboardController');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');

router.get('/stats', auth, roleCheck('ADMIN'), getStats);
router.get('/top-products', auth, roleCheck('ADMIN'), getTopProducts);
router.get('/sales-chart', auth, roleCheck('ADMIN'), getSalesChart);

module.exports = router;
