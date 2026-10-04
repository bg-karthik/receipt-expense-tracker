import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { createError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const VALID_CATEGORIES = [
  'Groceries', 'Food & Dining', 'Transportation', 'Shopping',
  'Entertainment', 'Healthcare', 'Utilities', 'Travel', 'Education', 'Other'
];

export const getExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, category, startDate, endDate, sortBy = 'date', sortOrder = 'desc', page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = { userId: req.userId };

    if (search) {
      where.merchantName = { contains: search as string };
    }
    if (category) {
      where.category = category as string;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate as string);
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const validSortFields = ['date', 'totalAmount', 'merchantName', 'createdAt'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'date';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { items: true },
        orderBy: { [sortField]: order },
        skip,
        take: limitNum,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getExpenseById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expenseId = String(req.params.id);
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, userId: req.userId },
      include: { items: true },
    });

    if (!expense) {
      return next(createError('Expense not found', 404));
    }

    res.json({ success: true, data: { expense } });
  } catch (err) {
    next(err);
  }
};

export const createExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { merchantName, date, totalAmount, currency, category, paymentMethod, tax, receiptImage, confidence, notes, items } = req.body;

    if (!merchantName || !date || totalAmount === undefined || !category) {
      return next(createError('Merchant name, date, total amount, and category are required', 400));
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return next(createError('Invalid category', 400));
    }

    const expense = await prisma.expense.create({
      data: {
        userId: req.userId!,
        merchantName: merchantName.trim(),
        date: new Date(date),
        totalAmount: parseFloat(totalAmount),
        currency: currency || 'INR',
        category,
        paymentMethod: paymentMethod || null,
        tax: tax !== undefined && tax !== null && tax !== '' ? parseFloat(tax) : null,
        receiptImage: receiptImage || null,
        confidence: confidence !== undefined && confidence !== null && confidence !== '' ? parseFloat(confidence) : null,
        notes: notes || null,
        items: {
          create: Array.isArray(items)
            ? items.map((item: { name: string; quantity: number; price: number }) => ({
                name: item.name,
                quantity: parseFloat(item.quantity?.toString() || '1'),
                price: parseFloat(item.price?.toString() || '0'),
              }))
            : [],
        },
      },
      include: { items: true },
    });

    res.status(201).json({
      success: true,
      message: 'Expense saved successfully',
      data: { expense },
    });
  } catch (err) {
    next(err);
  }
};

export const updateExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expenseId = String(req.params.id);
    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, userId: req.userId },
    });

    if (!existing) {
      return next(createError('Expense not found', 404));
    }

    const { merchantName, date, totalAmount, currency, category, paymentMethod, tax, notes, items } = req.body;

    if (category && !VALID_CATEGORIES.includes(category)) {
      return next(createError('Invalid category', 400));
    }

    // Only update items if items array is explicitly provided
    if (Array.isArray(items)) {
      await prisma.expenseItem.deleteMany({ where: { expenseId } });
    }

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(merchantName && { merchantName: merchantName.trim() }),
        ...(date && { date: new Date(date) }),
        ...(totalAmount !== undefined && { totalAmount: parseFloat(totalAmount) }),
        ...(currency && { currency }),
        ...(category && { category }),
        paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.paymentMethod,
        tax: tax !== undefined && tax !== null && tax !== '' ? parseFloat(tax) : existing.tax,
        notes: notes !== undefined ? notes : existing.notes,
        ...(Array.isArray(items) && {
          items: {
            create: items.map((item: { name: string; quantity: number; price: number }) => ({
              name: item.name,
              quantity: parseFloat(item.quantity?.toString() || '1'),
              price: parseFloat(item.price?.toString() || '0'),
            })),
          },
        }),
      },
      include: { items: true },
    });

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expenseId = String(req.params.id);
    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, userId: req.userId },
    });

    if (!existing) {
      return next(createError('Expense not found', 404));
    }

    await prisma.expenseItem.deleteMany({ where: { expenseId } });
    await prisma.expense.delete({ where: { id: expenseId } });

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    next(err);
  }
};
