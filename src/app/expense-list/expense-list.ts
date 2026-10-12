import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../expense';
import { CATEGORIES } from '../expense.model';

@Component({
  selector: 'app-expense-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.css'
})
export class ExpenseList {
  deleteConfirmId = signal<string | null>(null);

  constructor(public expenseService: ExpenseService) {}

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