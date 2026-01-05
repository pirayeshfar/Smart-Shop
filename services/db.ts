import { createClient } from '@supabase/supabase-js';
import { Product, Sale, Expense } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('Supabase Init Error:', err);
  }
}

export const DB = {
  isConnected: () => !!supabase,

  getProducts: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        console.error('Supabase Fetch Error (Products):', error.message);
        return [];
      }
      return (data as Product[]) || [];
    } catch (e) {
      console.error('DB Error:', e);
      return [];
    }
  },

  saveProducts: async (products: Product[]) => {
    if (!supabase || products.length === 0) return;
    try {
      // استفاده از upsert برای ذخیره یا بروزرسانی
      const { error } = await supabase.from('products').upsert(products, { onConflict: 'id' });
      if (error) console.error('Supabase Save Error (Products):', error.message);
    } catch (e) {
      console.error('DB Save Error:', e);
    }
  },

  getSales: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('sales').select('*');
      if (error) {
        console.error('Supabase Fetch Error (Sales):', error.message);
        return [];
      }
      return (data as Sale[]) || [];
    } catch (e) {
      console.error('DB Error:', e);
      return [];
    }
  },

  saveSales: async (sales: Sale[]) => {
    if (!supabase || sales.length === 0) return;
    try {
      const { error } = await supabase.from('sales').upsert(sales, { onConflict: 'id' });
      if (error) console.error('Supabase Save Error (Sales):', error.message);
    } catch (e) {
      console.error('DB Save Error:', e);
    }
  },

  getExpenses: async () => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('expenses').select('*');
      if (error) {
        console.error('Supabase Fetch Error (Expenses):', error.message);
        return [];
      }
      return (data as Expense[]) || [];
    } catch (e) {
      console.error('DB Error:', e);
      return [];
    }
  },

  saveExpenses: async (expenses: Expense[]) => {
    if (!supabase || expenses.length === 0) return;
    try {
      const { error } = await supabase.from('expenses').upsert(expenses, { onConflict: 'id' });
      if (error) console.error('Supabase Save Error (Expenses):', error.message);
    } catch (e) {
      console.error('DB Save Error:', e);
    }
  }
};