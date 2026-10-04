import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShoppingBag, BarChart3, Target,
  ScanLine, ArrowRight, AlertTriangle, Wallet
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { dashboardService } from '../services/expense.service';
import type { DashboardSummary, CategoryData, MonthlyData, Expense } from '../types';
import { format } from 'date-fns';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#8b5cf6', '#fb923c', '#94a3b8'];

const getCategoryClass = (cat: string) => {
  const map: Record<string, string> = {
    'Groceries': 'cat-groceries', 'Food & Dining': 'cat-food',
    'Transportation': 'cat-transportation', 'Shopping': 'cat-shopping',
    'Entertainment': 'cat-entertainment', 'Healthcare': 'cat-healthcare',
    'Utilities': 'cat-utilities', 'Travel': 'cat-travel',
    'Education': 'cat-education', 'Other': 'cat-other',
  };
  return map[cat] || 'cat-other';
};

const formatCurrency = (amount: number, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [recent, setRecent] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [s, c, m, r] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getCategories(),
        dashboardService.getMonthly(),
        dashboardService.getRecent(),
      ]);
      setSummary(s);
      setCategories(c);
      setMonthly(m);
      setRecent(r);
    } catch {
      // handled silently, data remains empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Spending', value: formatCurrency(summary?.totalSpending || 0), icon: TrendingUp, color: '#7c3aed' },
    { label: 'Total Expenses', value: (summary?.totalExpenses || 0).toString(), icon: ShoppingBag, color: '#06b6d4' },
    { label: 'Average Expense', value: formatCurrency(summary?.averageExpense || 0), icon: BarChart3, color: '#10b981' },
    { label: 'Highest Expense', value: formatCurrency(summary?.highestExpense || 0), icon: Target, color: '#f59e0b' },
  ];

  const budgetUsed = summary?.budgetUsedPercentage || 0;
  const isOverBudget = budgetUsed > 100;
  const hasBudget = (summary?.monthlyBudget ?? 0) > 0;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Your financial overview</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/scan')} id="scan-receipt-btn">
          <ScanLine size={18} /> Scan Receipt
        </button>
      </div>

      {/* Budget Alert */}
      {hasBudget && isOverBudget && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#ef4444',
        }}>
          <AlertTriangle size={20} />
          <span style={{ fontWeight: 600 }}>Budget exceeded! You've spent {budgetUsed.toFixed(1)}% of your monthly budget.</span>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Budget Progress */}
      {hasBudget && summary && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={18} color="#a78bfa" />
              <span style={{ fontWeight: 600 }}>Monthly Budget</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {formatCurrency(summary.monthlySpending)} / {formatCurrency(summary.monthlyBudget)}
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{
              width: `${Math.min(budgetUsed, 100)}%`,
              background: isOverBudget ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'var(--accent-gradient)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.82rem' }}>
            <span style={{ color: isOverBudget ? '#ef4444' : '#10b981', fontWeight: 600 }}>
              {budgetUsed.toFixed(1)}% used
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {summary.remainingBudget >= 0 ? `${formatCurrency(summary.remainingBudget)} remaining` : `${formatCurrency(Math.abs(summary.remainingBudget))} over budget`}
            </span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Category Pie Chart */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>Spending by Category</h3>
          {categories.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {categories.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    formatter={(v: unknown) => [formatCurrency(Number(v) || 0), 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {categories.slice(0, 5).map(({ category }, i) => (
                  <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{category}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No expense data yet
            </div>
          )}
        </div>

        {/* Monthly Bar Chart */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>Monthly Spending</h3>
          {monthly.some(m => m.amount > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthly} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  formatter={(v: unknown) => [formatCurrency(Number(v) || 0), 'Spending']}
                />
                <Bar dataKey="amount" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No monthly data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Recent Expenses</h3>
          <button
            className="btn-secondary"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
            onClick={() => navigate('/expenses')}
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No expenses yet</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Start by scanning your first receipt</p>
            <button className="btn-primary" onClick={() => navigate('/scan')}>
              <ScanLine size={16} /> Scan your first receipt
            </button>
          </div>
        ) : (
          <div>
            {recent.map((expense) => (
              <div
                key={expense.id}
                onClick={() => navigate(`/expenses/${expense.id}`)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.85rem 0', borderBottom: '1px solid rgba(45,58,90,0.5)',
                  cursor: 'pointer', transition: 'all 0.2s', borderRadius: '8px',
                }}
                onMouseEnter={e => (e.currentTarget.style.paddingLeft = '0.5rem')}
                onMouseLeave={e => (e.currentTarget.style.paddingLeft = '0')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(124,58,237,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem',
                  }}>
                    🧾
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{expense.merchantName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {format(new Date(expense.date), 'MMM dd, yyyy')} · {expense.category}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {formatCurrency(expense.totalAmount, expense.currency)}
                  </div>
                  <span className={`badge ${getCategoryClass(expense.category)}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                    {expense.paymentMethod || 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
