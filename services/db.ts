
import { createClient } from '@supabase/supabase-js';
import { Product, Sale, Expense } from '../types';

/**
 * تابعی برای دریافت ایمن متغیرهای محیطی در محیط‌های مختلف (Vite, Vercel, Node)
 */
const getEnv = (key: string): string => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

// ایجاد کلاینت تنها در صورتی که URL موجود باشد تا از بروز خطای کریتیکال جلوگیری شود
let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.error('خطای پیکربندی: مقادیر VITE_SUPABASE_URL یا VITE_SUPABASE_ANON_KEY یافت نشدند.');
}

export const DB = {
  getProducts: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      // Use type assertion to cast data to Product array
      return (data as Product[]) || [];
    } catch (e) {
      console.error('Error fetching products:', e);
      return [];
    }
  },
  saveProducts: async (products: Product[]) => {
    if (!supabase) return;
    try {
      // Cast to any to bypass strict type check for upsert payload when database schema is not defined
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
      // Use type assertion to cast data to Sale array
      return (data as Sale[]) || [];
    } catch (e) {
      console.error('Error fetching sales:', e);
      return [];
    }
  },
  saveSales: async (sales: Sale[]) => {
    if (!supabase) return;
    try {
      // Cast to any to bypass strict type check for upsert payload when database schema is not defined
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
      // Use type assertion to cast data to Expense array
      return (data as Expense[]) || [];
    } catch (e) {
      console.error('Error fetching expenses:', e);
      return [];
    }
  },
  saveExpenses: async (expenses: Expense[]) => {
    if (!supabase) return;
    try {
      // Cast to any to bypass strict type check for upsert payload when database schema is not defined
      await supabase.from('expenses').upsert(expenses as any);
    } catch (e) {
      console.error('Error saving expenses:', e);
    }
  }
};
