import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatCard, PageHeader, CategoryBadge, HealthScoreRing, EmptyState } from '../components/ui';
import TransactionModal from '../components/modals/TransactionModal';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [sumRes, txRes, insRes, healthRes, budgetRes, trendRes] = await Promise.allSettled([
        api.get('/analytics/summary'),
        api.get('/transactions?limit=6&sortBy=transaction_date&order=DESC'),
        api.get('/insights'),
        api.get('/analytics/health-score'),
        api.get('/budgets'),
        api.get('/analytics/trend')
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
      if (txRes.status === 'fulfilled') setTransactions(txRes.value.data.transactions || []);
      if (insRes.status === 'fulfilled') setInsights(insRes.value.data.insights || []);
      if (healthRes.status === 'fulfilled') setHealthScore(healthRes.value.data);
      if (budgetRes.status === 'fulfilled') setBudgets(budgetRes.value.data.budgets || []);
      if (trendRes.status === 'fulfilled') setTrend(trendRes.value.data.trend || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const severityConfig = {
    info: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', color: '#818CF8', icon: 'ℹ' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', color: '#F59E0B', icon: '⚠' },
    critical: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', color: '#EF4444', icon: '🔴' },
    positive: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', color: '#22C55E', icon: '✓' },
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const trendData = {
    labels: trend.map(d => {
      const [y, m] = d.month.split('-');
      return new Date(y, m - 1).toLocaleString('default', { month: 'short' });
    }),
    datasets: [{
      label: 'Net Savings',
      data: trend.map(d => (parseFloat(d.income) || 0) - (parseFloat(d.expense) || 0)),
      borderColor: '#818CF8',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(129,140,248,0.5)');
        gradient.addColorStop(1, 'rgba(129,140,248,0.0)');
        return gradient;
      },
      fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0, pointHoverRadius: 6
    }]
  };

  const trendOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#F8FAFC', bodyColor: '#CBD5E1', padding: 12, cornerRadius: 8
    } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748B', font: { family: 'Inter', size: 10 } } },
      y: { display: false }
    },
    interaction: { mode: 'index', intersect: false }
  };

  return (
    <div className="pb-10">
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0]} 👋`}
        subtitle={`Here's your financial overview for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`}
        action={
          <button onClick={() => setModalOpen(true)} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow">
            <span className="text-lg leading-none">+</span> Add Transaction
          </button>
        }
      />

      {/* Stats grid */}
      <motion.div variants={container} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div variants={item}>
          <StatCard title="Total Balance" value={summary?.balance || 0} icon="◈" color="purple" loading={loading} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Monthly Income" value={summary?.income || 0} icon="↑" color="green" loading={loading} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Monthly Expense" value={summary?.expense || 0} icon="↓" color="red" loading={loading} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Net Savings" value={summary?.savings || 0} icon="🏦" color="amber" loading={loading} />
        </motion.div>
      </motion.div>

      {/* Top Row: Mini Chart & Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Quick Trend Chart */}
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2 glass rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg font-bold text-white">Savings Trend</h2>
            <a href="/analytics" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">Full Analytics →</a>
          </div>
          <p className="text-xs text-slate-400 mb-4">Your net savings over the last 6 months</p>
          <div className="h-48 w-full">
            {loading ? <div className="skeleton w-full h-full rounded-xl" /> : 
              trend.length === 0 ? <EmptyState title="No data" subtitle="Not enough data for trend" /> :
              <Line data={trendData} options={trendOptions} />
            }
          </div>
        </motion.div>

        {/* Financial Health */}
        <motion.div variants={item} initial="hidden" animate="show" className="glass rounded-2xl p-6 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="font-display text-lg font-bold text-white mb-4">Financial Health</h2>
          {loading ? (
            <div className="flex justify-center"><div className="skeleton w-28 h-28 rounded-full" /></div>
          ) : healthScore ? (
            <div className="flex flex-col items-center">
              <HealthScoreRing score={healthScore.score} grade={healthScore.grade} />
              <div className="mt-4 w-full space-y-2.5 bg-slate-800/30 p-3 rounded-xl border border-white/5">
                {healthScore.factors?.map((f, i) => (
                  <p key={i} className="text-xs text-slate-300 flex items-center gap-2">
                    <span className="text-amber-400 text-lg leading-none">•</span> {f}
                  </p>
                ))}
                {(!healthScore.factors || healthScore.factors.length === 0) && 
                  <p className="text-xs text-slate-400 text-center">Looking good! Keep it up.</p>
                }
              </div>
            </div>
          ) : (
            <EmptyState title="No data" subtitle="Add transactions to see your score" />
          )}
        </motion.div>
      </div>

      {/* Bottom Row: Transactions, AI Insights, Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent transactions */}
        <motion.div variants={item} initial="hidden" animate="show" className="glass rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-bold text-white">Recent Transactions</h2>
            <a href="/transactions" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">View all →</a>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32 mb-2" />
                    <div className="skeleton h-3 w-24" />
                  </div>
                  <div className="skeleton h-5 w-16" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="No transactions yet" subtitle="Add your first transaction to start tracking" />
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              {transactions.map((tx, idx) => (
                <motion.div key={tx.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-default border border-transparent hover:border-white/5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-inner"
                    style={{ background: tx.type === 'income' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}>
                    {tx.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                      {tx.description || tx.category}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={tx.category} />
                      <span className="text-[11px] text-slate-500 font-medium">
                        {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <p className="font-display font-bold text-sm shrink-0" style={{ color: tx.type === 'income' ? '#4ADE80' : '#F87171' }}>
                    {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* AI Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-display text-lg font-bold text-white">Insights</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : insights.length === 0 ? (
             <div className="flex-1 flex items-center justify-center">
              <EmptyState title="No insights yet" subtitle="Add more transactions to get detailed insights" />
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[300px]">
              {insights.slice(0, 4).map((ins, i) => {
                const cfg = severityConfig[ins.severity] || severityConfig.info;
                return (
                  <motion.div key={ins.id || i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                    className="p-3.5 rounded-xl text-sm relative overflow-hidden group"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-3 relative z-10">
                      <span className="mt-0.5" style={{ color: cfg.color }}>{cfg.icon}</span>
                      <p className="text-slate-300 leading-relaxed font-medium">
                        {ins.insight_message || ins.message}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Budget Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-bold text-white">Budget Progress</h2>
            <a href="/budgets" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">Manage →</a>
          </div>
          {loading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : budgets.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="No budgets set" subtitle="Set spending limits to track your goals" />
            </div>
          ) : (
            <div className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[300px]">
              {budgets.slice(0, 4).map((b, i) => {
                const pct = Math.min(100, parseFloat(b.percentage) || 0);
                const isOver = pct >= 100;
                const isWarn = pct >= 80;
                const color = isOver ? '#EF4444' : isWarn ? '#F59E0B' : '#6366F1';
                return (
                  <div key={b.id || i} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <CategoryBadge category={b.category} />
                      <div className="text-right">
                        <p className="text-[13px] font-bold" style={{ color }}>
                          ₹{Number(b.spent).toLocaleString('en-IN')} <span className="text-slate-500 font-medium">/ ₹{Number(b.limit_amount).toLocaleString('en-IN')}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">{pct.toFixed(0)}% used</p>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                        style={{ background: isOver ? 'linear-gradient(90deg, #F87171, #DC2626)' : `linear-gradient(90deg, #818CF8, ${color})`, boxShadow: `0 0 10px ${color}40` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

      </div>

      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchAll} />
    </div>
  );
}
