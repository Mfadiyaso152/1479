import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Calendar, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { Transaction } from '../types';
import { getCategoryById } from '../categories';
import CategoryIcon from './CategoryIcon';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (item: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionList({ 
  transactions, 
  onEdit, 
  onDelete 
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Extract unique categories from current transactions with useMemo to keep it extremely lightweight
  const activeCategories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category)));
  }, [transactions]);

  // Filter logic optimized with useMemo to completely eliminate rendering lag
  const filteredTransactions = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return transactions.filter((tx) => {
      const matchesSearch = !searchLower || 
                            tx.title.toLowerCase().includes(searchLower) || 
                            (tx.notes && tx.notes.toLowerCase().includes(searchLower));
      
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      
      const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter]);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  return (
    <div id="transaction-list-container" className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md">
      {/* Header and Counters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            سجل العمليات المالية المقيدة
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            يعرض تصفية {filteredTransactions.length} من أصل {transactions.length} معاملة مسجلة في الوقت الفعلي
          </p>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
        {/* Search */}
        <div className="relative">
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={16} />
          </span>
          <input
            id="search-transactions"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث عن عنوان أو ملاحظة..."
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 pl-8 pr-10 text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-505 focus:ring-1 focus:ring-indigo-500/20 outline-none transition text-right"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Type Filter Tabs */}
        <div className="grid grid-cols-3 p-1 bg-slate-50 border border-slate-200/50 rounded-xl">
          <button
            id="filter-type-all"
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            الكل
          </button>
          <button
            id="filter-type-expense"
            type="button"
            onClick={() => setTypeFilter('expense')}
            className={`py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
              typeFilter === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            المصاريف
          </button>
          <button
            id="filter-type-income"
            type="button"
            onClick={() => setTypeFilter('income')}
            className={`py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
              typeFilter === 'income'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            المدخولات
          </button>
        </div>

        {/* Category Selector Filter */}
        <div className="relative">
          <select
            id="filter-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-5/5 p-2 px-3 text-xs bg-slate-50 border border-slate-205 rounded-xl outline-none focus:border-indigo-500 transition appearance-none text-right font-sans"
          >
            <option value="all">كل التصنيفات الإرشادية</option>
            {activeCategories.map((catId) => {
              const catInfo = getCategoryById(catId);
              return (
                <option key={catId} value={catId}>{catInfo.name}</option>
              );
            })}
          </select>
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Filter size={14} />
          </span>
        </div>
      </div>

      {/* Transaction Rows with dynamic motion container */}
      {filteredTransactions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-16 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200/80"
        >
          <AlertCircle size={28} className="text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-sans font-medium">لا توجد أي عمليات تطابق معايير التصفية والبحث حالياً.</p>
        </motion.div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {filteredTransactions.map((tx) => {
              const catInfo = getCategoryById(tx.category);
              const isIncome = tx.type === 'income';
              const isDeleting = confirmDeleteId === tx.id;

              return (
                <motion.div
                  key={tx.id}
                  id={`transaction-row-${tx.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  layout
                  className="group relative bg-[#fafbfc] border border-slate-100 hover:border-indigo-150 hover:bg-slate-50/50 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-150 shadow-sm"
                >
                  {/* Left side Metadata & Controls */}
                  <div className="flex items-center gap-4">
                    {/* Amount with colored prefix */}
                    <div className="text-left">
                      <span className={`text-sm font-black font-sans tracking-tight leading-none ${
                        isIncome ? 'text-emerald-650 text-emerald-600' : 'text-rose-650 text-rose-500'
                      }`}>
                        {isIncome ? '+' : '-'}{tx.amount.toLocaleString()} $
                      </span>
                      <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1 mt-1 justify-end">
                        <Calendar size={11} />
                        {tx.date}
                      </div>
                    </div>

                    {/* Action controls */}
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition duration-150">
                      {isDeleting ? (
                        <div className="flex items-center bg-red-50 border border-red-200/80 rounded-xl p-0.5 gap-1 animate-fadeIn">
                          <button
                            id={`confirm-del-${tx.id}`}
                            onClick={(e) => handleConfirmDelete(tx.id, e)}
                            className="p-1.5 text-red-650 hover:bg-red-100/50 text-red-700 rounded-lg transition"
                            title="تأكيد الحذف"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            id={`cancel-del-${tx.id}`}
                            onClick={handleCancelDelete}
                            className="p-1.5 text-slate-500 hover:bg-slate-200/50 rounded-lg transition"
                            title="تراجع"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <button
                            id={`edit-btn-${tx.id}`}
                            type="button"
                            onClick={() => onEdit(tx)}
                            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl transition"
                            title="تعديل تفاصيل الحركة"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            id={`delete-btn-${tx.id}`}
                            type="button"
                            onClick={(e) => handleDeleteClick(tx.id, e)}
                            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-red-500 rounded-xl transition"
                            title="حذف الحركة"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side Detail & Icon */}
                  <div className="flex items-center gap-3.5 text-right min-w-0">
                    {/* Category circular icon badge */}
                    <div 
                      className="p-3 rounded-2xl shrink-0 flex items-center justify-center shadow-inner mt-0.5"
                      style={{ backgroundColor: `${catInfo.color}15`, color: catInfo.color }}
                    >
                      <CategoryIcon name={catInfo.icon} size={16} />
                    </div>

                    <div className="space-y-0.5 min-w-0 text-right">
                      <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                        {tx.title}
                      </h4>
                      {tx.notes ? (
                        <p className="text-[10px] text-slate-500 truncate max-w-[150px] sm:max-w-xs font-sans">
                          {tx.notes}
                        </p>
                      ) : (
                        <p className="text-[9px] font-sans font-bold text-slate-400">
                          تصنيف: {catInfo.name}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
