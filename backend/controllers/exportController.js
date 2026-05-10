const { pool } = require('../config/database');

const exportCSV = async (req, res) => {
  const { from, to, type, category } = req.query;
  const userId = req.user.id;

  let conditions = ['user_id = ?'];
  let params = [userId];

  if (type) { conditions.push('type = ?'); params.push(type); }
  if (category) { conditions.push('category = ?'); params.push(category); }
  if (from) { conditions.push('transaction_date >= ?'); params.push(from); }
  if (to) { conditions.push('transaction_date <= ?'); params.push(to); }

  try {
    const [rows] = await pool.execute(
      `SELECT amount, type, category, description, transaction_date FROM transactions 
       WHERE ${conditions.join(' AND ')} ORDER BY transaction_date DESC`,
      params
    );

    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const csvRows = rows.map(r => [
      new Date(r.transaction_date).toLocaleDateString('en-IN'),
      r.type,
      r.category,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      r.amount
    ]);

    const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Export failed' });
  }
};

module.exports = { exportCSV };
