import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboardSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [allExpenses, monthlyExpenses, budget] = await Promise.all([
      prisma.expense.findMany({
        where: { userId: req.userId },
        select: { totalAmount: true },
      }),
      prisma.expense.findMany({
        where: {
          userId: req.userId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { totalAmount: true },
      }),
      prisma.budget.findUnique({
        where: { userId: req.userId },
      }),
    ]);

    const totalSpending = allExpenses.reduce((sum: number, e: { totalAmount: number }) => sum + e.totalAmount, 0);
    const monthlySpending = monthlyExpenses.reduce((sum: number, e: { totalAmount: number }) => sum + e.totalAmount, 0);
    const count = allExpenses.length;
    const avgExpense = count > 0 ? totalSpending / count : 0;
    const maxExpense = count > 0 ? Math.max(...allExpenses.map((e: { totalAmount: number }) => e.totalAmount)) : 0;

    const monthlyBudget = budget?.amount || 0;
    const remainingBudget = monthlyBudget - monthlySpending;

    res.json({
      success: true,
      data: {
        totalSpending,
        totalExpenses: count,
        averageExpense: avgExpense,
        highestExpense: maxExpense,
        monthlySpending,
        monthlyBudget,
        remainingBudget,
        budgetUsedPercentage: monthlyBudget > 0 ? (monthlySpending / monthlyBudget) * 100 : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getCategoryBreakdown = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId },
      select: { category: true, totalAmount: true },
    });

    const breakdown: Record<string, number> = {};
    expenses.forEach(({ category, totalAmount }: { category: string; totalAmount: number }) => {
      breakdown[category] = (breakdown[category] || 0) + totalAmount;
    });

    const data = Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    })).sort((a, b) => b.amount - a.amount);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getMonthlyTrend = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.userId,
        date: { gte: sixMonthsAgo },
      },
      select: { date: true, totalAmount: true },
      orderBy: { date: 'asc' },
    });

    const monthly: Record<string, number> = {};
    expenses.forEach(({ date, totalAmount }: { date: Date; totalAmount: number }) => {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + totalAmount;
    });

    // Fill in missing months with 0
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      data.push({ month: key, monthName, amount: Math.round((monthly[key] || 0) * 100) / 100 });
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getRecentExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({ success: true, data: { expenses } });
  } catch (err) {
    next(err);
  }
};
