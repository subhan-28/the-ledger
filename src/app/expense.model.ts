export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
}

export interface CategoryInfo {
  name: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { name: 'Food', color: '#8B1E1E' },
  { name: 'Transport', color: '#2D5F3E' },
  { name: 'Shopping', color: '#B8860B' },
  { name: 'Bills', color: '#1C2541' },
  { name: 'Entertainment', color: '#6B3FA0' },
  { name: 'Health', color: '#1E6B8B' },
  { name: 'Other', color: '#5B5B5B' },
];