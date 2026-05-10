// routes/analytics.js
const express = require('express');
const router = express.Router();
const { getSummary, getMonthlyTrend, getCategoryBreakdown, getWeeklySpending, getSavingsGrowth, getHealthScore, getBudgetSummary } = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/summary', getSummary);
router.get('/trend', getMonthlyTrend);
router.get('/categories', getCategoryBreakdown);
router.get('/weekly', getWeeklySpending);
router.get('/savings', getSavingsGrowth);
router.get('/health-score', getHealthScore);
router.get('/budget-summary', getBudgetSummary);

module.exports = router;
