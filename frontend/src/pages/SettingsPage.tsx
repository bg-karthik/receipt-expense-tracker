import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Wallet, User, Save, AlertTriangle } from 'lucide-react';
import { budgetService } from '../services/expense.service';
import type { BudgetInfo } from '../types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const formatCurrency = (amount: number, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `₹${amount.toFixed(0)}`;
  }
};

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [isLoadingBudget, setIsLoadingBudget] = useState(true);

  const loadBudget = useCallback(async () => {
    try {
      const data = await budgetService.get();
      setBudgetInfo(data);
      if (data.monthlyBudget > 0) setBudgetAmount(data.monthlyBudget.toString());
    } catch {
      toast.error('Failed to load budget information');
    } finally {
      setIsLoadingBudget(false);
    }
  }, []);

  useEffect(() => { loadBudget(); }, [loadBudget]);

  const handleSaveBudget = async () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount < 0) return toast.error('Please enter a valid budget amount');
    setIsSavingBudget(true);
    try {
      const data = await budgetService.update(amount);
      setBudgetInfo(prev => prev ? { ...prev, monthlyBudget: amount, budget: data.budget } : prev);
      toast.success('Budget updated successfully!');
      loadBudget();
    } catch {
      toast.error('Failed to update budget');
    } finally {
      setIsSavingBudget(false);
    }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="fade-in" style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={24} color="#a78bfa" /> Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage your account and preferences</p>
      </div>

      {/* Profile Info */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <User size={18} color="#a78bfa" />
          <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Profile</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.email}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Budget */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Wallet size={18} color="#a78bfa" />
          <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Monthly Budget</h2>
        </div>

        {isLoadingBudget ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {budgetInfo && budgetInfo.monthlyBudget > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    {months[(budgetInfo.month || 1) - 1]} {budgetInfo.year} Budget
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    {formatCurrency(budgetInfo.spent)} / {formatCurrency(budgetInfo.monthlyBudget)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${Math.min(budgetInfo.usedPercentage, 100)}%`,
                    background: budgetInfo.isOverBudget
                      ? 'linear-gradient(135deg, #ef4444, #f97316)'
                      : 'var(--accent-gradient)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.8rem' }}>
                  <span style={{ color: budgetInfo.isOverBudget ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    {budgetInfo.usedPercentage.toFixed(1)}% used
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {budgetInfo.remaining >= 0
                      ? `${formatCurrency(budgetInfo.remaining)} remaining`
                      : `${formatCurrency(Math.abs(budgetInfo.remaining))} over budget`
                    }
                  </span>
                </div>

                {budgetInfo.isOverBudget && (
                  <div style={{
                    marginTop: '1rem',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                  }}>
                    <AlertTriangle size={16} />
                    You've exceeded your monthly budget!
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="label">Set Monthly Budget</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600 }}>₹</span>
                  <input
                    id="budget-input"
                    className="input-field"
                    style={{ paddingLeft: '2rem' }}
                    type="number"
                    min="0"
                    step="500"
                    value={budgetAmount}
                    onChange={e => setBudgetAmount(e.target.value)}
                    placeholder="Enter monthly budget"
                  />
                </div>
                <button
                  id="save-budget-btn"
                  className="btn-primary"
                  onClick={handleSaveBudget}
                  disabled={isSavingBudget}
                >
                  {isSavingBudget ? <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
                  Save
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Set to 0 to remove the budget limit
              </p>
            </div>
          </>
        )}
      </div>

      {/* App Info */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>About ReceiptAI</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Version</span><span style={{ color: 'var(--text-primary)' }}>1.0.0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>AI Engine</span><span style={{ color: 'var(--text-primary)' }}>Gemini 1.5 Flash</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Supported Currencies</span><span style={{ color: 'var(--text-primary)' }}>INR, USD, EUR, GBP, AED, SGD</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Max Receipt Size</span><span style={{ color: 'var(--text-primary)' }}>5 MB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
