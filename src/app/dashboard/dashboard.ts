import { Component, effect, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../expense';
import { CATEGORIES } from '../expense.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  totalDisplay = signal('0.00');
  monthDisplay = signal('0.00');

  constructor(public expenseService: ExpenseService) {
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

  getCategoryColor(name: string): string {
    return CATEGORIES.find(c => c.name === name)?.color || '#5B5B5B';
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}