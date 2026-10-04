import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, X, CheckCircle, AlertCircle, Camera,
  FileImage, RefreshCw, Plus, Trash2, Save
} from 'lucide-react';
import { expenseService } from '../services/expense.service';
import type { ExtractedData, ExpenseItem } from '../types';
import { CATEGORIES, PAYMENT_METHODS, CURRENCIES } from '../types';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable form state
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

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, JPEG, and PNG images are supported';
    if (file.size > MAX_FILE_SIZE) return 'File too large. Maximum size is 5MB';
    return null;
  };

  const handleFile = (file: File) => {
    const err = validateFile(file);
    if (err) { toast.error(err); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setExtractedData(null);
    setError(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await expenseService.analyzeReceipt(selectedFile);
      setExtractedData(data);
      setFormData({
        merchantName: data.merchantName || '',
        date: data.date || new Date().toISOString().split('T')[0],
        totalAmount: data.totalAmount?.toString() || '',
        currency: data.currency || 'INR',
        category: data.category || '',
        paymentMethod: data.paymentMethod || '',
        tax: data.tax?.toString() || '',
        notes: '',
      });
      setItems(data.items || []);
      toast.success('Receipt analyzed successfully!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Unable to analyze this receipt. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!formData.merchantName || !formData.date || !formData.totalAmount || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSaving(true);
    try {
      await expenseService.create({
        merchantName: formData.merchantName,
        date: formData.date,
        totalAmount: parseFloat(formData.totalAmount),
        currency: formData.currency,
        category: formData.category,
        paymentMethod: formData.paymentMethod || null,
        tax: formData.tax ? parseFloat(formData.tax) : null,
        receiptImage: extractedData?.receiptImage || null,
        confidence: extractedData?.confidence || null,
        notes: formData.notes || null,
        items,
      });
      toast.success('Expense saved successfully!');
      navigate('/expenses');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to save expense');
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = () => setItems([...items, { name: '', quantity: 1, price: 0 }]);
  const updateItem = (i: number, field: keyof ExpenseItem, value: string | number) => {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const resetAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setError(null);
    setFormData({ merchantName: '', date: '', totalAmount: '', currency: 'INR', category: '', paymentMethod: '', tax: '', notes: '' });
    setItems([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confidenceColor = (c: number | null) => {
    if (c === null) return 'var(--text-secondary)';
    if (c >= 0.8) return '#10b981';
    if (c >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Scan Receipt</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Upload a receipt image for AI-powered expense extraction</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: extractedData ? '1fr 1.5fr' : '1fr', gap: '1.5rem', maxWidth: extractedData ? '1200px' : '600px', margin: '0 auto' }}>
        {/* Upload Section */}
        <div>
          {!selectedFile ? (
            <div
              className={`upload-zone ${isDragging ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div style={{ pointerEvents: 'none' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <FileImage size={36} color="#7c3aed" />
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Drop your receipt here</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>or click to browse files</p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>JPG, JPEG, PNG · Max 5MB</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileInput}
                style={{ display: 'none' }}
                id="receipt-file-input"
              />
            </div>
          ) : (
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={previewUrl!}
                  alt="Receipt preview"
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block', background: '#000' }}
                />
                <button
                  onClick={resetAll}
                  style={{
                    position: 'absolute', top: '0.75rem', right: '0.75rem',
                    background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'white',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '1rem' }}>
                    {selectedFile.name}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.85rem' }}>
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                {isAnalyzing ? (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Analyzing your receipt...
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                      Powered by Gemini Vision AI
                    </p>
                  </div>
                ) : extractedData ? (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()}>
                      <Camera size={16} /> Change
                    </button>
                    <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAnalyze}>
                      <RefreshCw size={16} /> Re-analyze
                    </button>
                  </div>
                ) : (
                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleAnalyze} id="analyze-btn">
                    <Upload size={18} /> Analyze Receipt
                  </button>
                )}

                {extractedData?.confidence !== null && extractedData?.confidence !== undefined && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                    <CheckCircle size={14} color={confidenceColor(extractedData.confidence)} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      AI confidence: <strong style={{ color: confidenceColor(extractedData.confidence) }}>
                        {(extractedData.confidence * 100).toFixed(0)}%
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        {extractedData && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>Review & Edit Expense</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Merchant Name *</label>
                <input className="input-field" value={formData.merchantName} onChange={e => setFormData({ ...formData, merchantName: e.target.value })} placeholder="Store or merchant name" />
              </div>

              <div>
                <label className="label">Date *</label>
                <input className="input-field" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>

              <div>
                <label className="label">Category *</label>
                <select className="input-field" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Total Amount *</label>
                <input className="input-field" type="number" step="0.01" value={formData.totalAmount} onChange={e => setFormData({ ...formData, totalAmount: e.target.value })} placeholder="0.00" />
              </div>

              <div>
                <label className="label">Currency</label>
                <select className="input-field" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Tax Amount</label>
                <input className="input-field" type="number" step="0.01" value={formData.tax} onChange={e => setFormData({ ...formData, tax: e.target.value })} placeholder="0.00" />
              </div>

              <div>
                <label className="label">Payment Method</label>
                <select className="input-field" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                  <option value="">Select method</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Notes (optional)</label>
                <textarea className="input-field" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." rows={2} style={{ resize: 'vertical', minHeight: '60px' }} />
              </div>
            </div>

            {/* Items */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="label" style={{ margin: 0 }}>Line Items</label>
                <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={addItem}>
                  <Plus size={14} /> Add Item
                </button>
              </div>

              {items.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Item Name</span><span>Qty</span><span>Price</span><span></span>
                  </div>
                  {items.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', padding: '0.5rem 0.75rem', alignItems: 'center', borderBottom: i < items.length - 1 ? '1px solid rgba(45,58,90,0.5)' : 'none' }}>
                      <input
                        className="input-field"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        value={item.name}
                        onChange={e => updateItem(i, 'name', e.target.value)}
                        placeholder="Item name"
                      />
                      <input
                        className="input-field"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: '60px' }}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 1)}
                      />
                      <input
                        className="input-field"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: '80px' }}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={e => updateItem(i, 'price', parseFloat(e.target.value) || 0)}
                      />
                      <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', padding: '0.2rem' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--border)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  No items extracted. Click "Add Item" to add manually.
                </div>
              )}
            </div>

            <button
              id="save-expense-btn"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <><Save size={18} /> Save Expense</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanPage;
