import React, { useState, useEffect, useTransition } from 'react';
import { 
  Coins, 
  Plus, 
  Check, 
  ArrowRightLeft, 
  Sparkles, 
  X, 
  Settings, 
  Database, 
  BookOpen, 
  RefreshCw, 
  AlertCircle, 
  Trash2,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { Transaction } from './types';
import { 
  isFirebaseConfigured, 
  fetchTransactions, 
  createTransaction, 
  updateTransactionData, 
  deleteTransactionData,
  getActiveConfig,
  getDb
} from './firebase';
import TransactionForm from './components/TransactionForm';
import AnalyticsPanel from './components/AnalyticsPanel';
import TransactionList from './components/TransactionList';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Custom Firebase setup states
  const [customConfigInput, setCustomConfigInput] = useState('');
  const [activeConfigObj, setActiveConfigObj] = useState(getActiveConfig());
  const [isPending, startTransition] = useTransition();

  // Load Transactions automatically
  const loadData = async () => {
    setLoadingData(true);
    setErrorMessage(null);
    try {
      const data = await fetchTransactions();
      // Update states within React transition to prevent rendering lag
      startTransition(() => {
        setTransactions(data);
      });
    } catch (e: any) {
      console.error("Failed to load transactions:", e);
      setErrorMessage("حدث خطأ أثناء تحميل البيانات من قاعدة البيانات السحابية الحالية.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Autofill current config in settings input if it's high level custom config
    const localConfig = localStorage.getItem('user_firebase_config');
    if (localConfig) {
      setCustomConfigInput(localConfig);
    }
  }, []);

  // Toast message triggers
  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // Save Config Handler
  const handleSaveCustomConfig = () => {
    if (!customConfigInput.trim()) {
      triggerError("يرجى إدخال نص إعدادات Firebase config أولاً.");
      return;
    }
    
    try {
      // support both clean json, and direct js object copy-paste:
      let cleaned = customConfigInput.trim();
      // If it looks like a Javascript object instead of strict JSON, let's fix keys
      if (cleaned.startsWith('const firebaseConfig =') || cleaned.startsWith('var firebaseConfig =')) {
        // extract keys inside curly braces
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          cleaned = match[0];
        }
      }
      
      // Attempt to parse simple key-value pairs or JS object keys by converting them to valid JSON keys
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch (jsonErr) {
        // fallback parser for slightly unformatted JS objects:
        // replace unquoted keys with quoted keys
        const formatted = cleaned
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Quote keys
          .replace(/'/g, '"') // replace single quotes with double quotes
          .replace(/,\s*([}\]])/g, '$1'); // remove trailing commas
        parsed = JSON.parse(formatted);
      }

      if (!parsed.apiKey || !parsed.projectId) {
        triggerError("الإعدادات غير مكتملة! يجب إدخال apiKey و projectId على الأقل لتفعيل الاتصال السحابي.");
        return;
      }

      localStorage.setItem('user_firebase_config', JSON.stringify(parsed, null, 2));
      setActiveConfigObj(getActiveConfig());
      triggerSuccess("تم ربط تطبيقك بقاعدة بياناتك الشخصية بنجاح! جاري مزامنة السجلات...");
      setIsSettingsOpen(false);
      
      // Reload Transactions immediately
      setTimeout(() => {
        loadData();
      }, 300);
    } catch (e: any) {
      console.error("Firebase custom configuration parse error:", e);
      triggerError("خطأ في صياغة الـ JSON المنسوخ. يرجى التأكد من نسخه بالكامل بالشكل الصحيح.");
    }
  };

  // Reset custom database configuration
  const handleResetConfig = () => {
    localStorage.removeItem('user_firebase_config');
    setCustomConfigInput('');
    setActiveConfigObj(getActiveConfig());
    triggerSuccess("تم إلغاء ربط قاعدة البيانات الخاصة والرجوع للإعدادات الافتراضية.");
    setIsSettingsOpen(false);
    
    setTimeout(() => {
      loadData();
    }, 300);
  };

  // Save Handler (Create or Update)
  const handleSaveTransaction = async (item: {
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    notes?: string;
  }) => {
    setErrorMessage(null);
    try {
      if (editingTransaction) {
        await updateTransactionData(editingTransaction.id, item);
        triggerSuccess("تم تحديث العملية المالية بنجاح!");
        setEditingTransaction(null);
      } else {
        await createTransaction(item);
        triggerSuccess("تم تسجيل الحركة المالية بنجاح!");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (e: any) {
      console.error("Error saving transaction:", e);
      triggerError("خطأ أثناء حفظ البيانات وسحب السجلات السحابية.");
    }
  };

  // Delete Handler
  const handleDeleteTransaction = async (id: string) => {
    setErrorMessage(null);
    try {
      await deleteTransactionData(id);
      triggerSuccess("تم حذف المعاملة المالية بنجاح.");
      await loadData();
    } catch (e: any) {
      console.error("Error deleting transaction:", e);
      triggerError("حدث خطأ غير متوقع أثناء محاولة حذف المعاملة من السحابة.");
    }
  };

  const handleEditSelect = (item: Transaction) => {
    setEditingTransaction(item);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-indigo-100 overflow-x-hidden relative" dir="rtl">
      
      {/* Vibrant and responsive gradient background spot lights */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/10 to-violet-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Container wrapper */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Dynamic header / Navbar line */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-5 border-b border-slate-100 pb-6 mb-8">
          <div className="flex items-center gap-4 text-right">
            <div 
              className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/15 transition-transform duration-300 hover:rotate-12 hover:scale-105 cursor-pointer"
            >
              <Coins size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-800 font-sans tracking-tight">
                  درهَم
                </h1>
                
                {/* Active connection database badge selector */}
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                  <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span>
                  متصل سحابياً بقاعدة بياناتك الخاصة
                </span>
              </div>
              <p className="text-xs text-slate-450 text-slate-500 mt-1 font-semibold leading-relaxed">
                متابعة وإدارة أموالك بسرعة فائقة - مع حركات مرئية وتصميم متجاوب
              </p>
            </div>
          </div>

          {/* Settings and New transaction action controls */}
          <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-end">
            <motion.button
              id="add-tx-floating-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingTransaction(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-550 text-white font-extrabold py-3 px-5 rounded-2xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-650/25 active:scale-[0.98] transition-all text-xs cursor-pointer"
            >
              <Plus size={15} />
              إضافة حركة مالية جديدة
            </motion.button>
          </div>
        </header>

        {/* Notification Toasts with smooth interactive entrances */}
        <div className="space-y-3 mb-6">
          <AnimatePresence>
            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-sm text-right"
              >
                <Check size={16} className="text-emerald-500 shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}
            
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-sm text-right"
              >
                <AlertCircle size={16} className="text-rose-500 shrink-0" />
                <span>⚠️ {errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dashboard Main Visual Layout components */}
        {loadingData && transactions.length === 0 ? (
          <div className="py-24 text-center">
            <RefreshCw className="animate-spin text-indigo-600 mx-auto mb-4" size={32} />
            <p className="text-xs text-slate-500 font-sans font-semibold">بناء الاتصال السحابي وتحميل السجلات المالية بسرعة ومزامنة البيانات...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. Analytics & Visual Cards panel */}
            <AnalyticsPanel transactions={transactions} />

            {/* 2. Transaction List view */}
            <TransactionList 
              transactions={transactions}
              onEdit={handleEditSelect}
              onDelete={handleDeleteTransaction}
            />
          </div>
        )}

      </div>

      {/* Pop-up modal with responsive animation and overlay blur */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop slide click target */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity cursor-pointer"
              onClick={() => {
                setIsModalOpen(false);
                setEditingTransaction(null);
              }}
            />
            
            {/* Pop-up transaction form positioning */}
            <div className="relative z-10 w-full max-w-lg">
              <TransactionForm 
                onSave={handleSaveTransaction}
                editingTransaction={editingTransaction}
                onCancel={() => {
                  setIsModalOpen(false);
                  setEditingTransaction(null);
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
