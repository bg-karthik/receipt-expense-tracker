import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Edit, Save, X, Trash2, Receipt,
  Calendar, Tag, CreditCard, DollarSign,
  CheckCircle, AlertCircle, Plus
} from 'lucide-react';
import { expenseService } from '../services/expense.service';
import type { Expense, ExpenseItem } from '../types';
import { CATEGORIES, PAYMENT_METHODS, CURRENCIES } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const formatCurrency = (amount: number, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
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

const ExpenseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    merchantName: '',
    date: '',
    totalAmount: '',
    currency: 'INR',
    category: '',
    paymentMethod: '',
    tax: '',
    notes: '',
  });
  const [items, setItems] = useState<ExpenseItem[]>([]);

  useEffect(() => {
    if (!id) return;
    expenseService.getById(id)
      .then(data => {
        setExpense(data);
        setFormData({
          merchantName: data.merchantName,
          date: data.date.split('T')[0],
          totalAmount: data.totalAmount.toString(),
          currency: data.currency,
          category: data.category,
          paymentMethod: data.paymentMethod || '',
          tax: data.tax?.toString() || '',
          notes: data.notes || '',
        });
        setItems(data.items || []);
      })
      .catch(() => { toast.error('Failed to load expense'); navigate('/expenses'); })
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    if (!expense) return;
    if (!formData.merchantName || !formData.date || !formData.totalAmount || !formData.category) {
      return toast.error('Please fill in all required fields');
    }
    setIsSaving(true);
    try {
      const updated = await expenseService.update(expense.id, {
        merchantName: formData.merchantName,
        date: formData.date,
        totalAmount: parseFloat(formData.totalAmount),
        currency: formData.currency,
        category: formData.category,
        paymentMethod: formData.paymentMethod || null,
        tax: formData.tax ? parseFloat(formData.tax) : null,
        notes: formData.notes || null,
        items,
      });
      setExpense(updated);
      setIsEditing(false);
      toast.success('Expense updated successfully');
    } catch {
      toast.error('Failed to update expense');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!expense) return;
    try {
      await expenseService.delete(expense.id);
      toast.success('Expense deleted');
      navigate('/expenses');
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const addItem = () => setItems([...items, { name: '', quantity: 1, price: 0 }]);
  const updateItem = (i: number, field: keyof ExpenseItem, value: string | number) =>
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  );
  if (!expense) return null;

  const confidenceColor = (c: number | null) => {
    if (!c) return 'var(--text-secondary)';
    if (c >= 0.8) return '#10b981';
    if (c >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="fade-in" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn-secondary" style={{ padding: '0.5rem 0.75rem' }} onClick={() => navigate('/expenses')}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!isEditing ? (
            <>
              <button className="btn-secondary" onClick={() => setIsEditing(true)} id="edit-expense-btn">
                <Edit size={16} /> Edit
              </button>
              <button className="btn-danger" onClick={() => setDeleteConfirm(true)} id="delete-expense-btn">
                <Trash2 size={16} /> Delete
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setIsEditing(false)}><X size={16} /> Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={isSaving} id="save-edit-btn">
                {isSaving ? <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
                Save
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Receipt Image */}
        {expense.receiptImage && (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={16} color="#a78bfa" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Receipt Image</span>
            </div>
            <img
              src={expense.receiptImage}
              alt="Receipt"
              style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block', background: '#000' }}
            />
            {expense.confidence !== null && (
              <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                <CheckCircle size={14} color={confidenceColor(expense.confidence)} />
                <span style={{ color: 'var(--text-secondary)' }}>AI confidence: </span>
                <strong style={{ color: confidenceColor(expense.confidence) }}>
                  {((expense.confidence || 0) * 100).toFixed(0)}%
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.25rem' }}>
              {isEditing ? 'Edit Expense' : expense.merchantName}
            </h2>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="label">Merchant Name *</label>
                  <input className="input-field" value={formData.merchantName} onChange={e => setFormData({ ...formData, merchantName: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="label">Date *</label>
                    <input className="input-field" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Category *</label>
                    <select className="input-field" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Total Amount *</label>
                    <input className="input-field" type="number" step="0.01" value={formData.totalAmount} onChange={e => setFormData({ ...formData, totalAmount: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Currency</label>
                    <select className="input-field" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Tax</label>
                    <input className="input-field" type="number" step="0.01" value={formData.tax} onChange={e => setFormData({ ...formData, tax: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Payment Method</label>
                    <select className="input-field" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                      <option value="">Select</option>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea className="input-field" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <InfoRow icon={<Calendar size={15} />} label="Date" value={format(new Date(expense.date), 'MMMM dd, yyyy')} />
                <InfoRow icon={<Tag size={15} />} label="Category">
                  <span className={`badge ${getCategoryClass(expense.category)}`}>{expense.category}</span>
                </InfoRow>
                <InfoRow icon={<DollarSign size={15} />} label="Total Amount" value={formatCurrency(expense.totalAmount, expense.currency)} bold />
                {expense.tax !== null && (
                  <InfoRow icon={<DollarSign size={15} />} label="Tax" value={formatCurrency(expense.tax, expense.currency)} />
                )}
                {expense.paymentMethod && (
                  <InfoRow icon={<CreditCard size={15} />} label="Payment Method" value={expense.paymentMethod} />
                )}
                {expense.notes && (
                  <InfoRow icon={<AlertCircle size={15} />} label="Notes" value={expense.notes} />
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Line Items</h3>
              {isEditing && (
                <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={addItem}>
                  <Plus size={14} /> Add Item
                </button>
              )}
            </div>

            {(isEditing ? items : expense.items).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No items recorded</p>
            ) : isEditing ? (
              <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', padding: '0.5rem 0.75rem', alignItems: 'center', borderBottom: i < items.length - 1 ? '1px solid rgba(45,58,90,0.5)' : 'none' }}>
                    <input className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Item name" />
                    <input className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: '60px' }} type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 1)} />
                    <input className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: '80px' }} type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(i, 'price', parseFloat(e.target.value) || 0)} />
                    <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', padding: '0.2rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Item</span><span>Qty</span><span>Price</span>
                </div>
                {expense.items.map((item, i) => (
                  <div key={item.id || i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', padding: '0.75rem 1rem', borderBottom: i < expense.items.length - 1 ? '1px solid rgba(45,58,90,0.5)' : 'none', fontSize: '0.9rem', alignItems: 'center' }}>
                    <span>{item.name}</span>
                    <span style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>×{item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(item.price, expense.currency)}</span>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', fontWeight: 700 }}>
                  <span>Total</span>
                  <span>{formatCurrency(expense.totalAmount, expense.currency)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: '400px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Trash2 size={28} color="#ef4444" />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Delete "{expense.merchantName}"?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>This action cannot be undone.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteConfirm(false)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDelete} id="confirm-delete-detail-btn">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
  bold?: boolean;
  children?: React.ReactNode;
}> = ({ icon, label, value, bold, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(45,58,90,0.3)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
      {icon} {label}
    </div>
    {children || <span style={{ fontWeight: bold ? 700 : 500, fontSize: '0.9rem' }}>{value}</span>}
  </div>
);

export default ExpenseDetailPage;
