import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpDown, 
  CreditCard 
} from 'lucide-react';
import { Transaction } from '../types';
import { getCategoryById } from '../categories';
import CategoryIcon from './CategoryIcon';
import { motion } from 'motion/react';

interface AnalyticsPanelProps {
  transactions: Transaction[];
}

export default function AnalyticsPanel({ transactions }: AnalyticsPanelProps) {
  // calculate totals with useMemo to avoid performance lag
  const { totalIncome, totalExpense, netBalance, expensePercentage } = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    }
    
    const balance = income - expense;
    const percentage = income > 0 ? Math.round((expense / income) * 100) : 0;
    
    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: balance,
      expensePercentage: percentage
    };
  }, [transactions]);

  // calculate category summary with useMemo
  const categoriesStats = useMemo(() => {
    const categoryMap: { [key: string]: { amount: number; type: 'income' | 'expense' } } = {};
    
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = { amount: 0, type: t.type };
      }
      categoryMap[t.category].amount += t.amount;
    }

    return Object.keys(categoryMap).map((catId) => {
      const catInfo = getCategoryById(catId);
      return {
        id: catId,
        name: catInfo.name,
        icon: catInfo.icon,
        color: catInfo.color,
        amount: categoryMap[catId].amount,
        type: categoryMap[catId].type,
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  return (
    <div id="analytics-panel" className="space-y-6">
      {/* 3 Basic Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Total Net Balance Card */}
        <motion.div 
          id="card-net-balance" 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md relative overflow-hidden transition-all hover:shadow-xl hover:scale-[1.01] duration-200"
        >
          <div className="absolute right-0 top-0 h-28 w-28 bg-indigo-500/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500">صافي الميزانية المتوفرة</span>
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="space-y-1">
            <h4 id="net-balance-value" className={`text-2xl font-black font-sans tracking-tight leading-none ${
              netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
            </h4>
            <p className="text-xs text-slate-400 font-sans flex items-center gap-1 mt-1">
              <ArrowUpDown size={12} className="text-slate-400" />
              إجمالي الحركات النشطة: {transactions.length}
            </p>
          </div>
        </motion.div>

        {/* Incomes Card */}
        <motion.div 
          id="card-total-incomes" 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md relative overflow-hidden transition-all hover:shadow-xl hover:scale-[1.01] duration-200"
        >
          <div className="absolute right-0 top-0 h-28 w-28 bg-emerald-500/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500">إجمالي المدخولات والمكاسب</span>
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-black text-emerald-600 tracking-tight font-sans leading-none">
              +{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
            </h4>
            <p className="text-xs text-slate-400 font-sans mt-1">
              أرباح وعوائد مسجلة وموثقة
            </p>
          </div>
        </motion.div>

        {/* Expenses Card */}
        <motion.div 
          id="card-total-expenses" 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md relative overflow-hidden transition-all hover:shadow-xl hover:scale-[1.01] duration-200"
        >
          <div className="absolute right-0 top-0 h-28 w-28 bg-rose-500/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500">إجمالي المصاريف والمخارج</span>
            <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown size={18} />
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-black text-rose-600 tracking-tight font-sans leading-none">
              -{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
            </h4>
            <p className="text-xs text-slate-400 font-sans mt-1 flex items-center justify-between">
              <span>نسبة الاستهلاك من الدخل:</span>
              <span className="bg-rose-50 px-2 py-0.5 rounded-lg text-rose-650 font-bold text-[10px]">{expensePercentage}%</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Category breakdown & Bars progress layout */}
      <motion.div 
        id="category-distribution-card" 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md"
      >
        <h3 className="text-sm font-extrabold text-slate-800 mb-5 flex items-center gap-2">
          <CreditCard size={18} className="text-indigo-600" />
          توزيع الميزانية والمصاريف حسب نوع النشاط
        </h3>

        {categoriesStats.length === 0 ? (
          <div className="py-12 text-center text-slate-405 text-slate-400 text-xs">
            لا توجد بيانات كافية لعرض التوزيع التصنيفي حالياً. أضف بعض المعاملات للبدء!
          </div>
        ) : (
          <div className="space-y-4">
            {categoriesStats.map((stat, i) => {
              const baseTotal = stat.type === 'expense' ? totalExpense : totalIncome;
              const percent = baseTotal > 0 ? Math.round((stat.amount / baseTotal) * 100) : 0;
              
              return (
                <div id={`stat-bar-${stat.id}`} key={stat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl text-xs flex items-center justify-center bg-slate-50 border border-slate-100" style={{ color: stat.color }}>
                        <CategoryIcon name={stat.icon} size={15} />
                      </span>
                      <span className="text-slate-700 font-bold font-sans text-xs">{stat.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 font-bold rounded-lg ${
                        stat.type === 'income' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {stat.type === 'income' ? 'دخل' : 'مصروف'}
                      </span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-slate-800 font-black">{stat.amount.toLocaleString()} $</span>
                      <span className="text-slate-400 text-xs mr-1">({percent}%)</span>
                    </div>
                  </div>
                  
                  {/* Progress Line */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
                    <motion.div 
                      className="h-full rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(4, Math.min(100, percent))}%` }}
                      transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: 'easeOut' }}
                      style={{ 
                        backgroundColor: stat.color
                      }}
                    ></motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
