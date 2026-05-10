import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Salary', 'Investment', 'Other'];

export default function TransactionModal({ isOpen, onClose, transaction = null, onSuccess }) {
  const [form, setForm] = useState({
    amount: '', type: 'expense', category: 'Food', description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setForm({
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description || '',
        transaction_date: transaction.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0]
      });
    } else {
      setForm({ amount: '', type: 'expense', category: 'Food', description: '',
        transaction_date: new Date().toISOString().split('T')[0] });
    }
  }, [transaction, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      if (transaction) {
        await api.put(`/transactions/${transaction.id}`, form);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', form);
        toast.success('Transaction added');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="glass-strong rounded-2xl p-6 w-full max-w-md relative z-10">

            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-white">
                {transaction ? 'Edit Transaction' : 'New Transaction'}
              </h2>
              <button onClick={onClose}
                className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type toggle */}
              <div className="flex rounded-xl p-1" style={{ background: 'rgba(15,23,42,0.6)' }}>
                {['expense', 'income'].map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={form.type === t ? {
                      background: t === 'income' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                      color: t === 'income' ? '#22C55E' : '#EF4444',
                      border: `1px solid ${t === 'income' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`
                    } : { color: '#64748B' }}>
                    {t === 'income' ? '↑ Income' : '↓ Expense'}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Amount (₹)</label>
                <input type="number" step="0.01" min="0.01" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00" required
                  className="input-dark w-full px-4 py-3 rounded-xl text-lg font-display font-bold" />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Description <span className="text-slate-600">(optional)</span></label>
                <input type="text" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Monthly groceries"
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Date</label>
                <input type="date" value={form.transaction_date}
                  onChange={e => setForm({ ...form, transaction_date: e.target.value })}
                  required className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors glass">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="btn-primary flex-1 py-3 text-sm disabled:opacity-60">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : transaction ? 'Update' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
