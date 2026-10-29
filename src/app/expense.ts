import { Injectable, signal, computed } from '@angular/core';
import {
  Expense,
  CategoryInfo,
  CATEGORIES,
  CUSTOM_COLORS,
  MAX_CATEGORY_LENGTH,
} from './expense.model';

const STORAGE_KEY = 'ledgerExpenses';
const BUDGET_KEY = 'ledgerMonthlyBudget';
const CUSTOM_KEY = 'ledgerCustomCategories';
const FALLBACK_COLOR = '#7C8088';
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private expensesSignal = signal<Expense[]>([]);
  private budgetSignal = signal<number>(0);
  private customSignal = signal<CategoryInfo[]>([]);

  budget = this.budgetSignal.asReadonly();
  customCategories = this.customSignal.asReadonly();

  // Built-in categories, then your own, with "Other" always last
  categories = computed<CategoryInfo[]>(() => {
    const other = CATEGORIES.filter(c => c.name === 'Other');
    const base = CATEGORIES.filter(c => c.name !== 'Other');
    return [...base, ...this.customSignal(), ...other];
  });

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

    try {
      const storedCustom = localStorage.getItem(CUSTOM_KEY);
      const parsed = storedCustom ? JSON.parse(storedCustom) : [];
      const valid: CategoryInfo[] = Array.isArray(parsed)
        ? parsed.filter(
            (c: any) =>
              c &&
              typeof c.name === 'string' &&
              c.name.length > 0 &&
              typeof c.color === 'string' &&
              HEX_COLOR.test(c.color)
          )
        : [];
      this.customSignal.set(valid);
    } catch {
      this.customSignal.set([]);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.expensesSignal()));
    } catch {
      // localStorage not available, fail silently
    }
  }

  private saveCustom() {
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(this.customSignal()));
    } catch {
      // localStorage not available, fail silently
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
      // localStorage not available, fail silently
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

  /* ---- Categories ---- */

  getCategoryColor(name: string): string {
    return this.categories().find(c => c.name === name)?.color || FALLBACK_COLOR;
  }

  // Case-insensitive lookup, so "food" finds "Food"
  findCategory(name: string): CategoryInfo | undefined {
    const wanted = name.trim().toLowerCase();
    return this.categories().find(c => c.name.toLowerCase() === wanted);
  }

  // Returns the category name to use, or null if the name is not valid
  addCustomCategory(rawName: string): string | null {
    const name = rawName.trim().replace(/\s+/g, ' ');
    if (!name || name.length > MAX_CATEGORY_LENGTH) return null;

    const existing = this.findCategory(name);
    if (existing) return existing.name;

    const usedColors = new Set(this.customSignal().map(c => c.color));
    const color =
      CUSTOM_COLORS.find(c => !usedColors.has(c)) ??
      CUSTOM_COLORS[this.customSignal().length % CUSTOM_COLORS.length];

    this.customSignal.update(list => [...list, { name, color }]);
    this.saveCustom();
    return name;
  }

  categoryUsageCount(name: string): number {
    return this.expensesSignal().filter(e => e.category === name).length;
  }

  // Only your own categories can be removed, and only when no entry uses them
  removeCustomCategory(name: string): boolean {
    const isCustom = this.customSignal().some(c => c.name === name);
    if (!isCustom || this.categoryUsageCount(name) > 0) return false;

    this.customSignal.update(list => list.filter(c => c.name !== name));
    this.saveCustom();
    return true;
  }
}