const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./config/database');

const seed = async () => {
  console.log('🌱 Starting database seeding...');
  
  try {
    await testConnection();
    
    // Check if demo user exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', ['demo@fintrack.app']);
    
    if (existing.length > 0) {
      console.log('✨ Demo user already exists. Skipping seeding.');
      process.exit(0);
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('Demo1234', 12);

    // Create Demo User
    await pool.execute(
      'INSERT INTO users (id, name, email, password, currency, theme) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'Demo User', 'demo@fintrack.app', hashedPassword, 'INR', 'dark']
    );

    console.log('✅ Created demo user');

    // Sample Transactions
    const transactions = [
      [uuidv4(), userId, 45000, 'income', 'Salary', 'Monthly Salary', '2026-05-01'],
      [uuidv4(), userId, 1200, 'expense', 'Food', 'Dinner with friends', '2026-05-02'],
      [uuidv4(), userId, 3500, 'expense', 'Shopping', 'New sneakers', '2026-05-03'],
      [uuidv4(), userId, 800, 'expense', 'Travel', 'Uber to office', '2026-05-04'],
      [uuidv4(), userId, 5000, 'expense', 'Bills', 'Electricity bill', '2026-05-05'],
      [uuidv4(), userId, 2500, 'expense', 'Entertainment', 'Movie night', '2026-05-06'],
      [uuidv4(), userId, 1500, 'expense', 'Health', 'Pharmacy', '2026-05-07'],
      [uuidv4(), userId, 10000, 'expense', 'Investment', 'Stock market investment', '2026-05-08'],
      [uuidv4(), userId, 450, 'expense', 'Food', 'Coffee & snacks', '2026-05-09'],
    ];

    for (const tx of transactions) {
      await pool.execute(
        'INSERT INTO transactions (id, user_id, amount, type, category, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        tx
      );
    }

    console.log(`✅ Seeded ${transactions.length} transactions`);

    // Sample Budgets
    const budgets = [
      [uuidv4(), userId, 'Food', 10000, '2026-05'],
      [uuidv4(), userId, 'Travel', 5000, '2026-05'],
      [uuidv4(), userId, 'Shopping', 8000, '2026-05'],
      [uuidv4(), userId, 'Entertainment', 4000, '2026-05'],
    ];

    for (const b of budgets) {
      await pool.execute(
        'INSERT INTO budgets (id, user_id, category, limit_amount, month) VALUES (?, ?, ?, ?, ?)',
        b
      );
    }

    console.log(`✅ Seeded ${budgets.length} budgets`);
    console.log('🚀 Seeding completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
