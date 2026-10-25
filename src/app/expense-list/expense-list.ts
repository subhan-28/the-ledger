import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../expense';
import { CATEGORIES } from '../expense.model';

@Component({
  selector: 'app-expense-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.css'
})
export class ExpenseList {
  expenseService = inject(ExpenseService);

  deleteConfirmId = signal<string | null>(null);
  searchTerm = signal('');
  selectedMonth = signal('all');

  availableMonths = computed(() => {
    const months = new Set<string>();
    for (const e of this.expenseService.expenses()) {
      months.add(e.date.slice(0, 7));
    }
    if (this.selectedMonth() !== 'all') {
      months.add(this.selectedMonth());
    }
    return Array.from(months).sort().reverse();
  });

  filteredExpenses = computed(() => {
    const month = this.selectedMonth();
    const term = this.searchTerm().trim().toLowerCase();
    return this.expenseService.expenses().filter(e => {
      const monthOk = month === 'all' || e.date.startsWith(month);
      const termOk =
        !term ||
        e.category.toLowerCase().includes(term) ||
        e.note.toLowerCase().includes(term);
      return monthOk && termOk;
    });
  });

  filteredTotal = computed(() =>
    this.filteredExpenses().reduce((sum, e) => sum + e.amount, 0)
  );

  filtersActive = computed(
    () => this.selectedMonth() !== 'all' || this.searchTerm().trim() !== ''
  );

  getCategoryColor(name: string): string {
    return CATEGORIES.find(c => c.name === name)?.color || '#5B5B5B';
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  monthLabel(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  clearFilters() {
    this.searchTerm.set('');
    this.selectedMonth.set('all');
  }

  askDelete(id: string) {
    this.deleteConfirmId.set(id);
  }

  cancelDelete() {
    this.deleteConfirmId.set(null);
  }

  confirmDelete(id: string) {
    this.expenseService.deleteExpense(id);
    this.deleteConfirmId.set(null);
  }
}