import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ExpenseService } from '../expense';
import { CATEGORIES } from '../expense.model';

@Component({
  selector: 'app-add-expense',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-expense.html',
  styleUrl: './add-expense.css'
})
export class AddExpense implements OnInit {
  categories = CATEGORIES;

  amount: number | null = null;
  category: string = '';
  date: string = this.todayDate();
  note: string = '';

  isEditMode = signal(false);
  editId: string | null = null;
  errorMsg = signal('');

  constructor(
    private expenseService: ExpenseService,
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
    if (!this.date) {
      this.errorMsg.set('Please select a date.');
      return;
    }

    const entry = {
      amount: this.amount,
      category: this.category,
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