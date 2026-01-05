import { createClient } from '@supabase/supabase-js';
import { Product, Sale, Expense } from '../types';

const supabaseUrl = 'xhogilmkyykccowcjlak';
const supabaseKey = 'sb_publishable_mZy125eRnbzOVMjGAfPx3A_w8-46ubw';
const supabase = createClient(supabaseUrl, supabaseKey);

export const DB = {
  // مدیریت محصولات
  getProducts: async () => {
    const { data } = await supabase.from('products').select('*');
    return data || [];
  },
  saveProducts: async (products: Product[]) => {
    await supabase.from('products').upsert(products);
  },

  // مدیریت فروش
  getSales: async () => {
    const { data } = await supabase.from('sales').select('*');
    return data || [];
  },
  saveSales: async (sales: Sale[]) => {
    await supabase.from('sales').upsert(sales);
  },

  // مدیریت هزینه‌ها
  getExpenses: async () => {
    const { data } = await supabase.from('expenses').select('*');
    return data || [];
  },
  saveExpenses: async (expenses: Expense[]) => {
    await supabase.from('expenses').upsert(expenses);
  }
};