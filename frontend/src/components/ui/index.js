import { motion } from 'framer-motion';

// Animated number counter
export const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(Math.abs(value));
  return <span>{prefix}{value < 0 ? '-' : ''}{formatted}{suffix}</span>;
};

// Stat card
export const StatCard = ({ title, value, change, icon, color = 'primary', prefix = '₹', loading }) => {
  const colors = {
    purple: '#6366F1',
    green: '#10B981',
    red: '#EF4444',
    amber: '#F59E0B',
    primary: '#3B82F6',
  };
  const hexColor = colors[color] || colors.primary;

  if (loading) return (
    <div className="glass rounded-xl p-5">
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-8 w-32 mb-2" />
      <div className="skeleton h-3 w-20" />
    </div>
  );

  return (
    <div className="glass rounded-xl p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold"
          style={{ background: `${hexColor}15`, color: hexColor }}>
          {icon}
        </div>
      </div>
      <p className="font-display text-2xl font-semibold text-slate-50 mb-1">
        <AnimatedNumber value={value} prefix={prefix} decimals={0} />
      </p>
      {change !== undefined && (
        <div className="flex items-center gap-1">
          <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-slate-500 text-xs">vs last month</span>
        </div>
      )}
    </div>
  );
};

// Category badge
export const CategoryBadge = ({ category }) => {
  const MAP = {
    Food: { color: '#F59E0B' },
    Travel: { color: '#6366F1' },
    Shopping: { color: '#EC4899' },
    Bills: { color: '#EF4444' },
    Entertainment: { color: '#8B5CF6' },
    Health: { color: '#10B981' },
    Salary: { color: '#10B981' },
    Investment: { color: '#3B82F6' },
    Other: { color: '#94A3B8' },
  };
  const style = MAP[category] || MAP.Other;
  return (
    <span className="inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium text-slate-300">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.color }} />
      {category}
    </span>
  );
};

// Page header
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-50 mb-1">{title}</h1>
      {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// Empty state
export const EmptyState = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && <div className="text-3xl mb-3 opacity-80">{icon}</div>}
    <p className="font-display text-base font-semibold text-slate-300 mb-1">{title}</p>
    {subtitle && <p className="text-slate-500 text-sm max-w-xs">{subtitle}</p>}
  </div>
);

// Loading skeleton grid
export const SkeletonGrid = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array(count).fill(0).map((_, i) => (
      <div key={i} className="glass rounded-xl p-5">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-8 w-32 mb-2" />
        <div className="skeleton h-3 w-20" />
      </div>
    ))}
  </div>
);

// Health score ring (Simplified minimal version)
export const HealthScoreRing = ({ score, grade }) => {
  const colors = { A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#EF4444' };
  const color = colors[grade] || '#94A3B8';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="6" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute text-center flex flex-col items-center">
        <span className="font-display text-xl font-bold text-slate-50">{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{grade} Grade</span>
      </div>
    </div>
  );
};
