import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Transaction } from './types';

// Check if active config is available either from dynamic localStorage or predefined workspace JSON
export function getActiveConfig() {
  try {
    const localConfigStr = localStorage.getItem('user_firebase_config');
    if (localConfigStr) {
      const parsed = JSON.parse(localConfigStr);
      if (parsed && parsed.projectId && parsed.apiKey) {
        return { config: parsed, isCustom: true };
      }
    }
  } catch (e) {
    console.error("Failed to parse user firebase config from local storage", e);
  }
  
  const hasAppConfig = !!(
    firebaseConfig && 
    firebaseConfig.projectId && 
    firebaseConfig.apiKey &&
    firebaseConfig.projectId !== ""
  );
  
  return { 
    config: hasAppConfig ? firebaseConfig : null, 
    isCustom: false 
  };
}

export function isFirebaseConfigured(): boolean {
  return getActiveConfig().config !== null;
}

// Global cached db instance
let dbInstance: any = null;
let initializedConfigStr = '';

const FIRESTORE_CACHE_KEY = 'dirham_firestore_tx_cache';

export function getFirestoreCache(): Transaction[] {
  try {
    const data = localStorage.getItem(FIRESTORE_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to read firestore cache", e);
    return [];
  }
}

export function saveFirestoreCache(transactions: Transaction[]) {
  try {
    localStorage.setItem(FIRESTORE_CACHE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error("Failed to write firestore cache", e);
  }
}

export function getCachedTransactions(): Transaction[] {
  try {
    if (isFirebaseConfigured()) {
      const cache = getFirestoreCache();
      if (cache.length > 0) return cache;
    }
    return getLocalTransactions();
  } catch (e) {
    return [];
  }
}

export function getDb() {
  const { config } = getActiveConfig();
  if (!config) return null;
  
  const configStr = JSON.stringify(config);
  if (dbInstance && initializedConfigStr === configStr) {
    return dbInstance;
  }
  
  try {
    const existingApps = getApps();
    const appName = "user_app_" + (config.projectId ? config.projectId.replace(/[^a-zA-Z0-9]/g, '') : "default");
    
    let app;
    const found = existingApps.find(a => a.name === appName || (appName === 'user_app_default' && a.name === '[DEFAULT]'));
    if (found) {
      app = found;
    } else {
      app = initializeApp(config, appName);
    }
    
    dbInstance = getFirestore(app, config.firestoreDatabaseId || '(default)');
    initializedConfigStr = configStr;
    return dbInstance;
  } catch (e) {
    console.error("Failed to initialize Firebase dynamically:", e);
    return dbInstance || null;
  }
}

// 1. READ / LIST ALL
export async function fetchTransactions(): Promise<Transaction[]> {
  const db = getDb();
  if (isFirebaseConfigured() && db) {
    const colPath = 'transactions';
    
    // Create a timeout promise to reject after 3.2 seconds
    const timeout = (ms: number) => new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Firebase network connection timeout')), ms)
    );
    
    try {
      const q = query(
        collection(db, colPath),
        orderBy('date', 'desc')
      );
      
      // Race Firebase retrieval against timeout
      const snapshot = await Promise.race([
        getDocs(q),
        timeout(3200)
      ]);
      
      const items: Transaction[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        items.push({
          id: doc.id,
          title: d.title || '',
          amount: Number(d.amount) || 0,
          type: d.type || 'expense',
          category: d.category || 'other',
          date: d.date || '',
          notes: d.notes || '',
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
        } as Transaction);
      });
      
      // Save successfully fetched list to local cache
      saveFirestoreCache(items);
      return items;
    } catch (error) {
      console.warn("Firestore fetch error or timeout, loading cached data:", error);
      
      // Retrieve from cache if Firestore query failed/timed out
      const cached = getFirestoreCache();
      if (cached && cached.length > 0) {
        return cached;
      }
      
      // Fallback further to unordered list query with a shorter timeout as a last resort
      try {
        const snapshot = await Promise.race([
          getDocs(collection(db, colPath)),
          timeout(1500)
        ]);
        const items: Transaction[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          items.push({
            id: doc.id,
            title: d.title || '',
            amount: Number(d.amount) || 0,
            type: d.type || 'expense',
            category: d.category || 'other',
            date: d.date || '',
            notes: d.notes || '',
          } as Transaction);
        });
        
        const sorted = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        saveFirestoreCache(sorted);
        return sorted;
      } catch (innerErr) {
        console.error("Failed completely to fetch transactions from Firebase, returning cached fallback:", innerErr);
        const ultimateCache = getFirestoreCache();
        if (ultimateCache.length > 0) return ultimateCache;
        return getLocalTransactions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    }
  } else {
    const local = getLocalTransactions();
    return local.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

// 2. CREATE
export async function createTransaction(item: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  const customId = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const nowStr = new Date().toISOString();
  const db = getDb();
  
  if (isFirebaseConfigured() && db) {
    const colPath = 'transactions';
    try {
      const payload = {
        title: item.title,
        amount: Number(item.amount),
        type: item.type,
        category: item.category,
        date: item.date,
        notes: item.notes || '',
        createdAt: serverTimestamp()
      };
      
      const docRef = doc(db, colPath, customId);
      await setDoc(docRef, payload);
      
      return {
        id: customId,
        ...item,
        createdAt: nowStr
      };
    } catch (error) {
      console.error("Error creating transaction in Firestore:", error);
      throw error;
    }
  } else {
    const local = getLocalTransactions();
    const newTx: Transaction = {
      id: customId,
      ...item,
      createdAt: nowStr
    };
    local.push(newTx);
    saveLocalTransactions(local);
    return newTx;
  }
}

// 3. UPDATE
export async function updateTransactionData(id: string, item: Partial<Transaction>): Promise<void> {
  const db = getDb();
  if (isFirebaseConfigured() && db) {
    const colPath = 'transactions';
    try {
      const docRef = doc(db, colPath, id);
      
      const updates: any = {};
      if (item.title !== undefined) updates.title = item.title;
      if (item.amount !== undefined) updates.amount = Number(item.amount);
      if (item.type !== undefined) updates.type = item.type;
      if (item.category !== undefined) updates.category = item.category;
      if (item.date !== undefined) updates.date = item.date;
      if (item.notes !== undefined) updates.notes = item.notes;
      updates.updatedAt = serverTimestamp();
      
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  } else {
    const local = getLocalTransactions();
    const index = local.findIndex(t => t.id === id);
    if (index !== -1) {
      local[index] = {
        ...local[index],
        ...item,
        amount: item.amount !== undefined ? Number(item.amount) : local[index].amount,
        updatedAt: new Date().toISOString()
      };
      saveLocalTransactions(local);
    }
  }
}

// 4. DELETE
export async function deleteTransactionData(id: string): Promise<void> {
  const db = getDb();
  if (isFirebaseConfigured() && db) {
    const colPath = 'transactions';
    try {
      const docRef = doc(db, colPath, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting transaction from firestore:", error);
      throw error;
    }
  } else {
    const local = getLocalTransactions();
    const filtered = local.filter(t => t.id !== id);
    saveLocalTransactions(filtered);
  }
}

// --- Local storage storage utilities fallback ---
const LOCAL_STORAGE_KEY = 'crud_finance_transactions';

export function getLocalTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to read from localStorage", e);
    return [];
  }
}

export function saveLocalTransactions(transactions: Transaction[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error("Failed to write to localStorage", e);
  }
}
