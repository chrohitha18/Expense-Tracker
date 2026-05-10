const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const generateInsights = async (userId) => {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}`;

  const insights = [];

  try {
    // Category spending comparison
    const [currentCats] = await pool.execute(`
      SELECT category, SUM(amount) as total
      FROM transactions WHERE user_id = ? AND type = 'expense'
      AND strftime('%Y-%m', transaction_date) = ?
      GROUP BY category
    `, [userId, thisMonth]);

    const [lastCats] = await pool.execute(`
      SELECT category, SUM(amount) as total
      FROM transactions WHERE user_id = ? AND type = 'expense'
      AND strftime('%Y-%m', transaction_date) = ?
      GROUP BY category
    `, [userId, lastMonthStr]);

    const lastCatMap = {};
    lastCats.forEach(c => lastCatMap[c.category] = parseFloat(c.total));

    currentCats.forEach(cat => {
      const current = parseFloat(cat.total);
      const last = lastCatMap[cat.category] || 0;
      if (last > 0) {
        const change = ((current - last) / last) * 100;
        if (change > 20) {
          insights.push({
            message: `Your ${cat.category} spending increased by ${change.toFixed(0)}% this month compared to last month.`,
            type: 'spending_trend',
            severity: change > 50 ? 'critical' : 'warning'
          });
        } else if (change < -20) {
          insights.push({
            message: `Great job! Your ${cat.category} spending decreased by ${Math.abs(change).toFixed(0)}% this month.`,
            type: 'positive_trend',
            severity: 'positive'
          });
        }
      }
    });

    // Budget checks
    const [budgetStatus] = await pool.execute(`
      SELECT b.category, b.limit_amount,
        COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      LEFT JOIN transactions t ON t.user_id = b.user_id AND t.category = b.category
        AND strftime('%Y-%m', t.transaction_date) = b.month AND t.type = 'expense'
      WHERE b.user_id = ? AND b.month = ?
      GROUP BY b.category, b.limit_amount
    `, [userId, thisMonth]);

    budgetStatus.forEach(b => {
      const spent = parseFloat(b.spent);
      const limit = parseFloat(b.limit_amount);
      const pct = (spent / limit) * 100;
      if (pct >= 100) {
        insights.push({
          message: `You've exceeded your ${b.category} budget of ₹${limit.toLocaleString()}. Current spending: ₹${spent.toLocaleString()}.`,
          type: 'budget_exceeded',
          severity: 'critical'
        });
      } else if (pct >= 80) {
        insights.push({
          message: `Warning: You've used ${pct.toFixed(0)}% of your ${b.category} budget. Only ₹${(limit - spent).toLocaleString()} left.`,
          type: 'budget_warning',
          severity: 'warning'
        });
      }
    });

    // Savings rate
    const [monthSummary] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions WHERE user_id = ? AND strftime('%Y-%m', transaction_date) = ?
    `, [userId, thisMonth]);

    const income = parseFloat(monthSummary[0].income) || 0;
    const expense = parseFloat(monthSummary[0].expense) || 0;

    if (income > 0) {
      const savingsRate = ((income - expense) / income) * 100;
      if (savingsRate < 0) {
        insights.push({
          message: `Your expenses exceed your income this month by ₹${Math.abs(income - expense).toLocaleString()}. Review your spending.`,
          type: 'negative_savings',
          severity: 'critical'
        });
      } else if (savingsRate >= 30) {
        insights.push({
          message: `Excellent! You're saving ${savingsRate.toFixed(0)}% of your income this month — above the recommended 20%.`,
          type: 'savings_achievement',
          severity: 'positive'
        });
      } else if (savingsRate < 10) {
        const suggestedSaving = income * 0.2 - (income - expense);
        insights.push({
          message: `Your savings rate is only ${savingsRate.toFixed(0)}%. Try to save ₹${suggestedSaving.toLocaleString()} more to reach 20%.`,
          type: 'low_savings',
          severity: 'warning'
        });
      }
    }

    // Top expense category
    if (currentCats.length > 0) {
      const top = currentCats.sort((a, b) => b.total - a.total)[0];
      insights.push({
        message: `${top.category} is your highest expense category this month at ₹${parseFloat(top.total).toLocaleString()}.`,
        type: 'top_category',
        severity: 'info'
      });
    }

    return insights.slice(0, 8); // Max 8 insights
  } catch (err) {
    console.error('Insight generation error:', err);
    return [];
  }
};

const getInsights = async (req, res) => {
  try {
    // Regenerate fresh insights
    const freshInsights = await generateInsights(req.user.id);

    // Save to DB (clear old ones first)
    await pool.execute(
      'DELETE FROM insights WHERE user_id = ? AND created_at < datetime("now", "-1 day")',
      [req.user.id]
    );

    if (freshInsights.length > 0) {
      const values = freshInsights.map(i => [uuidv4(), req.user.id, i.message, i.type, i.severity]);
      // Insert fresh insights (ignore duplicates)
      for (const val of values) {
        await pool.execute(
          'INSERT OR IGNORE INTO insights (id, user_id, insight_message, insight_type, severity) VALUES (?, ?, ?, ?, ?)',
          val
        );
      }
    }

    const [rows] = await pool.execute(
      'SELECT * FROM insights WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );

    res.json({ insights: rows.length > 0 ? rows : freshInsights.map(i => ({ ...i, insight_message: i.message })) });
  } catch (err) {
    console.error('Get insights error:', err);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
};

const markRead = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute(
      'UPDATE insights SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
};

module.exports = { getInsights, markRead };
