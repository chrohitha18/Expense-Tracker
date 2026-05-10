const express = require('express');
const router = express.Router();
const { exportCSV } = require('../controllers/exportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/csv', exportCSV);

module.exports = router;
