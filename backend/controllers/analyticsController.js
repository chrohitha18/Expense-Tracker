const { pool } = require('../config/database');

const getSummary = async (req, res) => {
  const userId = req.user.id;
  const { month, year } = req.query;
  const now = new Date();
  const targetMonth = month || (now.getMonth() + 1).toString().padStart(2, '0');
  const targetYear = year || now.getFullYear().toString();
  const monthStr = `${targetYear}-${targetMonth}`;

  try {
    // Current month stats
    const [monthStats] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE user_id = ? AND strftime('%Y-%m', transaction_date) = ?
    `, [userId, monthStr]);

    // All time balance
    const [balance] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) -
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as balance
      FROM transactions WHERE user_id = ?
    `, [userId]);

    res.json({
      income: parseFloat(monthStats[0].income) || 0,
      expense: parseFloat(monthStats[0].expense) || 0,
      savings: (parseFloat(monthStats[0].income) || 0) - (parseFloat(monthStats[0].expense) || 0),
      balance: parseFloat(balance[0].balance) || 0,
      totalTransactions: monthStats[0].total_transactions || 0
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

const getMonthlyTrend = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.execute(`
      SELECT 
        strftime('%Y-%m', transaction_date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions 
      WHERE user_id = ? AND transaction_date >= date('now', '-6 month')
      GROUP BY strftime('%Y-%m', transaction_date)
      ORDER BY month ASC
    `, [userId]);

    res.json({ trend: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trend' });
  }
};

const getCategoryBreakdown = async (req, res) => {
  const userId = req.user.id;
  const { month, year, type = 'expense' } = req.query;
  const now = new Date();
  const targetMonth = month || (now.getMonth() + 1).toString().padStart(2, '0');
  const targetYear = year || now.getFullYear().toString();
  const monthStr = `${targetYear}-${targetMonth}`;

  try {
    const [rows] = await pool.execute(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM transactions
      WHERE user_id = ? AND type = ? AND strftime('%Y-%m', transaction_date) = ?
      GROUP BY category
      ORDER BY total DESC
    `, [userId, type, monthStr]);

    res.json({ breakdown: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch breakdown' });
  }
};

const getWeeklySpending = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.execute(`
      SELECT 
        CASE strftime('%w', transaction_date) 
          WHEN '0' THEN 'Sunday' WHEN '1' THEN 'Monday' WHEN '2' THEN 'Tuesday' WHEN '3' THEN 'Wednesday' WHEN '4' THEN 'Thursday' WHEN '5' THEN 'Friday' WHEN '6' THEN 'Saturday' END as day,
        strftime('%w', transaction_date) as day_num,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income
      FROM transactions
      WHERE user_id = ? AND transaction_date >= date('now', '-7 day')
      GROUP BY day, day_num
      ORDER BY day_num
    `, [userId]);

    res.json({ weekly: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weekly data' });
  }
};

const getSavingsGrowth = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.execute(`
      SELECT 
        strftime('%Y-%m', transaction_date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) -
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as savings
      FROM transactions 
      WHERE user_id = ? AND transaction_date >= date('now', '-6 month')
      GROUP BY strftime('%Y-%m', transaction_date)
      ORDER BY month ASC
    `, [userId]);

    res.json({ savings: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch savings' });
  }
};

const getHealthScore = async (req, res) => {
  const userId = req.user.id;
  try {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const [stats] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions 
      WHERE user_id = ? AND strftime('%Y-%m', transaction_date) = ?
    `, [userId, monthStr]);

    const income = parseFloat(stats[0].income) || 0;
    const expense = parseFloat(stats[0].expense) || 0;

    let score = 100;
    let factors = [];

    if (income > 0) {
      const expenseRatio = expense / income;
      if (expenseRatio > 0.9) { score -= 40; factors.push('High expense ratio'); }
      else if (expenseRatio > 0.7) { score -= 20; factors.push('Moderate expense ratio'); }
      else if (expenseRatio < 0.5) { factors.push('Excellent savings rate'); }
    }

    const [budgetData] = await pool.execute(`
      SELECT b.category, b.limit_amount,
        COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      LEFT JOIN transactions t ON t.user_id = b.user_id AND t.category = b.category
        AND strftime('%Y-%m', t.transaction_date) = b.month
        AND t.type = 'expense'
      WHERE b.user_id = ? AND b.month = ?
      GROUP BY b.category, b.limit_amount
    `, [userId, monthStr]);

    const budgetOverruns = budgetData.filter(b => parseFloat(b.spent) > parseFloat(b.limit_amount));
    score -= budgetOverruns.length * 10;
    if (budgetOverruns.length > 0) factors.push(`${budgetOverruns.length} budget(s) exceeded`);

    score = Math.max(0, Math.min(100, score));

    res.json({
      score,
      grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
      factors,
      income,
      expense
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate health score' });
  }
};

const getBudgetSummary = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const currentYearStr = `${now.getFullYear()}-%`;
  const yearNum = now.getFullYear().toString();

  try {
    const [monthlyRows] = await pool.execute(`
      SELECT b.category, b.limit_amount,
        COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      LEFT JOIN transactions t ON t.user_id = b.user_id AND t.category = b.category
        AND strftime('%Y-%m', t.transaction_date) = b.month
        AND t.type = 'expense'
      WHERE b.user_id = ? AND b.month = ?
      GROUP BY b.category, b.limit_amount
    `, [userId, currentMonthStr]);

    const [yearlyRows] = await pool.execute(`
      SELECT b.category, SUM(b.limit_amount) as limit_amount,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions t2 
         WHERE t2.user_id = b.user_id AND t2.category = b.category 
         AND t2.type = 'expense' AND strftime('%Y', t2.transaction_date) = ?) as spent
      FROM budgets b
      WHERE b.user_id = ? AND b.month LIKE ?
      GROUP BY b.category
    `, [yearNum, userId, currentYearStr]);

    const [weeklyExpenses] = await pool.execute(`
      SELECT category, SUM(amount) as spent
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND transaction_date >= date('now', '-7 day')
      GROUP BY category
    `, [userId]);

    const weekly = monthlyRows.map(m => {
      const we = weeklyExpenses.find(w => w.category === m.category);
      return {
        category: m.category,
        limit_amount: parseFloat((m.limit_amount / 4.33).toFixed(2)),
        spent: we ? parseFloat(we.spent) : 0
      };
    });

    res.json({
      monthly: monthlyRows,
      yearly: yearlyRows,
      weekly: weekly
    });
  } catch (err) {
    console.error('Budget summary error:', err);
    res.status(500).json({ error: 'Failed to fetch budget summary' });
  }
};

module.exports = { getSummary, getMonthlyTrend, getCategoryBreakdown, getWeeklySpending, getSavingsGrowth, getHealthScore, getBudgetSummary };
