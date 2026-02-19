
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

  // Users
  getUsers: async (): Promise<User[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*');
    if (error) { console.error('Error fetching users:', error); return []; }
    return data as User[];
  },
  saveUser: async (user: User) => {
    if (!supabase) return;
    const { error } = await supabase.from('users').upsert(user);
    if (error) console.error('❌ خطا در ذخیره کاربر. مطمئن شوید RLS غیرفعال است:', error);
  },
  deleteUser: async (id: string) => {
    if (!supabase) return;
    await supabase.from('users').delete().eq('id', id);
  },

  // Products
  getProducts: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('products').select('*');
    if (error) { console.error('Error fetching products:', error); return []; }
    return (data as Product[]) || [];
  },
  upsertProduct: async (product: Product) => {
    if (!supabase) return;
    const { error } = await supabase.from('products').upsert(product);
    if (error) {
      console.error('❌ خطا در ذخیره محصول:', error);
      alert('خطا در ذخیره در دیتابیس! لطفاً تنظیمات RLS را چک کنید.');
    }
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
    if (error) { console.error('Error fetching sales:', error); return []; }
    return (data as Sale[]) || [];
  },
  addSale: async (sale: Sale) => {
    if (!supabase) return;
    const { error } = await supabase.from('sales').insert(sale);
    if (error) console.error('❌ خطا در ثبت فروش در دیتابیس:', error);
  },
  deleteSale: async (id: string) => {
    if (!supabase) return;
    await supabase.from('sales').delete().eq('id', id);
  },

  // Expenses
  getExpenses: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('expenses').select('*');
    if (error) { console.error('Error fetching expenses:', error); return []; }
    return (data as Expense[]) || [];
  },
  addExpense: async (expense: Expense) => {
    if (!supabase) return;
    const { error } = await supabase.from('expenses').insert(expense);
    if (error) console.error('❌ خطا در ثبت هزینه در دیتابیس:', error);
  },
  deleteExpense: async (id: string) => {
    if (!supabase) return;
    await supabase.from('expenses').delete().eq('id', id);
  }
};
