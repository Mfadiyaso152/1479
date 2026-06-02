import React, { useState, useEffect } from 'react';
import { Plus, Edit3, X, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import { Transaction } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../categories';
import CategoryIcon from './CategoryIcon';
import { motion } from 'motion/react';

interface TransactionFormProps {
  onSave: (item: {
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    notes?: string;
  }) => void;
  editingTransaction: Transaction | null;
  onCancel: () => void;
}

export default function TransactionForm({ 
  onSave, 
  editingTransaction, 
  onCancel 
}: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Sync state if we are in editing mode
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setTitle(editingTransaction.title);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes || '');
      setErrors({});
    } else {
      setTitle('');
      setAmount('');
      setNotes('');
      const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      if (categories.length > 0 && !category) {
        setCategory(categories[0].id);
      }
    }
  }, [editingTransaction]);

  // Adjust categories automatically when type changes
  useEffect(() => {
    if (!editingTransaction) {
      const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      if (categories.length > 0) {
        setCategory(categories[0].id);
      }
    }
  }, [type, editingTransaction]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = 'حقل العنوان مطلوب';
    if (!amount || Number(amount) <= 0 || isNaN(Number(amount))) {
      newErrors.amount = 'أدخل مبلغ صالح وأكبر من الصفر';
    }
    if (!category) newErrors.category = 'يرجى اختيار تصنيف مناسب';
    if (!date) newErrors.date = 'حقل تاريخ المعاملة مطلوب';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      title: title.trim(),
      amount: Number(amount),
      type,
      category,
      date,
      notes: notes.trim(),
    });

    // Clear form only if we were NOT editing
    if (!editingTransaction) {
      setTitle('');
      setAmount('');
      setNotes('');
      const defaultCats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      setCategory(defaultCats[0]?.id || '');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      id="transaction-form-card" 
      className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xl max-w-md w-full relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-secondary pb-3">
        <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
          {editingTransaction ? (
            <>
              <Edit3 size={18} className="text-indigo-600" />
              تعديل تفاصيل المعاملة
            </>
          ) : (
            <>
              <Plus size={18} className="text-emerald-600" />
              إضافة حركة مالية جديدة
            </>
          )}
        </h3>
        <button
          id="close-modal-btn"
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
          title="إغلاق النافذة"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 text-right">
        {/* Type Toggle Tabs */}
        <div className="grid grid-cols-2 p-0.5 bg-slate-100 rounded-xl border border-slate-200/50">
          <button
            id="type-tab-expense"
            type="button"
            onClick={() => setType('expense')}
            disabled={!!editingTransaction} // lock type during edit
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            } disabled:opacity-75`}
          >
            مصروف (-)
          </button>
          <button
            id="type-tab-income"
            type="button"
            onClick={() => setType('income')}
            disabled={!!editingTransaction}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            } disabled:opacity-75`}
          >
            دخل (+)
          </button>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">العنوان أو الوصف</label>
          <input
            id="input-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors({ ...errors, title: '' });
            }}
            placeholder="مثال: فاتورة الكهرباء، راتب مستقل..."
            className={`w-full bg-slate-50 border rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition text-right ${
              errors.title ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">القيمة المالية ($)</label>
          <input
            id="input-amount"
            type="number"
            step="any"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errors.amount) setErrors({ ...errors, amount: '' });
            }}
            placeholder="0.00"
            className={`w-full bg-slate-50 border rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition text-right ${
              errors.amount ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.amount && <p className="text-[10px] text-red-500 mt-1">{errors.amount}</p>}
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1 font-sans">التاريخ</label>
          <input
            id="input-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) setErrors({ ...errors, date: '' });
            }}
            className={`w-full bg-slate-50 border rounded-xl py-2 px-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition text-right ${
              errors.date ? 'border-red-400' : 'border-slate-200'
            }`}
          />
          {errors.date && <p className="text-[10px] text-red-500 mt-1">{errors.date}</p>}
        </div>

        {/* Category Pick Grid */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">التصنيف</label>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {categories.map((cat) => {
              const selected = category === cat.id;
              return (
                <motion.button
                  id={`cat-btn-${cat.id}`}
                  key={cat.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    if (errors.category) setErrors({ ...errors, category: '' });
                  }}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-right transition-all justify-start cursor-pointer ${
                    selected
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span 
                    className="p-1 rounded-lg text-xs flex items-center justify-center shrink-0" 
                    style={{ backgroundColor: `${cat.color}12`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} size={14} />
                  </span>
                  <span className="truncate font-sans font-bold text-xs">{cat.name}</span>
                </motion.button>
              );
            })}
          </div>
          {errors.category && <p className="text-[10px] text-red-500 mt-1">{errors.category}</p>}
        </div>

        {/* Notes Input */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظات إضافية</label>
          <textarea
            id="input-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب ملاحظة مختصرة اختيارية..."
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition text-right resize-none"
          />
        </div>

        {/* Action Button */}
        <motion.button
          id="submit-transaction-btn"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          className={`w-full flex items-center justify-center gap-1.5 font-black py-2.5 px-3 rounded-xl text-xs cursor-pointer transition duration-200 shadow-md ${
            editingTransaction 
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20' 
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
          }`}
        >
          {editingTransaction ? (
            <>
              <Edit3 size={14} />
              حفظ وتعديل الفاتورة
            </>
          ) : (
            <>
              <Plus size={14} />
              حفظ وتأكيد العملية مالياً
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
