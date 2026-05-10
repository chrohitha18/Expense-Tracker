import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut, Chart } from 'react-chartjs-2';
import api from '../services/api';
import { PageHeader, EmptyState, CategoryBadge } from '../components/ui';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { 
      labels: { color: '#94A3B8', font: { family: 'Inter', size: 12 }, usePointStyle: true, padding: 20 } 
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: '#F8FAFC',
      bodyColor: '#CBD5E1',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      boxPadding: 6,
      usePointStyle: true,
      titleFont: { family: 'Inter', size: 13, weight: 'bold' },
      bodyFont: { family: 'Inter', size: 12 }
    }
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  scales: {
    x: { 
      grid: { display: false }, 
      ticks: { color: '#64748B', font: { family: 'Inter' } } 
    },
    y: { 
      border: { display: false }, 
      grid: { color: 'rgba(255,255,255,0.05)' }, 
      ticks: { color: '#64748B', font: { family: 'Inter' } } 
    }
  }
};

const monthLabels = (data) => data.map(d => {
  const [y, m] = d.month.split('-');
  return new Date(y, m - 1).toLocaleString('default', { month: 'short' });
});

const WealthTimeMachine = ({ savingsData }) => {
  const [returnRate, setReturnRate] = useState(8);
  const [extraSavings, setExtraSavings] = useState(0);

  const baseSavings = useMemo(() => {
    if (!savingsData || savingsData.length === 0) return 0;
    const total = savingsData.reduce((sum, d) => sum + (parseFloat(d.savings) || 0), 0);
    return Math.max(0, total / savingsData.length);
  }, [savingsData]);

  const totalMonthly = baseSavings + extraSavings;

  const projectionData = useMemo(() => {
    const years = [1, 5, 10, 15, 20, 25, 30];
    const data = years.map(y => {
      if (totalMonthly <= 0) return 0;
      const r = (returnRate / 100) / 12;
      const n = y * 12;
      const fv = totalMonthly * (((Math.pow(1 + r, n) - 1)) / r);
      return Math.round(fv);
    });

    return {
      labels: years.map(y => `Year ${y}`),
      datasets: [{
        label: 'Projected Wealth',
        data,
        borderColor: '#10B981',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
          return gradient;
        },
        fill: true, tension: 0.4, borderWidth: 3, pointRadius: 4,
        pointBackgroundColor: '#1E293B', pointBorderColor: '#10B981', pointBorderWidth: 2
      }]
    };
  }, [totalMonthly, returnRate]);

  if (!savingsData || savingsData.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6 lg:col-span-2 relative overflow-hidden group" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5 opacity-100" />
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⏳</span>
            <h2 className="font-display text-xl font-bold text-white">Wealth Time Machine</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            What if you invested your net savings? You historically save <strong className="text-emerald-400">₹{Math.round(baseSavings).toLocaleString('en-IN')}</strong>/mo. See your future wealth.
          </p>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Expected Market Return</span>
                <span className="text-indigo-400 font-bold">{returnRate}%</span>
              </div>
              <input type="range" min="1" max="15" step="0.5" value={returnRate} 
                onChange={e => setReturnRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-500" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Boost Extra Savings/mo</span>
                <span className="text-emerald-400 font-bold">+₹{extraSavings.toLocaleString('en-IN')}</span>
              </div>
              <input type="range" min="0" max="50000" step="500" value={extraSavings} 
                onChange={e => setExtraSavings(parseFloat(e.target.value))}
                className="w-full accent-emerald-500" />
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Projected 30-Year Wealth</p>
              <p className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                ₹{projectionData.datasets[0].data[6]?.toLocaleString('en-IN') || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 h-[350px]">
           <Line data={projectionData} options={{
             ...CHART_OPTS, 
             plugins: { 
               ...CHART_OPTS.plugins, 
               tooltip: { ...CHART_OPTS.plugins.tooltip, callbacks: { label: (ctx) => `₹${ctx.raw.toLocaleString('en-IN')}` } } 
             }
           }} />
        </div>
      </div>
    </div>
  );
};

export default function Analytics() {
  const [trend, setTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [savings, setSavings] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState({ weekly: [], monthly: [], yearly: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [trendRes, catRes, savRes, budgetRes] = await Promise.allSettled([
          api.get('/analytics/trend'),
          api.get('/analytics/categories?type=expense'),
          api.get('/analytics/savings'),
          api.get('/analytics/budget-summary')
        ]);
        if (trendRes.status === 'fulfilled') setTrend(trendRes.value.data.trend || []);
        if (catRes.status === 'fulfilled') setCategories(catRes.value.data.breakdown || []);
        if (savRes.status === 'fulfilled') setSavings(savRes.value.data.savings || []);
        if (budgetRes.status === 'fulfilled') setBudgetSummary(budgetRes.value.data || { weekly: [], monthly: [], yearly: [] });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const CATEGORY_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#22C55E', '#0EA5E9', '#14B8A6', '#F97316'];

  const mixedData = {
    labels: monthLabels(trend),
    datasets: [
      {
        type: 'line',
        label: 'Net Trend',
        data: trend.map(d => (parseFloat(d.income) || 0) - (parseFloat(d.expense) || 0)),
        borderColor: '#3B82F6', borderWidth: 3, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#1E293B'
      },
      {
        type: 'bar', label: 'Income',
        data: trend.map(d => parseFloat(d.income) || 0),
        backgroundColor: '#10B981', borderRadius: 4, barPercentage: 0.5
      },
      {
        type: 'bar', label: 'Expense',
        data: trend.map(d => parseFloat(d.expense) || 0),
        backgroundColor: '#EF4444', borderRadius: 4, barPercentage: 0.5
      }
    ]
  };

  const savingsStockData = {
    labels: monthLabels(savings),
    datasets: [{
      label: 'Net Savings', data: savings.map(d => parseFloat(d.savings) || 0),
      tension: 0.4, borderWidth: 2, pointRadius: 2, fill: true,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
        return gradient;
      },
      segment: { borderColor: ctx => ctx.p0.parsed.y > ctx.p1.parsed.y ? '#EF4444' : '#10B981' }
    }]
  };

  const doughnutData = {
    labels: categories.map(c => c.category),
    datasets: [{
      data: categories.map(c => parseFloat(c.total)),
      backgroundColor: CATEGORY_COLORS.slice(0, categories.length),
      borderColor: '#1E293B', borderWidth: 2, hoverOffset: 8, borderRadius: 2
    }]
  };

  const ChartCard = ({ title, children, height = 280, span = 1 }) => (
    <div className={`glass rounded-xl p-6 ${span > 1 ? 'lg:col-span-' + span : ''}`}>
      <h3 className="font-display text-base font-semibold text-slate-50 mb-4">{title}</h3>
      <div style={{ height }}>
        {loading ? <div className="skeleton w-full h-full rounded-xl" /> : children}
      </div>
    </div>
  );

  const BudgetList = ({ title, data, period }) => (
    <div className="glass rounded-xl p-6 flex flex-col h-full">
      <h3 className="font-display text-base font-semibold text-slate-50 mb-4">{title}</h3>
      {loading ? (
        <div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title={`No ${period} budgets`} />
      ) : (
        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
          {data.map((b, i) => {
            const pct = Math.min(100, parseFloat(b.percentage) || 0);
            const isOver = pct >= 100;
            const color = isOver ? '#EF4444' : '#3B82F6';
            return (
              <div key={b.category || i}>
                <div className="flex items-center justify-between mb-1">
                  <CategoryBadge category={b.category} />
                  <div className="text-right text-xs">
                    <span className="font-medium text-slate-200">₹{Number(b.spent).toLocaleString('en-IN')}</span>
                    <span className="text-slate-500"> / ₹{Number(b.limit_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                    style={{ background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="pb-10 space-y-6">
      <PageHeader title="Analytics & Budgets" subtitle="Deep dive into financial patterns and future wealth projections" />

      {/* NEW: Wealth Time Machine takes full width at the top to be extremely impressive */}
      {!loading && <WealthTimeMachine savingsData={savings} />}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        <ChartCard title="Month to Month: Income vs Expenditure">
          {trend.length === 0 ? <EmptyState title="No data" /> :
            <Chart type="bar" data={mixedData} options={CHART_OPTS} />}
        </ChartCard>

        <ChartCard title="Historical Savings Growth">
          {savings.length === 0 ? <EmptyState title="No savings data" /> :
            <Line data={savingsStockData} options={CHART_OPTS} />}
        </ChartCard>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Expense by Category" height={320}>
          {categories.length === 0 ? <EmptyState title="No expense data" /> :
            <Doughnut data={doughnutData} options={{
              ...CHART_OPTS, cutout: '80%',
              plugins: { ...CHART_OPTS.plugins, legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true } } }
            }} />}
        </ChartCard>
        
        {/* Category breakdown table */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-display text-base font-semibold text-slate-50 mb-5">Category Breakdown</h3>
          {loading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
          ) : categories.length === 0 ? (
            <EmptyState title="No categories" />
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {categories.map((cat, i) => {
                const total = categories.reduce((s, c) => s + parseFloat(c.total), 0);
                const pct = total > 0 ? (parseFloat(cat.total) / total) * 100 : 0;
                return (
                  <div key={cat.category} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">{cat.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-medium">{pct.toFixed(1)}%</span>
                        <span className="text-sm font-display font-bold text-white">
                          ₹{Number(cat.total).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                        style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Budgets Section */}
      <h2 className="font-display text-xl font-bold text-white mt-8 mb-4">Budget Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BudgetList title="This Week's Snapshot" data={budgetSummary.weekly} period="weekly" />
        <BudgetList title="This Month's Snapshot" data={budgetSummary.monthly} period="monthly" />
        <BudgetList title="This Year's Snapshot" data={budgetSummary.yearly} period="yearly" />
      </div>
    </div>
  );
}
