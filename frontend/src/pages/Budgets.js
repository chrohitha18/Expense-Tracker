import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { PageHeader, CategoryBadge, EmptyState } from '../components/ui';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Investment', 'Other'];

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Food', limit_amount: '' });

  const currentMonth = new Date().toISOString().slice(0, 7);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budgets?month=${currentMonth}`);
      setBudgets(res.data.budgets || []);
    } catch {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBudgets(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.limit_amount || parseFloat(form.limit_amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await api.post('/budgets', { ...form, month: currentMonth });
      toast.success('Budget saved!');
      setShowForm(false);
      setForm({ category: 'Food', limit_amount: '' });
      fetchBudgets();
    } catch {
      toast.error('Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Budget removed');
      fetchBudgets();
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  return (
    <div>
      <PageHeader
        title="Budget Management"
        subtitle={`Spending limits for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`}
        action={
          <button onClick={() => setShowForm(!showForm)} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
            <span>{showForm ? '✕' : '+'}</span> {showForm ? 'Cancel' : 'Set Budget'}
          </button>
        }
      />

      {/* Add budget form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            className="mb-6">
            <form onSubmit={handleSave} className="glass rounded-2xl p-6">
              <h3 className="font-display text-lg font-bold text-white mb-5">Set Spending Limit</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Monthly Limit (₹)</label>
                  <input type="number" step="100" min="1" value={form.limit_amount}
                    onChange={e => setForm({ ...form, limit_amount: e.target.value })}
                    placeholder="e.g. 5000" required
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="btn-primary w-full py-3 text-sm">Save Budget</button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budgets grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6"><div className="skeleton h-32 rounded-xl" /></div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="glass rounded-2xl p-12">
          <EmptyState title="No budgets set"
            subtitle="Set spending limits to stay on track with your finances" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b, i) => {
            const pct = Math.min(100, parseFloat(b.percentage) || 0);
            const isOver = pct >= 100;
            const isWarn = pct >= 80;
            const color = isOver ? '#EF4444' : isWarn ? '#F59E0B' : '#6366F1';
            const remaining = parseFloat(b.limit_amount) - parseFloat(b.spent);

            return (
              <motion.div key={b.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass rounded-2xl p-6 relative group"
                style={{ border: `1px solid ${isOver ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                <button onClick={() => handleDelete(b.id)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-lg glass flex items-center justify-center text-slate-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 text-xs">
                  ✕
                </button>

                <CategoryBadge category={b.category} />

                <div className="mt-4 mb-3">
                  <div className="flex items-end justify-between mb-1">
                    <p className="font-display text-xl font-bold text-white">
                      ₹{Number(b.spent).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-500">of ₹{Number(b.limit_amount).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="progress-bar mb-3">
                  <motion.div className="progress-fill"
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    style={{ background: isOver ? 'linear-gradient(90deg, #F59E0B, #EF4444)' : `linear-gradient(90deg, #6366F1, ${color})` }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color }}>
                    {pct.toFixed(0)}% used
                  </span>
                  {remaining >= 0 ? (
                    <span className="text-xs text-slate-400">₹{Number(remaining).toLocaleString('en-IN')} left</span>
                  ) : (
                    <span className="text-xs text-red-400">₹{Number(Math.abs(remaining)).toLocaleString('en-IN')} over</span>
                  )}
                </div>

                {isOver && (
                  <div className="mt-3 p-2 rounded-lg text-xs text-red-300 text-center"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    ⚠ Budget exceeded!
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
