
import { createClient } from '@supabase/supabase-js';
import { Product, Sale, Expense, User } from '../types';

const supabaseUrl = "https://xhogilmkyykccowcjlak.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob2dpbG1reXlrY2Nvd2NqbGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzc0NTksImV4cCI6MjA4MzIxMzQ1OX0._9iJoCX3H03M4rF0xBKDXKGbOoXXL6L-tAe_s9mnPE4";

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('❌ خطا در راه‌اندازی دیتابیس:', err);
  }
}

export const DB = {
  isConnected: () => !!supabase,

  // Users
  getUsers: async (): Promise<User[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*');
    if (error) return [];
    return data as User[];
  },
  saveUser: async (user: User) => {
    if (!supabase) return;
    await supabase.from('users').upsert(user);
  },
  deleteUser: async (id: string) => {
    if (!supabase) return;
    await supabase.from('users').delete().eq('id', id);
  },

  // Products
  getProducts: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('products').select('*');
    return (data as Product[]) || [];
  },
  saveProducts: async (products: Product[]) => {
    if (!supabase || products.length === 0) return;
    await supabase.from('products').upsert(products);
  },
  deleteProduct: async (id: string) => {
    if (!supabase) return;
    await supabase.from('products').delete().eq('id', id);
  },

  // Sales
  getSales: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('sales').select('*');
    return (data as Sale[]) || [];
  },
  saveSales: async (sales: Sale[]) => {
    if (!supabase || sales.length === 0) return;
    await supabase.from('sales').upsert(sales);
  },
  deleteSale: async (id: string) => {
    if (!supabase) return;
    await supabase.from('sales').delete().eq('id', id);
  },

  // Expenses
  getExpenses: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('expenses').select('*');
    return (data as Expense[]) || [];
  },
  saveExpenses: async (expenses: Expense[]) => {
    if (!supabase || expenses.length === 0) return;
    await supabase.from('expenses').upsert(expenses);
  },
  deleteExpense: async (id: string) => {
    if (!supabase) return;
    await supabase.from('expenses').delete().eq('id', id);
  }
};
