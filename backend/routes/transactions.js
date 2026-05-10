const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getAll, create, update, remove, getById } = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Salary', 'Investment', 'Other'];

const transactionValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('type').isIn(['income', 'expense']),
  body('category').isIn(CATEGORIES),
  body('transaction_date').isDate()
];

router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', transactionValidation, create);
router.put('/:id', transactionValidation, update);
router.delete('/:id', remove);

module.exports = router;
