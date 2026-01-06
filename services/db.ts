import { createClient } from '@supabase/supabase-js';
import { Product, Sale, Expense } from '../types';

// اطلاعات اتصال به دیتابیس شما
const supabaseUrl = "https://xhogilmkyykccowcjlak.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob2dpbG1reXlrY2Nvd2NqbGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzc0NTksImV4cCI6MjA4MzIxMzQ1OX0._9iJoCX3H03M4rF0xBKDXKGbOoXXL6L-tAe_s9mnPE4";

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ اتصال به دیتابیس با موفقیت برقرار شد.');
  } catch (err) {
    console.error('❌ خطا در راه‌اندازی دیتابیس:', err);
  }
}

export const DB = {
  isConnected: () => !!supabase,

  // Products
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
    if (!supabase || products.length === 0) return;
    try {
      await supabase.from('products').upsert(products);
    } catch (e) {
      console.error('Error saving products:', e);
    }
  },
  deleteProduct: async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error deleting product:', e);
    }
  },

  // Sales
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
    if (!supabase || sales.length === 0) return;
    try {
      await supabase.from('sales').upsert(sales);
    } catch (e) {
      console.error('Error saving sales:', e);
    }
  },
  deleteSale: async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error deleting sale:', e);
    }
  },

  // Expenses
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
    if (!supabase || expenses.length === 0) return;
    try {
      await supabase.from('expenses').upsert(expenses);
    } catch (e) {
      console.error('Error saving expenses:', e);
    }
  },
  deleteExpense: async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error deleting expense:', e);
    }
  }
};