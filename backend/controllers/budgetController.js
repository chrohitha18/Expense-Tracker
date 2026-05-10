const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const getBudgets = async (req, res) => {
  const { month } = req.query;
  const now = new Date();
  const targetMonth = month || `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  try {
    const [rows] = await pool.execute(`
      SELECT b.*, 
        COALESCE(SUM(t.amount), 0) as spent,
        ROUND((COALESCE(SUM(t.amount), 0) / b.limit_amount) * 100, 1) as percentage
      FROM budgets b
      LEFT JOIN transactions t ON t.user_id = b.user_id 
        AND t.category = b.category 
        AND strftime('%Y-%m', t.transaction_date) = b.month
        AND t.type = 'expense'
      WHERE b.user_id = ? AND b.month = ?
      GROUP BY b.id, b.category, b.limit_amount, b.month
      ORDER BY percentage DESC
    `, [req.user.id, targetMonth]);

    res.json({ budgets: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

const upsertBudget = async (req, res) => {
  const { category, limit_amount, month } = req.body;
  const now = new Date();
  const targetMonth = month || `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  if (!category || !limit_amount) {
    return res.status(400).json({ error: 'Category and limit amount required' });
  }

  try {
    const id = uuidv4();
    await pool.execute(`
      INSERT INTO budgets (id, user_id, category, limit_amount, month)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, category, month) DO UPDATE SET limit_amount = excluded.limit_amount
    `, [id, req.user.id, category, parseFloat(limit_amount), targetMonth]);

    res.json({ message: 'Budget saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save budget' });
  }
};

const deleteBudget = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

module.exports = { getBudgets, upsertBudget, deleteBudget };
