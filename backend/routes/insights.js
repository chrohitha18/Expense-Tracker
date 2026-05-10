// routes/insights.js
const express = require('express');
const router = express.Router();
const { getInsights, markRead } = require('../controllers/insightController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getInsights);
router.patch('/:id/read', markRead);

module.exports = router;
