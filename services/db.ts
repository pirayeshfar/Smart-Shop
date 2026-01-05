import { createClient } from '@supabase/supabase-js';
import { Product, Sale, Expense } from '../types';

/**
 * برای جلوگیری از خطای "Cannot read properties of undefined (reading VITE_SUPABASE_URL)"
 * از process.env استفاده می‌کنیم که در این محیط به متغیرهای تزریق شده دسترسی مستقیم دارد.
 */
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const DB = {
  getProducts: async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching products:', e);
      return [];
    }
  },
  saveProducts: async (products: Product[]) => {
    try {
      await supabase.from('products').upsert(products);
    } catch (e) {
      console.error('Error saving products:', e);
    }
  },
  getSales: async () => {
    try {
      const { data, error } = await supabase.from('sales').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching sales:', e);
      return [];
    }
  },
  saveSales: async (sales: Sale[]) => {
    try {
      await supabase.from('sales').upsert(sales);
    } catch (e) {
      console.error('Error saving sales:', e);
    }
  },
  getExpenses: async () => {
    try {
      const { data, error } = await supabase.from('expenses').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching expenses:', e);
      return [];
    }
  },
  saveExpenses: async (expenses: Expense[]) => {
    try {
      await supabase.from('expenses').upsert(expenses);
    } catch (e) {
      console.error('Error saving expenses:', e);
    }
  }
};