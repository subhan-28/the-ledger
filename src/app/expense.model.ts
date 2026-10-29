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
  { name: 'Food', color: '#B5413F' },
  { name: 'Transport', color: '#3F8A5C' },
  { name: 'Shopping', color: '#C9962B' },
  { name: 'Bills', color: '#4A6FA5' },
  { name: 'Entertainment', color: '#8A5FC0' },
  { name: 'Health', color: '#2C8FB0' },
  { name: 'Other', color: '#7C8088' },
];

// Colors given to categories you type yourself.
// All of them stay readable on both the light and the dark theme.
export const CUSTOM_COLORS: string[] = [
  '#D9733A',
  '#C2527F',
  '#7A9A3A',
  '#5E5BC2',
  '#2FA89A',
  '#A0714A',
  '#A64BB0',
  '#6A8FD0',
];

export const MAX_CATEGORY_LENGTH = 20;