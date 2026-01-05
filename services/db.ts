
import { createClient } from '@supabase/supabase-js';
import { Product, Sale, Expense } from '../types';

// اصلاح آدرس به فرمت کامل مورد نیاز Supabase
const supabaseUrl = 'https://xhogilmkyykccowcjlak.supabase.co';
const supabaseKey = 'sb_publishable_mZy125eRnbzOVMjGAfPx3A_w8-46ubw';
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
