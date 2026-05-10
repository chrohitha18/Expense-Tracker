import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { PageHeader, CategoryBadge, EmptyState } from '../components/ui';
import TransactionModal from '../components/modals/TransactionModal';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Salary', 'Investment', 'Other'];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', category: '', search: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, sortBy: 'transaction_date', order: 'DESC' });
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'All') params.append(k, v === 'All' ? '' : v);
      });
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.transactions || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      setDeleteId(null);
      fetchTransactions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      const res = await api.get(`/export/csv?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${Date.now()}.csv`;
      a.click();
      toast.success('CSV exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${pagination.total || 0} total transactions`}
        action={
          <div className="flex gap-3">
            <button onClick={handleExport}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white glass hover:bg-white/10 transition-all flex items-center gap-2">
              ↓ Export CSV
            </button>
            <button onClick={() => { setEditTx(null); setModalOpen(true); }} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
              <span className="text-lg leading-none">+</span> Add
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="glass rounded-2xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <input type="text" placeholder="🔍 Search..." value={filters.search}
          onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
          className="input-dark px-3 py-2 rounded-xl text-sm col-span-2" />

        <select value={filters.type}
          onChange={e => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
          className="input-dark px-3 py-2 rounded-xl text-sm appearance-none cursor-pointer">
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select value={filters.category}
          onChange={e => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
          className="input-dark px-3 py-2 rounded-xl text-sm appearance-none cursor-pointer">
          {CATEGORIES.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
        </select>

        <input type="date" value={filters.from}
          onChange={e => { setFilters({ ...filters, from: e.target.value }); setPage(1); }}
          className="input-dark px-3 py-2 rounded-xl text-sm" />

        <input type="date" value={filters.to}
          onChange={e => { setFilters({ ...filters, to: e.target.value }); setPage(1); }}
          className="input-dark px-3 py-2 rounded-xl text-sm" />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr>
                <th className="text-left">Date</th>
                <th className="text-left">Description</th>
                <th className="text-left">Category</th>
                <th className="text-left">Type</th>
                <th className="text-right">Amount</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <EmptyState title="No transactions found"
                      subtitle="Try adjusting your filters or add a new transaction" />
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {transactions.map((tx, idx) => (
                    <motion.tr key={tx.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.03 }}>
                      <td className="text-slate-400 text-xs whitespace-nowrap">
                        {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="max-w-xs">
                        <p className="text-slate-200 text-sm truncate">{tx.description || '—'}</p>
                      </td>
                      <td><CategoryBadge category={tx.category} /></td>
                      <td>
                        <span className={`badge ${tx.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                          {tx.type === 'income' ? '↑ Income' : '↓ Expense'}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="font-display font-bold text-sm"
                          style={{ color: tx.type === 'income' ? '#22C55E' : '#EF4444' }}>
                          {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setEditTx(tx); setModalOpen(true); }}
                            className="w-7 h-7 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors text-xs">
                            ✎
                          </button>
                          <button onClick={() => setDeleteId(tx.id)}
                            className="w-7 h-7 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors text-xs">
                            ✕
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <p className="text-sm text-slate-400">
              Page {page} of {pagination.pages} • {pagination.total} total
            </p>
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${p === page ? 'text-white' : 'text-slate-400 hover:text-white glass'}`}
                  style={p === page ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' } : {}}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-2xl p-6 max-w-sm w-full relative z-10 text-center">
              <div className="text-4xl mb-3">🗑️</div>
              <h3 className="font-display text-lg font-bold text-white mb-2">Delete Transaction?</h3>
              <p className="text-slate-400 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl glass text-slate-300 text-sm font-semibold">Cancel</button>
                <button onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TransactionModal isOpen={modalOpen} transaction={editTx} onClose={() => { setModalOpen(false); setEditTx(null); }} onSuccess={fetchTransactions} />
    </div>
  );
}
