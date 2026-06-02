import { CategoryInfo } from './types';

export const INCOME_CATEGORIES: CategoryInfo[] = [
  { id: 'salary', name: 'الراتب الأساسي', icon: 'Briefcase', color: '#10B981' }, // emerald-500
  { id: 'business', name: 'عمل حر / تجارة', icon: 'Sparkles', color: '#3B82F6' }, // blue-500
  { id: 'investment', name: 'استثمارات', icon: 'TrendingUp', color: '#8B5CF6' }, // violet-500
  { id: 'gift', name: 'هدايا / أخرى', icon: 'Gift', color: '#F59E0B' }, // amber-500
];

export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { id: 'food', name: 'طعام ووجبات', icon: 'Utensils', color: '#EF4444' }, // red-500
  { id: 'rent', name: 'سكن وفواتير', icon: 'Home', color: '#EC4899' }, // pink-500
  { id: 'shopping', name: 'تسوق وملابس', icon: 'ShoppingBag', color: '#F59E0B' }, // amber-500
  { id: 'transport', name: 'مواصلات وسيارة', icon: 'Car', color: '#06B6D4' }, // cyan-500
  { id: 'entertainment', name: 'ترفيه وسياحة', icon: 'Film', color: '#8B5CF6' }, // violet-500
  { id: 'health', name: 'صحة وعلاج', icon: 'HeartPulse', color: '#10B981' }, // emerald-500
  { id: 'other', name: 'مصاريف أخرى', icon: 'CreditCard', color: '#6B7280' }, // gray-500
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryById(id: string): CategoryInfo {
  return ALL_CATEGORIES.find(c => c.id === id) || { id: 'other', name: 'أخرى', icon: 'Tag', color: '#6B7280' };
}
