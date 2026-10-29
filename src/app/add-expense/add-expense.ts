import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ExpenseService } from '../expense';
import { MAX_CATEGORY_LENGTH } from '../expense.model';

@Component({
  selector: 'app-add-expense',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-expense.html',
  styleUrl: './add-expense.css'
})
export class AddExpense implements OnInit {
  readonly ADD_NEW = '__new__';
  readonly maxLength = MAX_CATEGORY_LENGTH;

  amount: number | null = null;
  category: string = '';
  newCategory: string = '';
  date: string = this.todayDate();
  note: string = '';

  isEditMode = signal(false);
  editId: string | null = null;
  errorMsg = signal('');
  removeMsg = signal('');

  constructor(
    public expenseService: ExpenseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const existing = this.expenseService.getExpenseById(id);
      if (existing) {
        this.isEditMode.set(true);
        this.editId = id;
        this.amount = existing.amount;
        this.category = existing.category;
        this.date = existing.date;
        this.note = existing.note;
      }
    }
  }

  todayDate(): string {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().split('T')[0];
  }

  isCustomSelected(): boolean {
    return this.expenseService.customCategories().some(c => c.name === this.category);
  }

  onCategoryChange() {
    this.errorMsg.set('');
    this.removeMsg.set('');
    if (this.category === this.ADD_NEW) {
      this.newCategory = '';
      setTimeout(() => document.getElementById('newCategory')?.focus(), 0);
    }
  }

  removeSelectedCategory() {
    const name = this.category;
    const count = this.expenseService.categoryUsageCount(name);

    if (count > 0) {
      this.removeMsg.set(
        `${count} ${count === 1 ? 'entry uses' : 'entries use'} "${name}", so it cannot be removed.`
      );
      return;
    }

    if (this.expenseService.removeCustomCategory(name)) {
      this.category = '';
      this.removeMsg.set('');
    }
  }

  onSubmit() {
    this.errorMsg.set('');

    if (!this.amount || this.amount <= 0) {
      this.errorMsg.set('Please enter a valid amount.');
      return;
    }
    if (!this.category) {
      this.errorMsg.set('Please select a category.');
      return;
    }

    const typed = this.newCategory.trim().replace(/\s+/g, ' ');
    const addingNew = this.category === this.ADD_NEW;

    if (addingNew) {
      if (!typed) {
        this.errorMsg.set('Please type a name for the new category.');
        return;
      }
      if (typed.length > this.maxLength) {
        this.errorMsg.set(`Category name can be at most ${this.maxLength} characters.`);
        return;
      }
    }

    if (!this.date) {
      this.errorMsg.set('Please select a date.');
      return;
    }

    let finalCategory = this.category;
    if (addingNew) {
      const saved = this.expenseService.addCustomCategory(typed);
      if (!saved) {
        this.errorMsg.set('Could not add this category. Please try a different name.');
        return;
      }
      finalCategory = saved;
    }

    const entry = {
      amount: this.amount,
      category: finalCategory,
      date: this.date,
      note: this.note.trim(),
    };

    if (this.isEditMode() && this.editId) {
      this.expenseService.updateExpense(this.editId, entry);
    } else {
      this.expenseService.addExpense(entry);
    }

    this.router.navigate(['/ledger']);
  }
}