import { createClient } from '@supabase/supabase-js';
import { Product, Sale, Expense } from '../types';

// در Vite، متغیرهایی که با VITE_ شروع می‌شوند در import.meta.env در دسترس هستند
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ایجاد کلاینت به صورت ایمن
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('Supabase initialization error:', err);
  }
} else {
  console.warn('Supabase configuration is missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const DB = {
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
      await supabase.from('products').upsert(products as any);
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
      await supabase.from('sales').upsert(sales as any);
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
      await supabase.from('expenses').upsert(expenses as any);
    } catch (e) {
      console.error('Error saving expenses:', e);
    }
  }
};