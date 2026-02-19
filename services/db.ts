
import { createClient } from '@supabase/supabase-js';
import { Product, Sale, Expense, User } from '../types';

const supabaseUrl = "https://xhogilmkyykccowcjlak.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob2dpbG1reXlrY2Nvd2NqbGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzc0NTksImV4cCI6MjA4MzIxMzQ1OX0._9iJoCX3H03M4rF0xBKDXKGbOoXXL6L-tAe_s9mnPE4";

let supabase: any = null;

try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (err) {
  console.error('❌ خطا در اتصال به Supabase:', err);
}

export const DB = {
  isConnected: () => !!supabase,

  getUsers: async (): Promise<User[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*');
    if (error) { console.error('Error users:', error.message); return []; }
    return data || [];
  },

  saveUser: async (user: User) => {
    if (!supabase) return;
    const { error } = await supabase.from('users').upsert(user);
    if (error) {
       console.error('❌ خطا در ذخیره کاربر:', error.message, error.details);
       alert(`خطا در دیتابیس: ${error.message}`);
    }
  },

  deleteUser: async (id: string) => {
    if (!supabase) return;
    await supabase.from('users').delete().eq('id', id);
  },

  getProducts: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (error) { console.error('Error products:', error.message); return []; }
    return data || [];
  },

  upsertProduct: async (product: Product) => {
    if (!supabase) return;
    const { error } = await supabase.from('products').upsert(product);
    if (error) {
      console.error('❌ جزئیات خطای دیتابیس (محصول):', error.message, error.details);
      alert(`خطای ذخیره‌سازی: ${error.message}\nاگر خطای RLS است، کد SQL جدید را اجرا کنید.`);
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) console.error('Delete error:', error.message);
  },

  getSales: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false });
    if (error) { console.error('Error sales:', error.message); return []; }
    return data || [];
  },

  addSale: async (sale: Sale) => {
    if (!supabase) return;
    const { error } = await supabase.from('sales').insert(sale);
    if (error) {
      console.error('❌ خطا در ثبت فروش:', error.message);
      throw error;
    }
  },

  deleteSale: async (id: string) => {
    if (!supabase) return;
    await supabase.from('sales').delete().eq('id', id);
  },

  getExpenses: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (error) { console.error('Error expenses:', error.message); return []; }
    return data || [];
  },

  addExpense: async (expense: Expense) => {
    if (!supabase) return;
    const { error } = await supabase.from('expenses').insert(expense);
    if (error) {
       console.error('❌ خطا در ثبت هزینه:', error.message);
       throw error;
    }
  },

  deleteExpense: async (id: string) => {
    if (!supabase) return;
    await supabase.from('expenses').delete().eq('id', id);
  }
};
