import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, SortAsc, SortDesc, Trash2,
  Eye, Edit, ChevronLeft, ChevronRight, ScanLine, X
} from 'lucide-react';
import { expenseService } from '../services/expense.service';
import type { Expense, Pagination } from '../types';
import { CATEGORIES } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const formatCurrency = (amount: number, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
};

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

const ExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 15, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await expenseService.getAll({ search, category, startDate, endDate, sortBy, sortOrder, page, limit: 15 });
      setExpenses(data.expenses);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  }, [search, category, startDate, endDate, sortBy, sortOrder, page]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const handleDelete = async (id: string) => {
    try {
      await expenseService.delete(id);
      toast.success('Expense deleted');
      setDeleteConfirm(null);
      loadExpenses();
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(''); setSearchInput(''); setCategory('');
    setStartDate(''); setEndDate(''); setPage(1);
  };

  const hasFilters = search || category || startDate || endDate;

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />;
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Expenses</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {pagination.total} expense{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/scan')} id="new-expense-btn">
          <ScanLine size={18} /> Scan Receipt
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              id="expense-search"
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search merchants..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            />
          </div>

          {/* Category */}
          <select id="category-filter" className="input-field" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Date range */}
          <input className="input-field" type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} placeholder="Start date" />
          <input className="input-field" type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} placeholder="End date" />

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setSearch(searchInput); setPage(1); }}>
              <Filter size={15} /> Apply
            </button>
            {hasFilters && (
              <button className="btn-secondary" style={{ padding: '0.75rem' }} onClick={clearFilters} title="Clear filters">
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            {hasFilters ? (
              <>
                <Search size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No expenses match your filters</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Try adjusting your search or filters</p>
                <button className="btn-secondary" onClick={clearFilters}><X size={16} /> Clear Filters</button>
              </>
            ) : (
              <>
                <ScanLine size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No expenses yet</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Start by scanning your first receipt</p>
                <button className="btn-primary" onClick={() => navigate('/scan')}><ScanLine size={16} /> Scan your first receipt</button>
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('merchantName')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>Merchant <SortIcon field="merchantName" /></div>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('date')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>Date <SortIcon field="date" /></div>
                    </th>
                    <th>Category</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('totalAmount')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>Amount <SortIcon field="totalAmount" /></div>
                    </th>
                    <th>Payment</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{expense.merchantName}</div>
                        {expense.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{expense.notes}</div>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </td>
                      <td>
                        <span className={`badge ${getCategoryClass(expense.category)}`}>{expense.category}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {formatCurrency(expense.totalAmount, expense.currency)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {expense.paymentMethod || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.6rem' }}
                            onClick={() => navigate(`/expenses/${expense.id}`)}
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.6rem' }}
                            onClick={() => navigate(`/expenses/${expense.id}?edit=true`)}
                            title="Edit"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            className="btn-danger"
                            style={{ padding: '0.4rem 0.6rem' }}
                            onClick={() => setDeleteConfirm(expense.id)}
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn-secondary" style={{ padding: '0.5rem 0.75rem' }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Page {page} of {pagination.pages}
                </span>
                <button className="btn-secondary" style={{ padding: '0.5rem 0.75rem' }} onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" style={{ maxWidth: '400px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Trash2 size={28} color="#ef4444" />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Delete Expense?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>This action cannot be undone.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleDelete(deleteConfirm)} id="confirm-delete-btn">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
