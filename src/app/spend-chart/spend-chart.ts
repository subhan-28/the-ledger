import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService } from '../expense';

type TrendView = 'daily' | 'weekly';

interface TrendBar {
  label: string;
  fullLabel: string;
  amount: number;
  heightPct: number;
  isCurrent: boolean;
}

@Component({
  selector: 'app-spend-chart',
  imports: [CommonModule],
  templateUrl: './spend-chart.html',
  styleUrl: './spend-chart.css'
})
export class SpendChart {
  private expenseService = inject(ExpenseService);

  view = signal<TrendView>('daily');

  caption = computed(() =>
    this.view() === 'daily' ? 'Last 7 days' : 'Last 6 weeks (Mon to Sun)'
  );

  bars = computed<TrendBar[]>(() => {
    const expenses = this.expenseService.expenses();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const periods: { start: Date; end: Date; label: string; fullLabel: string }[] = [];

    if (this.view() === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        periods.push({
          start: day,
          end: day,
          label: day.toLocaleDateString(undefined, { weekday: 'short' }),
          fullLabel: day.toLocaleDateString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }),
        });
      }
    } else {
      const mondayOffset = (today.getDay() + 6) % 7;
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - mondayOffset);
      const short: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

      for (let i = 5; i >= 0; i--) {
        const start = new Date(thisWeekStart);
        start.setDate(thisWeekStart.getDate() - i * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        periods.push({
          start,
          end,
          label: start.toLocaleDateString(undefined, short),
          fullLabel: `${start.toLocaleDateString(undefined, short)} to ${end.toLocaleDateString(undefined, short)}`,
        });
      }
    }

    const sums = periods.map(p => {
      const from = this.key(p.start);
      const to = this.key(p.end);
      return expenses
        .filter(e => e.date >= from && e.date <= to)
        .reduce((sum, e) => sum + e.amount, 0);
    });

    const max = Math.max(...sums, 0);

    return periods.map((p, i) => ({
      label: p.label,
      fullLabel: p.fullLabel,
      amount: sums[i],
      heightPct: max > 0 ? (sums[i] / max) * 100 : 0,
      isCurrent: i === periods.length - 1,
    }));
  });

  total = computed(() => this.bars().reduce((sum, b) => sum + b.amount, 0));

  average = computed(() => {
    const count = this.bars().length;
    return count ? this.total() / count : 0;
  });

  private key(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  compact(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(Math.round(n));
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}