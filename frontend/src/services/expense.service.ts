import api from './api';
import type { Expense, ExtractedData } from '../types';

export interface ExpenseFilters {
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const expenseService = {
  getAll: async (filters: ExpenseFilters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    );
    const res = await api.get('/expenses', { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<Expense> => {
    const res = await api.get(`/expenses/${id}`);
    return res.data.data.expense;
  },

  create: async (data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Expense> => {
    const res = await api.post('/expenses', data);
    return res.data.data.expense;
  },

  update: async (id: string, data: Partial<Expense>): Promise<Expense> => {
    const res = await api.put(`/expenses/${id}`, data);
    return res.data.data.expense;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },

  analyzeReceipt: async (file: File): Promise<ExtractedData> => {
    const formData = new FormData();
    formData.append('receipt', file);
    const res = await api.post('/receipts/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};

export const dashboardService = {
  getSummary: async () => {
    const res = await api.get('/dashboard/summary');
    return res.data.data;
  },

  getCategories: async () => {
    const res = await api.get('/dashboard/categories');
    return res.data.data;
  },

  getMonthly: async () => {
    const res = await api.get('/dashboard/monthly');
    return res.data.data;
  },

  getRecent: async () => {
    const res = await api.get('/dashboard/recent');
    return res.data.data.expenses;
  },
};

export const budgetService = {
  get: async () => {
    const res = await api.get('/budget');
    return res.data.data;
  },

  update: async (amount: number) => {
    const res = await api.put('/budget', { amount });
    return res.data.data;
  },
};
