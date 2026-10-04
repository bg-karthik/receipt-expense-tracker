export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface ExpenseItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Expense {
  id: string;
  userId: string;
  merchantName: string;
  date: string;
  totalAmount: number;
  currency: string;
  category: string;
  paymentMethod: string | null;
  tax: number | null;
  receiptImage: string | null;
  confidence: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: ExpenseItem[];
}

export interface ExtractedData {
  merchantName: string | null;
  date: string | null;
  totalAmount: number | null;
  currency: string | null;
  category: string | null;
  paymentMethod: string | null;
  tax: number | null;
  confidence: number | null;
  receiptImage: string | null;
  items: ExpenseItem[];
}

export interface Budget {
  id: string;
  userId: string;
  amount: number;
  month: number;
  year: number;
}

export interface BudgetInfo {
  budget: Budget | null;
  monthlyBudget: number;
  spent: number;
  remaining: number;
  usedPercentage: number;
  isOverBudget: boolean;
  month: number;
  year: number;
}

export interface DashboardSummary {
  totalSpending: number;
  totalExpenses: number;
  averageExpense: number;
  highestExpense: number;
  monthlySpending: number;
  monthlyBudget: number;
  remainingBudget: number;
  budgetUsedPercentage: number;
}

export interface CategoryData {
  category: string;
  amount: number;
}

export interface MonthlyData {
  month: string;
  monthName: string;
  amount: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const CATEGORIES = [
  'Groceries', 'Food & Dining', 'Transportation', 'Shopping',
  'Entertainment', 'Healthcare', 'Utilities', 'Travel', 'Education', 'Other'
] as const;

export const PAYMENT_METHODS = [
  'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'
] as const;

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'] as const;
