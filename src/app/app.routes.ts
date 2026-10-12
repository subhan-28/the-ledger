import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { AddExpense } from './add-expense/add-expense';
import { ExpenseList } from './expense-list/expense-list';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'add', component: AddExpense },
  { path: 'edit/:id', component: AddExpense },
  { path: 'ledger', component: ExpenseList },
  { path: '**', redirectTo: '' }
];