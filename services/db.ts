
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
    if (error) return [];
    return data || [];
  },

  saveUser: async (user: User) => {
    if (!supabase) return;
    const userPayload: any = {
      id: user.id,
      username: user.username,
      password: user.password,
      role: user.role,
      fullName: user.fullName
    };
    if (user.commissionRate !== undefined) {
      userPayload.commissionRate = user.commissionRate;
    }
    const { error } = await supabase.from('users').upsert(userPayload);
    if (error && userPayload.commissionRate !== undefined) {
      // Fallback if remote schema doesn't have commissionRate column
      delete userPayload.commissionRate;
      await supabase.from('users').upsert(userPayload);
    }
  },

  deleteUser: async (id: string) => {
    if (!supabase) return;
    await supabase.from('users').delete().eq('id', id);
  },

  getProducts: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (error) return [];
    return data || [];
  },

  upsertProduct: async (product: Product) => {
    if (!supabase) return;
    // استفاده از نام‌های دقیق ستون‌ها برای جلوگیری از خطای Schema Cache
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      code: product.code,
      name: product.name,
      size: product.size,
      color: product.color,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      reorderPoint: product.reorderPoint
    });
    
    if (error) {
      console.error('Database Error:', error.message);
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    if (!supabase) return;
    await supabase.from('products').delete().eq('id', id);
  },

  getSales: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false });
    if (error) return [];
    return data || [];
  },

  addSale: async (sale: Sale) => {
    if (!supabase) return;
    const salePayload: any = {
      id: sale.id,
      date: sale.date,
      productId: sale.productId,
      productName: sale.productName,
      quantity: sale.quantity,
      subtotal: sale.subtotal,
      discountAmount: sale.discountAmount,
      taxAmount: sale.taxAmount,
      totalAmount: sale.totalAmount,
      profit: sale.profit
    };
    if (sale.sellerId) salePayload.sellerId = sale.sellerId;
    if (sale.sellerName) salePayload.sellerName = sale.sellerName;

    const { error } = await supabase.from('sales').insert(salePayload);
    if (error) {
      console.warn('Supabase addSale primary attempt:', error.message);
      // Fallback in case remote database table does not have sellerId/sellerName columns
      const { error: fallbackError } = await supabase.from('sales').insert({
        id: sale.id,
        date: sale.date,
        productId: sale.productId,
        productName: sale.productName,
        quantity: sale.quantity,
        subtotal: sale.subtotal,
        discountAmount: sale.discountAmount,
        taxAmount: sale.taxAmount,
        totalAmount: sale.totalAmount,
        profit: sale.profit
      });
      if (fallbackError) throw fallbackError;
    }
  },

  deleteSale: async (id: string) => {
    if (!supabase) return;
    await supabase.from('sales').delete().eq('id', id);
  },

  getExpenses: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (error) return [];
    return data || [];
  },

  addExpense: async (expense: Expense) => {
    if (!supabase) return;
    const { error } = await supabase.from('expenses').insert(expense);
    if (error) throw error;
  },

  deleteExpense: async (id: string) => {
    if (!supabase) return;
    await supabase.from('expenses').delete().eq('id', id);
  }
};
