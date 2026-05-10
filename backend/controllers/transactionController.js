const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { validationResult } = require('express-validator');

const VALID_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Salary', 'Investment', 'Other'];

const getAll = async (req, res) => {
  const { page = 1, limit = 20, type, category, search, from, to, sortBy = 'transaction_date', order = 'DESC' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const userId = req.user.id;

  let conditions = ['user_id = ?'];
  let params = [userId];

  if (type && ['income', 'expense'].includes(type)) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (category && VALID_CATEGORIES.includes(category)) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (search) {
    conditions.push('(description LIKE ? OR category LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (from) {
    conditions.push('transaction_date >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('transaction_date <= ?');
    params.push(to);
  }

  const whereClause = conditions.join(' AND ');
  const safeSort = ['transaction_date', 'amount', 'created_at'].includes(sortBy) ? sortBy : 'transaction_date';
  const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM transactions WHERE ${whereClause} ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [count] = await pool.execute(
      `SELECT COUNT(*) as total FROM transactions WHERE ${whereClause}`,
      params
    );

    res.json({
      transactions: rows,
      pagination: {
        total: count[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count[0].total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, type, category, description, transaction_date } = req.body;

  try {
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO transactions (id, user_id, amount, type, category, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, parseFloat(amount), type, category, description || '', transaction_date]
    );

    const [rows] = await pool.execute('SELECT * FROM transactions WHERE id = ?', [id]);
    res.status(201).json({ message: 'Transaction added', transaction: rows[0] });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { amount, type, category, description, transaction_date } = req.body;

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await pool.execute(
      'UPDATE transactions SET amount=?, type=?, category=?, description=?, transaction_date=? WHERE id=? AND user_id=?',
      [parseFloat(amount), type, category, description || '', transaction_date, id, req.user.id]
    );

    const [rows] = await pool.execute('SELECT * FROM transactions WHERE id = ?', [id]);
    res.json({ message: 'Transaction updated', transaction: rows[0] });
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

const getById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ transaction: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

module.exports = { getAll, create, update, remove, getById };
