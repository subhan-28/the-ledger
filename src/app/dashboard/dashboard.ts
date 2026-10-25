import { Component, computed, effect, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../expense';
import { CATEGORIES } from '../expense.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  expenseService = inject(ExpenseService);

  totalDisplay = signal('0.00');
  monthDisplay = signal('0.00');

  editingBudget = signal(false);
  budgetInput: number | null = null;
  budgetError = signal('');

  budgetPercent = computed(() => {
    const budget = this.expenseService.budget();
    if (budget <= 0) return 0;
    return (this.expenseService.thisMonthTotal() / budget) * 100;
  });

  budgetBarWidth = computed(() => Math.min(this.budgetPercent(), 100));

  budgetRemaining = computed(
    () => this.expenseService.budget() - this.expenseService.thisMonthTotal()
  );

  budgetStatus = computed<'ok' | 'warn' | 'over'>(() => {
    const p = this.budgetPercent();
    if (p >= 100) return 'over';
    if (p >= 75) return 'warn';
    return 'ok';
  });

  constructor() {
    effect(() => {
      this.animateValue(this.expenseService.total(), this.totalDisplay);
    });
    effect(() => {
      this.animateValue(this.expenseService.thisMonthTotal(), this.monthDisplay);
    });
  }

  private animateValue(target: number, targetSignal: WritableSignal<string>) {
    const duration = 700;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      targetSignal.set(this.formatCurrency(current));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        targetSignal.set(this.formatCurrency(target));
      }
    };

    requestAnimationFrame(step);
  }

  startEditBudget() {
    const current = this.expenseService.budget();
    this.budgetInput = current > 0 ? current : null;
    this.budgetError.set('');
    this.editingBudget.set(true);
  }

  cancelBudget() {
    this.editingBudget.set(false);
    this.budgetError.set('');
  }

  saveBudget() {
    const value = this.budgetInput ?? 0;
    if (value < 0) {
      this.budgetError.set('Please enter a positive amount.');
      return;
    }
    this.expenseService.setBudget(value);
    this.editingBudget.set(false);
    this.budgetError.set('');
  }

  getCategoryColor(name: string): string {
    return CATEGORIES.find(c => c.name === name)?.color || '#5B5B5B';
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}