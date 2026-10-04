import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { createError } from '../middleware/error.middleware';

export const getBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const budget = await prisma.budget.findUnique({
      where: { userId: req.userId },
    });

    // Calculate current month spending
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { totalAmount: true },
    });

    const spent = expenses.reduce((sum: number, e: { totalAmount: number }) => sum + e.totalAmount, 0);
    const budgetAmount = budget?.amount || 0;
    const remaining = budgetAmount - spent;

    res.json({
      success: true,
      data: {
        budget: budget || null,
        monthlyBudget: budgetAmount,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        usedPercentage: budgetAmount > 0 ? Math.round((spent / budgetAmount) * 10000) / 100 : 0,
        isOverBudget: spent > budgetAmount && budgetAmount > 0,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body;

    if (amount === undefined || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      return next(createError('Valid budget amount required', 400));
    }

    const now = new Date();
    const budget = await prisma.budget.upsert({
      where: { userId: req.userId! },
      update: {
        amount: parseFloat(amount),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
      create: {
        userId: req.userId!,
        amount: parseFloat(amount),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    });

    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: { budget },
    });
  } catch (err) {
    next(err);
  }
};
