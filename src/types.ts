export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CategoryType = 'income' | 'expense';

export interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
}
