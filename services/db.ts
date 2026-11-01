
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

const COMMISSIONS_KEY = 'smart_shop_user_commissions';
const SALES_META_KEY = 'smart_shop_sales_meta';

export const DB = {
  isConnected: () => !!supabase,

  // مدیریت حافظه محلی برای پورسانت‌ها و متادیتا
  getStoredCommissions: (): Record<string, number> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(COMMISSIONS_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('خطا در خواندن درصد پورسانت‌ها از حافظه محلی:', e);
    }
    return {};
  },

  setStoredCommission: (userId: string, rate: number) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rates = DB.getStoredCommissions();
        rates[userId] = rate;
        localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(rates));
      }
    } catch (e) {
      console.warn('خطا در ذخیره درصد پورسانت در حافظه محلی:', e);
    }
  },

  setStoredCommissionsBulk: (newRates: Record<string, number>) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rates = { ...DB.getStoredCommissions(), ...newRates };
        localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(rates));
      }
    } catch (e) {
      console.warn('خطا در ذخیره یکجای پورسانت‌ها:', e);
    }
  },

  getStoredSalesMeta: (): Record<string, { sellerId?: string; sellerName?: string }> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(SALES_META_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('خطا در خواندن مشخصات فروشندگان فاکتورها:', e);
    }
    return {};
  },

  setStoredSaleMeta: (saleId: string, meta: { sellerId?: string; sellerName?: string }) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const allMeta = DB.getStoredSalesMeta();
        allMeta[saleId] = meta;
        localStorage.setItem(SALES_META_KEY, JSON.stringify(allMeta));
      }
    } catch (e) {
      console.warn('خطا در ذخیره مشخصات فروشنده فاکتور:', e);
    }
  },

  getUsers: async (): Promise<User[]> => {
    let usersList: User[] = [];
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) {
        usersList = data;
      }
    }
    // ادغام درصد پورسانت‌های ذخیره شده با داده‌های کاربران
    const savedRates = DB.getStoredCommissions();
    return usersList.map(u => ({
      ...u,
      commissionRate: savedRates[u.id] !== undefined 
        ? savedRates[u.id] 
        : (typeof u.commissionRate === 'number' ? u.commissionRate : 5)
    }));
  },

  saveUser: async (user: User) => {
    // ابتدا در حافظه محلی ذخیره می‌کنیم تا بلافاصله پایدار بماند
    if (typeof user.commissionRate === 'number') {
      DB.setStoredCommission(user.id, user.commissionRate);
    }

    if (!supabase) return;
    const userPayload: any = {
      id: user.id,
      username: user.username,
      password: user.password,
      role: user.role,
      fullName: user.fullName
    };
    if (typeof user.commissionRate === 'number') {
      userPayload.commissionRate = user.commissionRate;
    }

    const { error } = await supabase.from('users').upsert(userPayload);
    if (error && userPayload.commissionRate !== undefined) {
      // اگر جدول ریموت ستون commissionRate نداشت، بدون آن در دیتابیس ثبت می‌شود
      delete userPayload.commissionRate;
      await supabase.from('users').upsert(userPayload);
    }
  },

  saveUserCommission: async (userId: string, rate: number) => {
    DB.setStoredCommission(userId, rate);
    if (!supabase) return;
    // تلاش برای به‌روزرسانی ستون ریموت در صورت وجود
    try {
      await supabase.from('users').update({ commissionRate: rate }).eq('id', userId);
    } catch {
      // اگر ستون ریموت وجود نداشت خطایی ندهد
    }
  },

  deleteUser: async (id: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rates = DB.getStoredCommissions();
        delete rates[id];
        localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(rates));
      }
    } catch {
      // ignore
    }
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

  upsertProducts: async (productsList: Product[]) => {
    if (!supabase || productsList.length === 0) return;
    const payload = productsList.map(product => ({
      id: product.id,
      code: product.code,
      name: product.name,
      size: product.size,
      color: product.color,
      buyPrice: product.buyPrice ?? 0,
      sellPrice: product.sellPrice ?? 0,
      stock: product.stock,
      reorderPoint: product.reorderPoint
    }));
    
    const { error } = await supabase.from('products').upsert(payload);
    if (error) {
      console.warn('Supabase bulk upsert failed, falling back to sequential upsert:', error.message);
      for (const prod of productsList) {
        await DB.upsertProduct(prod);
      }
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
    const salesList: Sale[] = data || [];
    // ادغام اطلاعات فروشنده (sellerId, sellerName) از حافظه محلی
    const salesMeta = DB.getStoredSalesMeta();
    return salesList.map(s => {
      const meta = salesMeta[s.id];
      return {
        ...s,
        sellerId: s.sellerId || meta?.sellerId,
        sellerName: s.sellerName || meta?.sellerName
      };
    });
  },

  addSale: async (sale: Sale) => {
    // ذخیره مشخصات فروشنده در حافظه محلی
    if (sale.sellerId || sale.sellerName) {
      DB.setStoredSaleMeta(sale.id, {
        sellerId: sale.sellerId,
        sellerName: sale.sellerName
      });
    }

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
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const salesMeta = DB.getStoredSalesMeta();
        delete salesMeta[id];
        localStorage.setItem(SALES_META_KEY, JSON.stringify(salesMeta));
      }
    } catch {
      // ignore
    }
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
