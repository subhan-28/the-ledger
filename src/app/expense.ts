import { Injectable, signal, computed } from '@angular/core';
import { Expense } from './expense.model';

const STORAGE_KEY = 'ledgerExpenses';
const BUDGET_KEY = 'ledgerMonthlyBudget';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private expensesSignal = signal<Expense[]>([]);
  private budgetSignal = signal<number>(0);

  budget = this.budgetSignal.asReadonly();

  expenses = computed(() =>
    [...this.expensesSignal()].sort((a, b) => b.date.localeCompare(a.date))
  );

  total = computed(() =>
    this.expensesSignal().reduce((sum, e) => sum + e.amount, 0)
  );

  thisMonthTotal = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return this.expensesSignal()
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  });

  categoryBreakdown = computed(() => {
    const map = new Map<string, number>();
    for (const e of this.expensesSignal()) {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.expensesSignal.set(stored ? JSON.parse(stored) : []);
    } catch {
      this.expensesSignal.set([]);
    }

    try {
      const storedBudget = localStorage.getItem(BUDGET_KEY);
      const parsed = storedBudget ? Number(storedBudget) : 0;
      this.budgetSignal.set(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
    } catch {
      this.budgetSignal.set(0);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.expensesSignal()));
    } catch {
      // localStorage not available — fail silently
    }
  }

  setBudget(amount: number) {
    const value = Number.isFinite(amount) && amount > 0 ? amount : 0;
    this.budgetSignal.set(value);
    try {
      if (value > 0) {
        localStorage.setItem(BUDGET_KEY, String(value));
      } else {
        localStorage.removeItem(BUDGET_KEY);
      }
    } catch {
      // localStorage not available — fail silently
    }
  }

  addExpense(expense: Omit<Expense, 'id'>) {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
    };
    this.expensesSignal.update(list => [...list, newExpense]);
    this.saveToStorage();
  }

  deleteExpense(id: string) {
    this.expensesSignal.update(list => list.filter(e => e.id !== id));
    this.saveToStorage();
  }

  updateExpense(id: string, updated: Omit<Expense, 'id'>) {
    this.expensesSignal.update(list =>
      list.map(e => (e.id === id ? { ...updated, id } : e))
    );
    this.saveToStorage();
  }

  getExpenseById(id: string): Expense | undefined {
    return this.expensesSignal().find(e => e.id === id);
  }
}