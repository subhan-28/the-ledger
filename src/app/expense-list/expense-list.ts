import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../expense';

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
    return this.expenseService.getCategoryColor(name);
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

  /* ---- CSV export ---- */

  private csvText(value: string): string {
    let text = value;

    // Stop spreadsheets from treating user text as a formula
    if (/^[=+\-@\t\r]/.test(text)) {
      text = "'" + text;
    }

    // Quote cells that contain commas, quotes or line breaks
    if (/[",\r\n]/.test(text)) {
      text = '"' + text.replace(/"/g, '""') + '"';
    }

    return text;
  }

  private todayStamp(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  exportCsv() {
    const rows = this.filteredExpenses();
    if (rows.length === 0) return;

    const lines: string[] = ['Date,Category,Note,Amount'];
    for (const e of rows) {
      lines.push(
        [
          this.csvText(e.date),
          this.csvText(e.category),
          this.csvText(e.note),
          String(e.amount),
        ].join(',')
      );
    }

    // The BOM at the start makes Excel read the file as UTF-8
    const csv = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const stamp = this.selectedMonth() !== 'all' ? this.selectedMonth() : this.todayStamp();
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledger-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}