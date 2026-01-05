import { createClient } from '@supabase/supabase-js';
import { Product, Sale, Expense } from '../types';

// در Vite متغیرها حتما باید با VITE_ شروع شوند
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ اتصال اولیه به Supabase برقرار شد.');
  } catch (err) {
    console.error('❌ خطا در راه اندازی Supabase:', err);
  }
} else {
  console.error('⚠️ متغیرهای محیطی Supabase یافت نشدند! لطفا VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY را در تنظیمات Vercel چک کنید.');
}

export const DB = {
  isConnected: () => !!supabase,

  getProducts: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return (data as Product[]) || [];
    } catch (e) {
      console.error('Error fetching products:', e);
      return [];
    }
  },

  saveProducts: async (products: Product[]) => {
    if (!supabase) return;
    try {
      // استفاده از upsert برای جلوگیری از تکرار داده
      const { error } = await supabase.from('products').upsert(products);
      if (error) throw error;
    } catch (e) {
      console.error('Error saving products:', e);
    }
  },

  getSales: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('sales').select('*');
      if (error) throw error;
      return (data as Sale[]) || [];
    } catch (e) {
      console.error('Error fetching sales:', e);
      return [];
    }
  },

  saveSales: async (sales: Sale[]) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('sales').upsert(sales);
      if (error) throw error;
    } catch (e) {
      console.error('Error saving sales:', e);
    }
  },

  getExpenses: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('expenses').select('*');
      if (error) throw error;
      return (data as Expense[]) || [];
    } catch (e) {
      console.error('Error fetching expenses:', e);
      return [];
    }
  },

  saveExpenses: async (expenses: Expense[]) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('expenses').upsert(expenses);
      if (error) throw error;
    } catch (e) {
      console.error('Error saving expenses:', e);
    }
  }
};