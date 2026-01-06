
import { createClient } from '@supabase/supabase-js';
import { Product, Sale, Expense } from '../types';

// Use process.env instead of import.meta.env to resolve TypeScript errors and maintain environment consistency.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ اتصال اولیه به Supabase برقرار شد.');
  } catch (err) {
    console.error('❌ خطا در راه اندازی Supabase:', err);
  }
}

export const DB = {
  isConnected: () => !!supabase,

  // Products
  getProducts: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('products').select('*');
    if (error) return [];
    return data as Product[];
  },
  saveProducts: async (products: Product[]) => {
    if (!supabase || products.length === 0) return;
    await supabase.from('products').upsert(products);
  },
  deleteProduct: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) console.error('Error deleting product:', error);
  },

  // Sales
  getSales: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('sales').select('*');
    if (error) return [];
    return data as Sale[];
  },
  saveSales: async (sales: Sale[]) => {
    if (!supabase || sales.length === 0) return;
    await supabase.from('sales').upsert(sales);
  },
  deleteSale: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) console.error('Error deleting sale:', error);
  },

  // Expenses
  getExpenses: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('expenses').select('*');
    if (error) return [];
    return data as Expense[];
  },
  saveExpenses: async (expenses: Expense[]) => {
    if (!supabase || expenses.length === 0) return;
    await supabase.from('expenses').upsert(expenses);
  },
  deleteExpense: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) console.error('Error deleting expense:', error);
  }
};
