import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', currency: user?.currency || 'INR' });
  const [saving, setSaving] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const SectionCard = ({ title, subtitle, children }) => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 mb-5">
      <div className="mb-5">
        <h2 className="font-display text-lg font-bold text-white">{title}</h2>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      {/* Profile */}
      <SectionCard title="Profile" subtitle="Update your personal information">
        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
            <input type="text" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
            <input type="email" value={user?.email} disabled
              className="input-dark w-full px-4 py-3 rounded-xl text-sm opacity-50 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Currency</label>
            <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
              className="input-dark w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer">
              <option value="INR">₹ INR — Indian Rupee</option>
              <option value="USD">$ USD — US Dollar</option>
              <option value="EUR">€ EUR — Euro</option>
              <option value="GBP">£ GBP — British Pound</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </SectionCard>

      {/* Account info */}
      <SectionCard title="Account" subtitle="Your account details">
        <div className="space-y-3">
          {[
            { label: 'User ID', value: user?.id?.slice(0, 8) + '...' },
            { label: 'Member Since', value: 'Active Account' },
            { label: 'Plan', value: 'Free Tier' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <span className="text-slate-400 text-sm">{label}</span>
              <span className="text-slate-200 text-sm font-medium font-mono">{value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* About */}
      <SectionCard title="About BudgetStack" subtitle="Version and tech info">
        <div className="space-y-2">
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'Frontend', value: 'React 18 + Tailwind CSS + Framer Motion' },
            { label: 'Backend', value: 'Node.js + Express + SQLite' },
            { label: 'Charts', value: 'Chart.js + React Chart.js 2' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
              <span className="text-slate-400 text-sm">{label}</span>
              <span className="text-slate-300 text-xs font-mono">{value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Danger zone */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl p-6" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <h2 className="font-display text-lg font-bold text-red-400 mb-1">Danger Zone</h2>
        <p className="text-slate-400 text-sm mb-5">Actions here are irreversible. Proceed with caution.</p>
        <button onClick={handleLogout}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:text-white transition-all"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
          onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.25)'}
          onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.1)'}>
          Sign Out of Account
        </button>
      </motion.div>
    </div>
  );
}
